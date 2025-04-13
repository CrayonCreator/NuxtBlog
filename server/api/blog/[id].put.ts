import { eventHandler } from 'h3'
import { BlogModel, connectToDatabase } from '../db'
import jwtMiddleware from '../../middlewares/jwt'

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

    const id = event.context.params?.id
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: '缺少文章ID'
      })
    }

    const blog = await BlogModel.findOne({ id })
    if (!blog) {
      return createError({
        statusCode: 404,
        statusMessage: "文章不存在"
      })
    }

    if (blog.authorId !== user.id) {
      return createError({
        statusCode: 403,
        statusMessage: '无权更新他人的文章'
      })
    }

    const body = await readBody(event)
    if (body.title) blog.title = body.title
    if (body.content) blog.content = body.content

    blog.updatedAt = new Date()
    await blog.save()

    return {
      message: "文章更新成功",
      blog: {
        id: blog.id,
        title: blog.title,
        content: blog.content,
        authorId: blog.authorId,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt
      }
    }
  } catch (e) {
    console.error('更新博客失败:', e)
    return createError({
      statusCode: 500,
      statusMessage: '更新博客失败'
    })
  }
})