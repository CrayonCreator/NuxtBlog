import { H3Event } from "h3";
import jwt from "jsonwebtoken";
import { connectToDatabase , UserModel } from "../api/db"; 
import {UserSend} from "../type/User";
const JWT_SECRET = process.env.JWT_SECRET || "DEFAULE";

export default async function jwtMiddleware(event:H3Event){
  // 检查请求头
  const authHeader = event.node.req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return createError({
      statusCode: 401,
      message: "未授权访问"
    });
  }

  const token = authHeader.substring(7);
  try{
    // 验证
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, email: string };

    await connectToDatabase();
    const user = await UserModel.findOne({ id: decoded.id });

    if (!user) {
      return createError({
        statusCode: 401,
        message: "用户不存在"
      });
    }

    const userData: UserSend = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
    event.context.user = userData;
    return userData;
  }catch (error) {
    console.error("JWT验证失败", error);
    return createError({
      statusCode: 401,
      message: "无效的令牌"
    });
  }
}