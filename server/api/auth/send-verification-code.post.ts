import { eventHandler , readBody , createError } from 'h3'
import { connectToDatabase, VerificationCodeModel, UserModel } from '../db'
import { sendVerificationEmail, generateVerificationCode } from '../../utils/emailSender'

export default eventHandler(async (event) => {
  try {
    await connectToDatabase()
    const body = await readBody(event)

    if (!body.email) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱是必填的"
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱格式不正确"
      })
    }

    // 检查是否为"忘记密码"类型
    const isPasswordReset = body.type === 'reset'

    const existingUser = await UserModel.findOne({ email: body.email })
    // 如果是注册，邮箱已存在则报错
    // 如果是重置密码，邮箱不存在则报错
    if (!isPasswordReset && existingUser) {
      return createError({
        statusCode: 409,
        statusMessage: "该邮箱已被注册"
      })
    } else if (isPasswordReset && !existingUser) {
      return createError({
        statusCode: 404,
        statusMessage: "该邮箱未注册"
      })
    }

    const verificationCode = generateVerificationCode(6)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟后过期

    await VerificationCodeModel.deleteMany({ email: body.email })

    const newVerificationCode = new VerificationCodeModel({
      email: body.email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt
    })

    await newVerificationCode.save()
    const emailSent = await sendVerificationEmail(body.email, verificationCode)

    if (!emailSent) {
      return createError({
        statusCode: 500,
        statusMessage: "发送验证码失败"
      })
    }

    return {
      message: "验证码已发送，请检查您的邮箱",
      email: body.email,
    }
  } catch (error) {
    console.error("发送验证码失败", error)
    return createError({
      statusCode: 500,
      statusMessage: "发送验证码失败"
    })
  }
})
