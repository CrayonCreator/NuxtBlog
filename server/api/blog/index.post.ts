import { eventHandler } from 'h3'
import { BlogModel, connectToDatabase } from '../db'
import jwtMiddleware from '../../middlewares/jwt'
import { nanoid } from 'nanoid'

export default eventHandler(async (event) => {
  try {
    const user = await jwtMiddleware(event)

    if (!user || 'statusCode' in user) {
      return createError({
        statusCode: 401,
        statusMessage: '未授权访问'
      })
    }

    await connectToDatabase()
    const body = await readBody(event)
    if (!body.title || !body.content) {
      return createError({
        statusCode: 400,
        statusMessage: '标题和内容是必填的'
      })
    }

    const blogId = nanoid()
    const newBlog = new BlogModel({
      id: blogId,
      title: body.title,
      content: body.content,
      authorId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await newBlog.save()

    return {
      message: '文章创建成功',
      blog: {
        id: newBlog.id,
        title: newBlog.title,
        content: newBlog.content,
        authorId: newBlog.authorId,
        createdAt: newBlog.createdAt,
        updatedAt: newBlog.updatedAt
      }
    }
  } catch (e) {
    console.log("文章创建失败" + e)
    return createError({
      statusCode: 500,
      statusMessage: '文章创建失败'
    })
  }
})