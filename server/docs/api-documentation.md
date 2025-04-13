# WebHomework API 文档

本文档提供了WebHomework应用程序的所有API端点的详细说明，包括请求方法、URL路径、所需参数和返回格式。

## 目录

- [认证相关 API](#认证相关-api)
  - [发送验证码](#发送验证码)
  - [用户注册](#用户注册)
  - [用户登录](#用户登录)
  - [重置密码](#重置密码)
- [博客相关 API](#博客相关-api)
  - [获取博客列表](#获取博客列表)
  - [获取单篇博客](#获取单篇博客)
  - [创建博客](#创建博客)
  - [更新博客](#更新博客)
  - [删除博客](#删除博客)

## 认证相关 API

### 发送验证码

用于发送电子邮件验证码，可用于注册或重置密码流程。

- **URL:** `/api/auth/send-verification-code`
- **方法:** `POST`
- **请求体:**

```json
{
  "email": "user@example.com",
  "type": "register" // 可选，类型：register(注册) 或 reset(重置密码)
}
```

- **成功响应 (200):**

```json
{
  "message": "验证码已发送，请检查您的邮箱",
  "email": "user@example.com"
}
```

- **错误响应:**

```json
{
  "statusCode": 400,
  "statusMessage": "邮箱格式不正确"
}
```

```json
{
  "statusCode": 409,
  "statusMessage": "该邮箱已被注册"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "发送验证码失败"
}
```

### 用户注册

注册新用户账户。

- **URL:** `/api/auth/register`
- **方法:** `POST`
- **请求体:**

```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "password123",
  "verificationCode": "123456"
}
```

- **成功响应 (200):**

```json
{
  "user": {
    "id": "unique_id",
    "username": "username",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

- **错误响应:**

```json
{
  "statusCode": 400,
  "statusMessage": "用户名、邮箱和密码是必填的"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "验证码无效或已过期"
}
```

```json
{
  "statusCode": 409,
  "statusMessage": "该邮箱已被注册"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "注册失败"
}
```

### 用户登录

用户登录接口，提供jwt令牌。

- **URL:** `/api/auth/login`
- **方法:** `POST`
- **请求体:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **成功响应 (200):**

```json
{
  "user": {
    "id": "unique_id",
    "username": "username",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here"
}
```

- **错误响应:**

```json
{
  "statusCode": 400,
  "statusMessage": "邮箱和密码是必填的"
}
```

```json
{
  "statusCode": 401,
  "statusMessage": "用户不存在"
}
```

```json
{
  "statusCode": 401,
  "statusMessage": "密码错误"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "登录失败"
}
```

### 重置密码

重置用户密码。

- **URL:** `/api/auth/reset-password`
- **方法:** `POST`
- **请求体:**

```json
{
  "email": "user@example.com",
  "verificationCode": "123456",
  "newPassword": "newpassword123"
}
```

- **成功响应 (200):**

```json
{
  "message": "密码重置成功"
}
```

- **错误响应:**

```json
{
  "statusCode": 400,
  "statusMessage": "邮箱、验证码和新密码是必填的"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "验证码无效或已过期"
}
```

```json
{
  "statusCode": 404,
  "statusMessage": "用户不存在"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "密码重置失败"
}
```

## 博客相关 API

### 获取博客列表

获取博客文章列表，支持分页和作者筛选。

- **URL:** `/api/blog`
- **方法:** `GET`
- **查询参数:**
  - `page`: 页码 (默认: 1)
  - `limit`: 每页数量 (默认: 10)
  - `authorId`: 按作者ID筛选 (可选)

- **成功响应 (200):**

```json
{
  "blogs": [
    {
      "id": "blog_id",
      "title": "博客标题",
      "content": "博客内容...",
      "authorId": "author_id",
      "author": {
        "id": "author_id",
        "username": "作者用户名"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 获取单篇博客

通过ID获取单篇博客详情。

- **URL:** `/api/blog/:id`
- **方法:** `GET`
- **URL参数:**
  - `id`: 博客ID

- **成功响应 (200):**

```json
{
  "blog": {
    "id": "blog_id",
    "title": "博客标题",
    "content": "博客内容...",
    "authorId": "author_id",
    "author": {
      "id": "author_id",
      "username": "作者用户名"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

- **错误响应:**

```json
{
  "statusCode": 404,
  "statusMessage": "文章不存在"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "文章获取失败"
}
```

### 创建博客

创建新的博客文章 (需要登录认证)。

- **URL:** `/api/blog`
- **方法:** `POST`
- **请求头:**
  - `Authorization`: Bearer {jwt_token}
- **请求体:**

```json
{
  "title": "博客标题",
  "content": "博客内容..."
}
```

- **成功响应 (200):**

```json
{
  "message": "文章创建成功",
  "blog": {
    "id": "blog_id",
    "title": "博客标题",
    "content": "博客内容...",
    "authorId": "author_id",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

- **错误响应:**

```json
{
  "statusCode": 401,
  "statusMessage": "未授权访问"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "标题和内容是必填的"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "文章创建失败"
}
```

### 更新博客

更新已有的博客文章 (需要登录认证，且只能更新自己的文章)。

- **URL:** `/api/blog/:id`
- **方法:** `PUT`
- **请求头:**
  - `Authorization`: Bearer {jwt_token}
- **URL参数:**
  - `id`: 博客ID
- **请求体:**

```json
{
  "title": "更新后的标题",
  "content": "更新后的内容..."
}
```

- **成功响应 (200):**

```json
{
  "message": "文章更新成功",
  "blog": {
    "id": "blog_id",
    "title": "更新后的标题",
    "content": "更新后的内容...",
    "authorId": "author_id",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  }
}
```

- **错误响应:**

```json
{
  "statusCode": 401,
  "statusMessage": "未授权访问"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "缺少文章ID"
}
```

```json
{
  "statusCode": 404,
  "statusMessage": "文章不存在"
}
```

```json
{
  "statusCode": 403,
  "statusMessage": "无权更新他人的文章"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "更新博客失败"
}
```

### 删除博客

删除博客文章 (需要登录认证，且只能删除自己的文章)。

- **URL:** `/api/blog/:id`
- **方法:** `DELETE`
- **请求头:**
  - `Authorization`: Bearer {jwt_token}
- **URL参数:**
  - `id`: 博客ID

- **成功响应 (200):**

```json
{
  "message": "成功删除",
  "id": "blog_id"
}
```

- **错误响应:**

```json
{
  "statusCode": 401,
  "statusMessage": "未授权，请登录"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "文章ID缺失"
}
```

```json
{
  "statusCode": 404,
  "statusMessage": "文章不存在"
}
```

```json
{
  "statusCode": 403,
  "statusMessage": "无权删除他人的文章"
}
```

```json
{
  "statusCode": 500,
  "statusMessage": "删除博客失败"
}
```

## 认证机制

所有需要身份验证的API都需要在HTTP请求头中包含JWT令牌：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

JWT令牌由用户登录或注册成功后返回，有效期为7天。
