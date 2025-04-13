<template>
  <div>
    <NavBar />
    
    <div class="container">
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <article v-else-if="blog" class="blog-article">
        <div class="blog-header">
          <h1 class="blog-title">{{ blog.title }}</h1>
          <div class="blog-meta">
            <div class="author">
              <span class="author-name">{{ blog.author?.username || '未知作者' }}</span>
            </div>
            <div class="date-info">
              <span class="published-date">发布于 {{ formatDate(blog.createdAt) }}</span>
              <span v-if="isUpdated" class="updated-date">更新于 {{ formatDate(blog.updatedAt) }}</span>
            </div>
          </div>
        </div>
        
        <div class="blog-actions" v-if="isAuthor">
          <nuxt-link :to="`/revise?id=${blog.id}`" class="btn btn-edit">编辑文章</nuxt-link>
          <button @click="deleteBlog" class="btn btn-delete">删除文章</button>
        </div>
        
        <div class="blog-content markdown-body" v-html="renderedContent"></div>
      </article>
      
      <div v-else class="error-message">
        找不到文章
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';

interface Author {
  id: string;
  username: string;
}

interface Blog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: Author | null;
  createdAt: string;
  updatedAt: string;
}

const route = useRoute();
const router = useRouter();

const blog = ref<Blog | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

onMounted(fetchBlog);

const renderedContent = computed(() => {
  if (!blog.value) return '';
  return marked(blog.value.content);
});

const isUpdated = computed<boolean>(() => {
  if (!blog.value) return false;
  const created = new Date(blog.value.createdAt).getTime();
  const updated = new Date(blog.value.updatedAt).getTime();
  return updated - created > 1000; // 如果更新时间比创建时间晚1秒以上
});

const isAuthor = computed<boolean>(() => {
  if (!blog.value) return false;
  const userId = getUserIdFromToken();
  return !!userId && userId === blog.value.authorId;
});

async function fetchBlog(): Promise<void> {
  const blogId = route.params.id as string;
  if (!blogId) {
    error.value = '文章ID无效';
    loading.value = false;
    return;
  }
  
  try {
    const { data, error: fetchError } = await useFetch<{blog: Blog}>(`/api/blog/${blogId}`);
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || '获取文章失败');
    }
    
    if (data.value && data.value.blog) {
      blog.value = data.value.blog;
    } else {
      error.value = '文章不存在';
    }
  } catch (err: any) {
    console.error('获取文章详情失败:', err);
    error.value = err?.message || '获取文章详情失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function getUserIdFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (e) {
    return null;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function deleteBlog(): Promise<void> {
  if (!blog.value) return;
  
  if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    const response = await fetch(`/api/blog/${blog.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || '删除失败');
    }
    
    // 删除成功后返回首页
    router.push('/');
  } catch (err: any) {
    console.error('删除文章失败:', err);
    alert(err?.message || '删除文章失败，请稍后重试');
  }
}
</script>

<style>
.container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4361ee;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #718096;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.blog-article {
  background-color: #ffffff;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.blog-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1.5rem;
}

.blog-title {
  font-size: 2.25rem;
  color: #2d3748;
  margin-bottom: 1rem;
  line-height: 1.3;
}

.blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: #718096;
}

.author-name {
  font-weight: 600;
  color: #4a5568;
}

.date-info {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.updated-date {
  color: #a0aec0;
  margin-top: 0.25rem;
}

.blog-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-decoration: none;
  display: inline-block;
}

.btn-edit {
  background-color: #ebf4ff;
  color: #4361ee;
}

.btn-edit:hover {
  background-color: #d3e4ff;
}

.btn-delete {
  background-color: #fff5f5;
  color: #e53e3e;
}

.btn-delete:hover {
  background-color: #fed7d7;
}

.blog-content {
  line-height: 1.8;
  color: #2d3748;
}

/* Markdown 样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.markdown-body h1 {
  font-size: 2em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 1em;
}

.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
  margin-bottom: 1em;
}

.markdown-body code {
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  padding: 0.2em 0.4em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 1em;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-body blockquote {
  margin: 0 0 1em;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1em 0;
}
</style>
