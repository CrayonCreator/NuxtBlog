import { eventHandler } from 'h3'
import { BlogModel, connectToDatabase, UserModel } from '../db'

export default eventHandler(async (event) => {
  try {
    await connectToDatabase()
    const query = getQuery(event)

    const filter: any = {}

    if (query.authorId) {
      filter.authorId = query.authorId
    }

    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 10
    const skip = (page - 1) * limit

    const blogs = await BlogModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    const total = await BlogModel.countDocuments(filter)

    const authorIds = [...new Set(blogs.map((blog) => blog.authorId))]
    const authors = await UserModel.find({ id: { $in: authorIds } })

    const blogsWithAuthor = blogs.map(blog => {
      const author = authors.find(user => user.id === blog.authorId)
      return {
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
    })

    return {
      blogs: blogsWithAuthor,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (e) {
    console.log("文章获取失败" + e)
    return createError({
      statusCode: 500,
      statusMessage: '文章获取失败'
    })
  }
})