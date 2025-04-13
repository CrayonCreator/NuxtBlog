<template>
  <div class="blog-card" @click="navigateToBlog">
    <div class="card-content">
      <h3 class="blog-title">{{ blog.title }}</h3>
      <p class="blog-excerpt">{{ excerpt }}</p>
      
      <div class="blog-meta">
        <div class="author-info">
          <div class="author-avatar">{{ authorInitial }}</div>
          <span class="author-name">{{ authorName }}</span>
        </div>
        <span class="blog-date">{{ formattedDate }}</span>
      </div>
      
      <div v-if="showActions && isAuthor" class="action-buttons">
        <button class="edit-btn" @click.stop="editBlog">编辑</button>
        <button class="delete-btn" @click.stop="confirmDelete">删除</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

const props = defineProps<{
  blog: {
    id: string;
    title: string;
    content: string;
    authorId: string;
    author?: {
      id: string;
      username: string;
    } | null;
    createdAt: string;
    updatedAt: string;
  };
  showActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'delete', id: string): void;
}>();

const router = useRouter();

// 提取文章摘要
const excerpt = computed(() => {
  // 先去除所有 Markdown 标记
  const plainText = props.blog.content
    .replace(/#+\s/g, '')                 // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1')      // 移除粗体
    .replace(/\*(.*?)\*/g, '$1')          // 移除斜体
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')   // 移除链接，保留链接文本
    .replace(/`(.*?)`/g, '$1')            // 移除行内代码
    .replace(/```[\s\S]*?```/g, '')       // 移除代码块
    .replace(/\n/g, ' ');                 // 换行替换为空格

  // 返回限定长度的摘要
  return plainText.length > 100 
    ? plainText.substring(0, 100) + '...' 
    : plainText;
});

// 格式化日期
const formattedDate = computed(() => {
  const date = new Date(props.blog.createdAt);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// 获取作者名称
const authorName = computed(() => {
  return props.blog.author?.username || '未知作者';
});

// 获取作者头像（使用首字母）
const authorInitial = computed(() => {
  return props.blog.author?.username.charAt(0).toUpperCase() || '?';
});

// 检查当前用户是否是作者
const isAuthor = computed((): boolean => {
  if (!import.meta.client) return false;
  
  const userId = getUserIdFromToken();
  return !!userId && userId === props.blog.authorId;
});

function getUserIdFromToken(): string | null {
  if (!import.meta.client) return null;
  
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // 简单解析JWT的payload（不验证签名）
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (e) {
    return null;
  }
}

function navigateToBlog(): void {
  router.push(`/blog/${props.blog.id}`);
}

function editBlog(): void {
  router.push(`/revise?id=${props.blog.id}`);
}

function confirmDelete(): void {
  if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
    emit('delete', props.blog.id);
  }
}
</script>

<style scoped>
.blog-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.blog-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(67, 97, 238, 0.1);
  border-color: rgba(67, 97, 238, 0.2);
}

.card-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.blog-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  color: #2d3748;
  background: linear-gradient(120deg, #2d3748, #4a5568);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1.4;
}

.blog-excerpt {
  font-size: 0.875rem;
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.6;
  flex-grow: 1;
}

.blog-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.author-info {
  display: flex;
  align-items: center;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  margin-right: 0.5rem;
}

.author-name {
  font-size: 0.875rem;
  color: #4a5568;
  font-weight: 500;
}

.blog-date {
  font-size: 0.75rem;
  color: #718096;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.edit-btn, .delete-btn {
  font-size: 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}

.edit-btn {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  box-shadow: 0 2px 5px rgba(67, 97, 238, 0.2);
}

.edit-btn:hover {
  box-shadow: 0 4px 8px rgba(67, 97, 238, 0.3);
  transform: translateY(-1px);
}

.delete-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 2px 5px rgba(239, 68, 68, 0.2);
}

.delete-btn:hover {
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}
</style>
