// 注册
import { createRouter, H3Event , createError } from "h3";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { connectToDatabase, UserModel } from "./db"; 
import { sendVerificationEmail , generateVerificationCode } from "../utils/emailSender";
import { VerificationCodeModel } from "./db";
const JWT_SECRET: string = process.env.JWT_SECRET || "DEFAULE";
const router = createRouter();

// 发送验证码
router.post("/send-verification-code", eventHandler(async (event: H3Event) => {
  try{
    await connectToDatabase();
    const body = await readBody(event);

    if (!body.email) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱是必填的"
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱格式不正确"
      });
    }
    
    const existingUser = await UserModel.findOne({ email: body.email });
    if (existingUser) {
      return createError({
        statusCode: 409,
        statusMessage: "该邮箱已被注册"
      });
    }
    
    const verificationCode = generateVerificationCode(6);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    await VerificationCodeModel.deleteMany({ email: body.email });

    const newVerificationCode = new VerificationCodeModel({
      email: body.email,
      code: verificationCode,
      createdAt: new Date(),
      expiresAt
    });

    await newVerificationCode.save();
    const emailSent = await sendVerificationEmail(body.email, verificationCode);

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
  }catch (error) {
    console.error("发送验证码失败", error);
    return createError({
      statusCode: 500,
      statusMessage: "发送验证码失败"
    })
  }
}))

// 注册
router.post("/register", eventHandler(async (event: H3Event) => {
  try {
    await connectToDatabase();
    // 获取请求体
    const body = await readBody(event);
    
    // 验证请求体
    if (!body.username || !body.email || !body.password) {
      return createError({
        statusCode: 400,
        statusMessage: "用户名、邮箱和密码是必填的"
      })
    }

    // 检查用户是否已存在
    const existingUser = await UserModel.findOne({ email: body.email });
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
    });

    if (!verificationRecord) {
      return createError({
        statusCode: 400,
        statusMessage: "验证码无效或已过期"
      })
    }

    await VerificationCodeModel.deleteOne({
      _id: verificationRecord._id
    });

    // 哈希密码
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(body.password, salt);

    // 创建用户
    const userId = nanoid();
    const newUser = new UserModel({
      id: userId,
      username: body.username,
      email: body.email,
      password: hashedPassword,
      createdAt: new Date()
    });
    await newUser.save();

    // 生成 JWT
    const token = jwt.sign({
      id: userId,
      email: body.email
    }, 
    JWT_SECRET,
    { 
      expiresIn: "7d" 
    });

    return {
      user :{
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
      token
    }
  }catch (error) {
    console.error("注册失败", error);
    return createError({
      statusCode: 500,
      statusMessage: "注册失败"
    })
  }
}))

// 登录
router.post("/login", eventHandler(async (event: H3Event) => {
  try{
    await connectToDatabase();
    const body = await readBody(event);
    // 验证请求体
    if (!body.email || !body.password) {
      return createError({
        statusCode: 400,
        statusMessage: "邮箱和密码是必填的"
      })
    }
    // 查找用户
    const user = await UserModel.findOne({ email: body.email });
    if (!user) {
      return createError({
        statusCode: 401,
        statusMessage: "用户不存在"
      })
    }
    // 验证密码
    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return createError({
        statusCode: 401,
        statusMessage: "密码错误"
      })
    }
    // 生成 JWT
    const token = jwt.sign({
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    });
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    }

  }catch (error) {
    console.error("登录失败", error);
    return createError({
      statusCode: 500,
      statusMessage: "登录失败"
    })
  }
}))

// 忘记密码


export default defineEventHandler((event)=>{
  return router.handler(event)
})