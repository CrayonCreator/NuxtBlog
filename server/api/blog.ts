import { createRouter, H3Event  } from 'h3';
import { BlogModel, connectToDatabase , UserModel } from './db'; 
import  jwtMiddleware from '../middlewares/jwt';
import { nanoid } from 'nanoid';
const router = createRouter();

router.get('/',eventHandler(async(event : H3Event)=>{
    try{
      await connectToDatabase();
      const query = getQuery(event);

      const filter:any = {};

      if(query.authorId){
        filter.authorId = query.authorId;
      }

      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const blogs = await BlogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await BlogModel.countDocuments(filter);

      const authorIds = [...new Set(blogs.map((blog) => blog.authorId))];
      const authors = await UserModel.find({ id: { $in: authorIds } });

      const blogsWithAuthor = blogs.map(blog => {
        const author = authors.find(user => user.id === blog.authorId);
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
        };
      });

      return {
        blogs: blogsWithAuthor,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }catch(e){
        console.log("文章获取失败"+e);
        return createError({
          statusCode: 500,
          statusMessage: '文章获取失败'
        })
    }
}))

// 获取单篇
router.get('/:id',eventHandler( async (event: H3Event) => {
  try{
    await connectToDatabase();
    const id = getQuery(event).id;
    if(!id){
      return {
        code: 400,
        message: '缺少文章ID'
      }
    }

    const blog = await BlogModel.findOne({ id });
    if(!blog){
      return createError({
        statusCode: 404,
        statusMessage: '文章不存在'
      })
    }

    const author = await UserModel.findOne({ id: blog.authorId });
    if(!author){
      return createError({
        statusCode: 404,
        statusMessage: '作者不存在'
      })
    }

    return {
      blog:{
        id: blog.id,
        title: blog.title,
        content: blog.content,
        authorId: blog.authorId,
        author:author?{
          id: author.id,
          username: author.username
        }:null,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt
      }
    }

  }catch(e){
    console.log('文章获取失败'+e);
    return createError({
      statusCode: 500,
      statusMessage: '文章获取失败'
    })
  }
}))

// 创建
router.post('/', eventHandler(async (event: H3Event) => {
  try{
    const user = await jwtMiddleware(event);

    if(!user || 'statusCode' in user){
      return createError({
        statusCode: 401,
        statusMessage: '未授权访问'
      })
    }

    await connectToDatabase();
    const body = await readBody(event);
    if(!body.title || !body.content){
      return createError({
        statusCode: 400,
        statusMessage: '标题和内容是必填的'
      })
    }

    const blogId = nanoid();
    const newBlog = new BlogModel({
      id: blogId,
      title: body.title,
      content: body.content,
      authorId: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await newBlog.save();

    return {
      message: '文章创建成功',
      blog:{
        id: newBlog.id,
        title: newBlog.title,
        content: newBlog.content,
        authorId: newBlog.authorId,
        createdAt: newBlog.createdAt,
        updatedAt: newBlog.updatedAt
      }
    }
  }catch(e){
    console.log("文章创建失败"+e);
    return createError({
      statusCode: 500,
      statusMessage: '文章创建失败'
    })
  }
}))

// 更新

router.put('/:id', eventHandler(async (event: H3Event) => {
  try{
    const user = await jwtMiddleware(event);
    if(!user || 'statusCode' in user){
      return createError({
        statusCode: 401,
        statusMessage: '未授权访问'
      })
    }

    await connectToDatabase();

    const id = getQuery(event).id;
    if(!id){
      return createError({
        statusCode: 400,
        statusMessage: '缺少文章ID'
      })
    }

    const blog = await BlogModel.findOne({ id });
    if(!blog){
      return createError({
        statusCode:404,
        message:"文章不存在"
      })
    }

    if (blog.authorId !== user.id) {
      return createError({
        statusCode: 403,
        message: '无权更新他人的文章'
      });
    }

    const body = await readBody(event);
    if (body.title) blog.title = body.title;
    if (body.content) blog.content = body.content;

    blog.updatedAt = new Date();

    return {
      message:"文章更新成功",
      blog:{
        id: blog.id,
        title: blog.title,
        content: blog.content,
        authorId: blog.authorId,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt
      }
    }
  }catch(e){
    console.error('更新博客失败:', e);
    return createError({
      statusCode: 500,
      message: '更新博客失败'
    });
  }
}))

// 删除

router.delete('/:id',eventHandler(async (event:H3Event)=>{
  try{
    const user = await jwtMiddleware(event);

    if(!user || 'statusCode' in user){
      return createError({
        statusCode:401,
        message:"未授权，请登录"
      })
    }

    await connectToDatabase();

    const id = getQuery(event).id;
    if(!id){
      return createError({
        statusCode:400,
        message:"文章ID缺失"
      })
    }

    const blog = await BlogModel.findOne({id});

    if(!blog){
      return createError({
        statusCode:404,
        message:"文章不存在"
      })
    }

    if (blog.authorId !== user.id) {
      return createError({
        statusCode: 403,
        message: '无权删除他人的文章'
      });
    }

    await BlogModel.deleteOne({id});

    return {
      message:"成功删除",
      id
    }
  }catch (error) {
    console.error('删除博客失败:', error);
    return createError({
      statusCode: 500,
      message: '删除博客失败'
    });
  }
}))

export default defineEventHandler((event)=>{
  return router.handler(event);
})