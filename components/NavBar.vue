<template>
  <nav class="navbar">
    <div class="container">
      <nuxt-link to="/" class="logo">Blog System</nuxt-link>
      
      <div class="nav-right">
        <div v-if="isLoggedIn" class="user-actions">
          <nuxt-link to="/?authorId=mine" class="nav-link">我的文章</nuxt-link>
          <nuxt-link to="/revise?new=true" class="nav-link create-btn">写文章</nuxt-link>
          <button @click="logout" class="logout-btn">退出</button>
        </div>
        
        <div v-else>
          <nuxt-link to="/auth" class="auth-btn">登录 / 注册</nuxt-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const router = useRouter()
const isLoggedIn = ref(false)

// 客户端挂载时检查登录状态
onMounted(() => {
  if (import.meta.client) {
    checkLoginStatus()
  }
})

function checkLoginStatus() {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
}

function logout() {
  if (import.meta.client) {
    localStorage.removeItem('token')
    isLoggedIn.value = false
    router.push('/')
  }
}
</script>

<style scoped>
.navbar {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 1.5rem;
  font-weight: 700;
  text-decoration: none;
  text-shadow: 0px 2px 4px rgba(67, 97, 238, 0.2);
  transition: all 0.3s ease;
}

.logo:hover {
  text-shadow: 0px 2px 8px rgba(67, 97, 238, 0.4);
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
}

.nav-link:after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background: linear-gradient(90deg, #4361ee, #3a56de);
  transition: width 0.3s ease;
}

.nav-link:hover {
  color: #4361ee;
}

.nav-link:hover:after {
  width: 100%;
}

.create-btn {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
  transition: all 0.3s;
}

.create-btn:hover {
  box-shadow: 0 6px 15px rgba(67, 97, 238, 0.3);
  transform: translateY(-2px);
  color: white;
}

.create-btn:after {
  display: none;
}

.logout-btn {
  background: none;
  border: none;
  color: #e53e3e;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.3s;
  position: relative;
}

.logout-btn:after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background: linear-gradient(90deg, #e53e3e, #c53030);
  transition: width 0.3s ease;
}

.logout-btn:hover {
  color: #c53030;
}

.logout-btn:hover:after {
  width: 100%;
}

.auth-btn {
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.auth-btn:hover {
  box-shadow: 0 6px 15px rgba(67, 97, 238, 0.3);
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .user-actions {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.875rem;
  }
}
</style>
