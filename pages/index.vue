<template>
  <div>
    <NavBar />
    
    <div class="hero-section">
      <div class="container hero-container">
        <div class="hero-content">
          <h1 class="hero-title">{{ isMyArticles ? '我的文章' : '探索有趣的文章' }}</h1>
          <p class="hero-subtitle">{{ isMyArticles ? '管理和浏览你创建的内容' : '发现更多精彩的想法和观点' }}</p>
          
          <div v-if="isLoggedIn" class="user-profile">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info">
              <h3 class="user-name">{{ userName }}</h3>
              <p class="user-email">{{ userEmail }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="isLoggedIn && isMyArticles" class="hero-actions">
          <button @click="navigateToNewPost" class="btn btn-primary btn-lg">
            <span class="icon">+</span> 创建新文章
          </button>
        </div>
      </div>
      
      <div class="hero-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>
    
    <div class="container main-container">
      <div class="content-header">
        <div class="filter-options">
          <button 
            class="filter-btn" 
            :class="{ active: !isMyArticles }"
            @click="navigateToAllArticles"
          >
            所有文章
          </button>
          <button 
            v-if="isLoggedIn"
            class="filter-btn" 
            :class="{ active: isMyArticles }"
            @click="navigateToMyArticles"
          >
            我的文章
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>
      
      <div v-else-if="blogs.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <h2>{{ isMyArticles ? '你还没有创建任何文章' : '暂无文章' }}</h2>
        <p>{{ isMyArticles ? '点击创建你的第一篇文章吧！' : '稍后再来看看吧！' }}</p>
        <button v-if="isMyArticles" @click="navigateToNewPost" class="btn btn-primary">创建文章</button>
      </div>
      
      <div v-else class="blog-grid">
        <BlogCard 
          v-for="blog in blogs" 
          :key="blog.id" 
          :blog="blog" 
          :show-actions="true"
          @delete="deleteBlog"
        />
      </div>
      
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage <= 1" 
          @click="changePage(currentPage - 1)"
        >
          <span class="icon">←</span> 上一页
        </button>
        <div class="pagination-numbers">
          <button 
            v-for="page in paginationPages" 
            :key="page" 
            class="page-number" 
            :class="{ active: currentPage === page }"
            @click="typeof page === 'number' ? changePage(page) : null"
          >
            {{ page }}
          </button>
        </div>
        <button 
          class="pagination-btn" 
          :disabled="currentPage >= pagination.totalPages" 
          @click="changePage(currentPage + 1)"
        >
          下一页 <span class="icon">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';

interface Author {
  id: string;
  username: string;
}

interface Blog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: Author | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserInfo {
  id: string;
  email: string;
  username?: string;
}

const route = useRoute();
const router = useRouter();

const blogs = ref<Blog[]>([]);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const currentPage = ref<number>(1);
const pagination = ref<Pagination>({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
});

const isMyArticles = computed<boolean>(() => {
  return route.query.authorId === 'mine';
});

const isLoggedIn = ref(false);
const userInfo = ref<UserInfo | null>(null);

onMounted(() => {
  const token = import.meta.client ? localStorage.getItem('token') : null;
  isLoggedIn.value = !!token;
  
  if (token && import.meta.client) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userInfo.value = {
        id: payload.id,
        email: payload.email,
        username: payload.username || payload.email.split('@')[0]
      };
    } catch (e) {
      userInfo.value = null;
    }
  }
});

const userName = computed<string>(() => {
  return userInfo.value?.username || '用户';
});

const userEmail = computed<string>(() => {
  return userInfo.value?.email || '';
});

// 获取用户名首字母作为头像
const userInitial = computed<string>(() => {
  if (!userInfo.value?.username) return '?';
  return userInfo.value.username.charAt(0).toUpperCase();
});

// 生成分页数字
const paginationPages = computed(() => {
  const totalPages = pagination.value.totalPages;
  const current = currentPage.value;
  
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  if (current <= 3) {
    return [1, 2, 3, 4, '...', totalPages];
  }
  
  if (current >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  
  return [1, '...', current - 1, current, current + 1, '...', totalPages];
});

watch(() => route.query, fetchBlogs, { immediate: true, deep: true });

async function fetchBlogs(): Promise<void> {
  loading.value = true;
  error.value = null;
  
  try {
    const pageQuery = route.query.page;
    currentPage.value = pageQuery ? parseInt(pageQuery as string) : 1;
    
    const queryParams = new URLSearchParams();
    queryParams.append('page', currentPage.value.toString());
    queryParams.append('limit', '10');
    
    if (isMyArticles.value) {
      const userId = getUserIdFromToken();
      if (userId) {
        queryParams.append('authorId', userId);
      } else {
        // 未登录但访问"我的文章"页面
        error.value = "请先登录";
        loading.value = false;
        return;
      }
    }
    
    const { data, error: fetchError } = await useFetch<{
      blogs: Blog[];
      pagination: Pagination;
    }>(`/api/blog?${queryParams}`);
    
    if (fetchError.value) {
      throw new Error(fetchError.value.message || '获取文章失败');
    }
    
    if (data.value) {
      blogs.value = data.value.blogs;
      pagination.value = data.value.pagination;
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

function changePage(page: number): void {
  if (page < 1 || page > pagination.value.totalPages) return;
  
  const query = { ...route.query, page: page.toString() };
  router.push({ query });
}

async function deleteBlog(blogId: string): Promise<void> {
  try {
    if (!import.meta.client) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('请先登录');
      return;
    }
    
    const response = await fetch(`/api/blog/${blogId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.statusMessage || '删除失败');
    }
    
    fetchBlogs();
  } catch (err: any) {
    console.error('删除文章失败:', err);
    alert(err?.message || '删除文章失败，请稍后重试');
  }
}

function navigateToNewPost(): void {
  router.push('/revise?new=true');
}

function navigateToAllArticles(): void {
  router.push({ path: '/', query: { ...route.query, authorId: undefined } });
}

function navigateToMyArticles(): void {
  router.push({ path: '/', query: { ...route.query, authorId: 'mine' } });
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.main-container {
  padding-top: 2rem;
  padding-bottom: 4rem;
  position: relative;
  z-index: 10;
}

.hero-section {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  padding: 4rem 0;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.hero-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}

.hero-content {
  max-width: 60%;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, #ffffff, #e2e8f0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
}

.hero-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 50%;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: 10%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05));
  animation: float 10s infinite ease-in-out;
}

.shape-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: 5%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.03));
  animation: float 14s infinite ease-in-out reverse;
}

.shape-3 {
  width: 150px;
  height: 150px;
  top: 20%;
  left: 15%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02));
  animation: float 12s infinite ease-in-out 2s;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(10px, 10px) rotate(5deg); }
  50% { transform: translate(0, 20px) rotate(0deg); }
  75% { transform: translate(-10px, 10px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.user-profile {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1.2rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 350px;
  transition: all 0.3s ease;
}

.user-profile:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #4361ee;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
}

.user-email {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.hero-actions {
  display: flex;
  justify-content: flex-end;
}

.content-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-options {
  display: flex;
  background: rgba(241, 245, 249, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.filter-btn {
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.filter-btn:not(.active):hover {
  background: rgba(255, 255, 255, 0.8);
  color: #3a56de;
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.empty-state h2 {
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.empty-state p {
  color: #718096;
  margin-bottom: 1.5rem;
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
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.1);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 2rem;
  color: #718096;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 2rem 0;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 0.5rem;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 10px;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.pagination-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.95);
  color: #4361ee;
  border-color: #4361ee;
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.1);
  transform: translateY(-2px);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: 0.4rem;
}

.page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.page-number.active {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.page-number:not(.active):hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: #4361ee;
  color: #4361ee;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(67, 97, 238, 0.1);
}

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.btn-primary:hover {
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
  transform: translateY(-3px);
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 14px;
}

@media (max-width: 768px) {
  .hero-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .hero-content {
    max-width: 100%;
    margin-bottom: 2rem;
  }
  
  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .blog-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>