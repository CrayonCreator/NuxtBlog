import { eventHandler } from 'h3'
import bcrypt from "bcrypt"
import { connectToDatabase, UserModel, VerificationCodeModel } from '../db'

export default eventHandler(async (event) => {
  try {
    await connectToDatabase()
    const body = await readBody(event)

    if (!body.email || !body.verificationCode || !body.newPassword) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱、验证码和新密码是必填的"
      })
    }

    // 验证验证码
    const verificationRecord = await VerificationCodeModel.findOne({
      email: body.email,
      code: body.verificationCode,
      expiresAt: { $gt: new Date() }
    })

    if (!verificationRecord) {
      return createError({
        statusCode: 400,
        statusMessage: "验证码无效或已过期"
      })
    }

    // 查找用户
    const user = await UserModel.findOne({ email: body.email })
    if (!user) {
      return createError({
        statusCode: 404,
        statusMessage: "用户不存在"
      })
    }

    // 哈希新密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(body.newPassword, salt)

    // 更新密码
    user.password = hashedPassword
    await user.save()

    // 删除验证码记录
    await VerificationCodeModel.deleteOne({
      _id: verificationRecord._id
    })

    return {
      message: "密码重置成功"
    }
  } catch (error) {
    console.error("密码重置失败", error)
    return createError({
      statusCode: 500,
      statusMessage: "密码重置失败"
    })
  }
})