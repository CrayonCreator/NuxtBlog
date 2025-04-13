<template>
  <div>
    <NavBar />
    
    <div class="editor-page">
      <div class="container">
        <div class="editor-header">
          <h1 class="editor-title">{{ isNewPost ? '创建新文章' : '编辑文章' }}</h1>
          <div class="editor-actions">
            <button @click="savePost" class="btn btn-primary" :disabled="isSaving">
              {{ isSaving ? '保存中...' : '保存文章' }}
            </button>
            <button @click="cancel" class="btn btn-outline">取消</button>
          </div>
        </div>
        
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else class="editor-container">
          <div class="title-input">
            <input 
              v-model="post.title" 
              type="text" 
              class="form-control title-field"
              placeholder="输入文章标题..." 
              required
            />
          </div>
          
          <div class="split-editor">
            <div class="editor-pane">
              <div class="pane-header">
                <h3>编辑</h3>
                <span class="markdown-hint">支持 Markdown 格式</span>
              </div>
              <textarea 
                v-model="post.content" 
                class="content-editor"
                placeholder="在这里开始编写文章内容..." 
                required
              ></textarea>
            </div>
            
            <div class="preview-pane">
              <div class="pane-header">
                <h3>预览</h3>
              </div>
              <div class="content-preview markdown-body" v-html="renderedContent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';

interface Post {
  title: string;
  content: string;
}

interface BlogResponse {
  blog: {
    id: string;
    title: string;
    content: string;
    authorId: string;
    createdAt: string;
    updatedAt: string;
  }
}

const route = useRoute();
const router = useRouter();

const post = ref<Post>({
  title: '',
  content: ''
});

const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const isSaving = ref<boolean>(false);

const isNewPost = computed<boolean>(() => {
  return route.query.new === 'true';
});

const blogId = computed<string | undefined>(() => {
  return route.query.id as string | undefined;
});

const renderedContent = computed(() => {
  if (!post.value.content) return '<div class="empty-preview">预览将显示在这里</div>';
  return marked(post.value.content || '');
});

onMounted(async () => {
  if (import.meta.client) {
    const token = localStorage.getItem('token');
    if (!token) {
      error.value = '请先登录';
      return;
    }
    
    if (blogId.value && !isNewPost.value) {
      await fetchBlog(blogId.value);
    }
  }
});

async function fetchBlog(id: string): Promise<void> {
  loading.value = true;
  error.value = null;
  
  try {
    const { data, error: fetchError } = await useFetch<BlogResponse>(`/api/blog/${id}`);
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || '获取文章失败');
    }
    
    if (data.value && data.value.blog) {
      const blog = data.value.blog;
      
      const userId = getUserIdFromToken();
      if (userId !== blog.authorId) {
        error.value = '您没有权限编辑此文章';
        return;
      }
      
      post.value = {
        title: blog.title,
        content: blog.content
      };
    } else {
      error.value = '文章不存在';
    }
  } catch (err: any) {
    console.error('获取文章失败:', err);
    error.value = err?.message || '获取文章失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function getUserIdFromToken(): string | null {
  if (!import.meta.client) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (e) {
    return null;
  }
}

async function savePost(): Promise<void> {
  if (!post.value.title.trim()) {
    alert('请输入文章标题');
    return;
  }
  
  if (!post.value.content.trim()) {
    alert('请输入文章内容');
    return;
  }
  
  if (!import.meta.client) return;
  
  const token = localStorage.getItem('token');
  if (!token) {
    error.value = '请先登录';
    return;
  }
  
  isSaving.value = true;
  
  try {
    let response: Response;
    
    if (isNewPost.value) {
      response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: post.value.title,
          content: post.value.content
        })
      });
    } else if (blogId.value) {
      response = await fetch(`/api/blog/${blogId.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: post.value.title,
          content: post.value.content
        })
      });
    } else {
      throw new Error('缺少博客ID');
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.statusMessage || '保存失败');
    }
    
    const data = await response.json() as { blog: { id: string } };
    
    router.push(`/blog/${data.blog.id}`);
  } catch (err: any) {
    console.error('保存文章失败:', err);
    alert(err?.message || '保存文章失败，请稍后重试');
  } finally {
    isSaving.value = false;
  }
}

function cancel(): void {
  if (isNewPost.value) {
    router.push('/');
  } else if (blogId.value) {
    router.push(`/blog/${blogId.value}`);
  } else {
    router.push('/');
  }
}
</script>

<style scoped>
.editor-page {
  background-color: #f8fafc;
  min-height: calc(100vh - 70px);
  padding: 2rem 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.editor-title {
  color: #2d3748;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.editor-actions {
  display: flex;
  gap: 1rem;
}

.editor-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.title-input {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.title-field {
  width: 100%;
  border: none;
  font-size: 1.5rem;
  font-weight: 600;
  padding: 0.5rem 0;
  color: #2d3748;
}

.title-field:focus {
  outline: none;
}

.title-field::placeholder {
  color: #a0aec0;
}

.split-editor {
  display: flex;
  height: calc(100vh - 240px);
  min-height: 500px;
}

.editor-pane, .preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-pane {
  border-right: 1px solid #e2e8f0;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.pane-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #4a5568;
  margin: 0;
}

.markdown-hint {
  font-size: 0.875rem;
  color: #718096;
}

.content-editor {
  flex: 1;
  resize: none;
  border: none;
  padding: 1.5rem;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 1rem;
  line-height: 1.6;
  color: #2d3748;
  background-color: #ffffff;
}

.content-editor:focus {
  outline: none;
}

.content-preview {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: #ffffff;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #a0aec0;
  font-style: italic;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(67, 97, 238, 0.1);
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
  border-radius: 12px;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #4361ee;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #3a56de;
}

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.btn-outline:hover {
  border-color: #4361ee;
  color: #4361ee;
}

@media (max-width: 768px) {
  .split-editor {
    flex-direction: column;
    height: auto;
  }
  
  .editor-pane, .preview-pane {
    height: 400px;
  }
  
  .editor-pane {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
}
</style>

<style>
/* Markdown 样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #2d3748;
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

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 0.5em 1em;
}

.markdown-body table th {
  background-color: #f6f8fa;
}
</style>