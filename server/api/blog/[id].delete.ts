import { eventHandler } from 'h3'
import { BlogModel, connectToDatabase } from '../db'
import jwtMiddleware from '../../middlewares/jwt'

export default eventHandler(async (event) => {
  try {
    const user = await jwtMiddleware(event)

    if (!user || 'statusCode' in user) {
      return createError({
        statusCode: 401,
        statusMessage: "未授权，请登录"
      })
    }

    await connectToDatabase()

    const id = event.context.params?.id
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: "文章ID缺失"
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
        statusMessage: '无权删除他人的文章'
      })
    }

    await BlogModel.deleteOne({ id })

    return {
      message: "成功删除",
      id
    }
  } catch (error) {
    console.error('删除博客失败:', error)
    return createError({
      statusCode: 500,
      statusMessage: '删除博客失败'
    })
  }
})