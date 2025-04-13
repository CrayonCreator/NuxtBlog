import { eventHandler } from 'h3'
import { BlogModel, connectToDatabase, UserModel } from '../db'

export default eventHandler(async (event) => {
  try {
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
        statusMessage: '文章不存在'
      })
    }

    const author = await UserModel.findOne({ id: blog.authorId })
    
    return {
      blog: {
        id: blog.id,
        title: blog.title,
        content: blog.content,
        authorId: blog.authorId,
        author: author ? {
          id: author.id,
          username: author.username
        } : null,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt
      }
    }
  } catch (e) {
    console.log('文章获取失败' + e)
    return createError({
      statusCode: 500,
      statusMessage: '文章获取失败'
    })
  }
})