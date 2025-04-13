import { eventHandler } from 'h3'
import bcrypt from "bcrypt"
import { nanoid } from "nanoid"
import jwt from "jsonwebtoken"
import { connectToDatabase, UserModel, VerificationCodeModel } from '../db'

const JWT_SECRET: string = process.env.JWT_SECRET || "DEFAULE"

export default eventHandler(async (event) => {
  try {
    await connectToDatabase()
    // 获取请求体
    const body = await readBody(event)
    
    // 验证请求体
    if (!body.username || !body.email || !body.password) {
      return createError({
        statusCode: 400,
        statusMessage: "用户名、邮箱和密码是必填的"
      })
    }

    // 检查用户是否已存在
    const existingUser = await UserModel.findOne({ email: body.email })
    if (existingUser) {
      return createError({
        statusCode: 409,
        statusMessage: "该邮箱已被注册"
      })
    }

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

    await VerificationCodeModel.deleteOne({
      _id: verificationRecord._id
    })

    // 哈希密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(body.password, salt)

    // 创建用户
    const userId = nanoid()
    const newUser = new UserModel({
      id: userId,
      username: body.username,
      email: body.email,
      password: hashedPassword,
      createdAt: new Date()
    })
    await newUser.save()

    // 生成 JWT
    const token = jwt.sign({
      id: userId,
      email: body.email,
      username: body.username // 确保JWT包含用户名
    }, 
    JWT_SECRET,
    { 
      expiresIn: "7d" 
    })

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      token
    }
  } catch (error) {
    console.error("注册失败", error)
    return createError({
      statusCode: 500,
      statusMessage: "注册失败"
    })
  }
})