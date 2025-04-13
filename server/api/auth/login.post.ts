import { eventHandler } from 'h3'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { connectToDatabase, UserModel } from '../db'

const JWT_SECRET: string = process.env.JWT_SECRET || "DEFAULE"

export default eventHandler(async (event) => {
  try {
    await connectToDatabase()
    const body = await readBody(event)
    // 验证请求体
    if (!body.email || !body.password) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱和密码是必填的"
      })
    }
    // 查找用户
    const user = await UserModel.findOne({ email: body.email })
    if (!user) {
      return createError({
        statusCode: 401,
        statusMessage: "用户不存在"
      })
    }
    // 验证密码
    const isMatch = await bcrypt.compare(body.password, user.password)
    if (!isMatch) {
      return createError({
        statusCode: 401,
        statusMessage: "密码错误"
      })
    }
    // 生成 JWT
    const token = jwt.sign({
      id: user.id,
      email: user.email,
      username: user.username // 确保token中包含用户名
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    })
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    }
  } catch (error) {
    console.error("登录失败", error)
    return createError({
      statusCode: 500,
      statusMessage: "登录失败"
    })
  }
})