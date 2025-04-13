import mongoose from "mongoose";
import {UserAuth} from "../type/User";
import {Blog} from "../type/Blog";
import { VerificationCode } from "../type/VerificationCode";
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/blog";

let cachedConnection : mongoose.Connection | null = null;

export async function connectToDatabase(){
  if(cachedConnection){
    return cachedConnection;
  }
  try{
    const connection = await mongoose.connect(MONGO_URL,{

    })
    console.log(`Connected to MongoDB at ${MONGO_URL}`);
    cachedConnection = connection.connection;
    return cachedConnection;
    
  }catch(err){
    console.error("Error connecting to MongoDB", err);
    throw err;
  }
  
}

// 用户模型
const userSchema = new mongoose.Schema<UserAuth>({
  id: {type: String, required: true},
  username: {type: String, required: true},
  email: {type: String, required: true},
  password: {type: String, required: true},
  createdAt: {type: Date, default: Date.now}
});

export const UserModel = mongoose.model<UserAuth>("User", userSchema);

// 文章模型

const blogSchema = new mongoose.Schema<Blog>({
  id: {type: String, required: true},
  title: {type: String, required: true},
  // markdown
  content: {type: String, required: true},
  authorId: {type: String, required: true},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now}
});
export const BlogModel = mongoose.model<Blog>("Blog", blogSchema);


// 验证码模型
const verificationCodeSchema = new mongoose.Schema<VerificationCode>({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const VerificationCodeModel = mongoose.model<VerificationCode>(
  "VerificationCode", 
  verificationCodeSchema
);
