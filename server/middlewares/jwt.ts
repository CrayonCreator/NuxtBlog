import { getRequestHeader, createError } from 'h3'
import jwt from 'jsonwebtoken'
import { connectToDatabase, UserModel } from "../api/db";
import { UserSend } from "../type/User";

// 解析JWT中携带的用户信息接口
interface UserPayload {
  id: string
  email: string
  username?: string // 添加可选的用户名字段
  iat?: number
  exp?: number
}

export default async function jwtMiddleware(event: any) {
  const authHeader = getRequestHeader(event, 'Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return createError({
      statusCode: 401,
      statusMessage: 'Authorization header is missing or invalid'
    })
  }
  
  const token = authHeader.split(' ')[1]
  
  if (!token) {
    return createError({
      statusCode: 401,
      statusMessage: 'Token is missing'
    })
  }
  
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT'
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload

    await connectToDatabase();
    const user = await UserModel.findOne({ id: decoded.id });

    if (!user) {
      return createError({
        statusCode: 401,
        statusMessage: "User does not exist"
      });
    }

    const userData: UserSend = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
    event.context.user = userData;

    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username // 返回用户名信息
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return createError({
      statusCode: 401,
      statusMessage: 'Token is invalid or expired'
    })
  }
}