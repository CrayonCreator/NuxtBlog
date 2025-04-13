<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'login' }]" 
            @click="activeTab = 'login'"
          >
            登录
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'register' }]" 
            @click="activeTab = 'register'"
          >
            注册
          </button>
        </div>
      </div>
      
      <div class="auth-body">
        <!-- 登录表单 -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-email">邮箱</label>
            <input 
              id="login-email" 
              type="email" 
              v-model="loginForm.email" 
              placeholder="请输入邮箱" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="login-password">密码</label>
            <input 
              id="login-password" 
              type="password" 
              v-model="loginForm.password" 
              placeholder="请输入密码" 
              required
            />
          </div>
          
          <div class="form-group forgot-password">
            <a href="#" @click.prevent="forgotPassword">忘记密码？</a>
          </div>
          
          <button type="submit" class="submit-btn">登录</button>
        </form>
        
        <!-- 注册表单 -->
        <form v-if="activeTab === 'register'" @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="register-email">邮箱</label>
            <input 
              id="register-email" 
              type="email" 
              v-model="registerForm.email" 
              placeholder="请输入邮箱" 
              required
            />
          </div>
          
   
          
          <div class="form-group">
            <label for="register-password">设置密码</label>
            <input 
              id="register-password" 
              type="password" 
              v-model="registerForm.password" 
              placeholder="至少6位字符" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="confirm-password">确认密码</label>
            <input 
              id="confirm-password" 
              type="password" 
              v-model="registerForm.confirmPassword" 
              placeholder="再次输入密码" 
              required
            />
            <div v-if="passwordMismatch" class="error-msg">两次输入密码不一致</div>
          </div>
          <div class="form-group verification-code">
            <label for="verification-code">验证码</label>
            <div class="code-input-group">
              <input 
                id="verification-code" 
                type="text" 
                v-model="registerForm.verificationCode" 
                placeholder="请输入验证码" 
                required
              />
              <button 
                type="button" 
                class="send-code-btn" 
                :disabled="cooldown > 0" 
                @click="sendVerificationCode"
              >
                {{ cooldown > 0 ? `${cooldown}秒后重试` : '发送验证码' }}
              </button>
            </div>
          </div>
          
          <button type="submit" class="submit-btn">注册</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

// 当前激活的标签页
const activeTab = ref('login')

// 登录表单数据
const loginForm = ref({
  email: '',
  password: ''
})

// 注册表单数据
const registerForm = ref({
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// 冷却时间
const cooldown = ref(0)
let cooldownTimer: any = null

// 密码是否匹配
const passwordMismatch = computed(() => {
  return registerForm.value.password && 
         registerForm.value.confirmPassword &&
         registerForm.value.password !== registerForm.value.confirmPassword
})

// 发送验证码
const sendVerificationCode = async () => {
  if (!registerForm.value.email) {
    alert('请先输入邮箱')
    return
  }
  
  // 这里应该调用后端API发送验证码
  try {
    // 模拟API调用
    console.log('发送验证码到邮箱:', registerForm.value.email)
    alert(`验证码已发送至 ${registerForm.value.email}`)
    
    // 设置冷却时间
    cooldown.value = 60
    cooldownTimer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0) {
        clearInterval(cooldownTimer)
      }
    }, 1000)
    
  } catch (error) {
    console.error('发送验证码失败:', error)
    alert('发送验证码失败，请稍后重试')
  }
}

// 登录处理
const handleLogin = async () => {
  // 这里应该调用后端API进行登录验证
  console.log('登录信息:', loginForm.value)
  alert('登录功能需要后端支持')
}

// 注册处理
const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }
  
  if (!registerForm.value.agreeTerms) {
    alert('请阅读并同意服务条款和隐私政策')
    return
  }
  
  // 这里应该调用后端API进行注册
  console.log('注册信息:', registerForm.value)
  alert('注册功能需要后端支持')
}

// 忘记密码
const forgotPassword = () => {
  alert('忘记密码功能需要后端支持')
}

</script>

<style>
/* 全局样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 主容器 */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* 登录/注册卡片 */
.auth-card {
  width: 100%;
  max-width: 480px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 卡片头部 */
.auth-header {
  padding: 20px 0;
  background-color: #f8f9fa;
}

/* 标签页 */
.tabs {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.tab-btn {
  background: none;
  border: none;
  font-size: 18px;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  padding: 10px 20px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #4361ee;
  border-bottom: 2px solid #4361ee;
}

/* 卡片主体 */
.auth-body {
  padding: 30px;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #495057;
}

input[type="email"],
input[type="password"],
input[type="text"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

input[type="email"]:focus,
input[type="password"]:focus,
input[type="text"]:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
}

/* 验证码输入组 */
.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input-group input {
  flex: 1;
}

.send-code-btn {
  white-space: nowrap;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 15px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.send-code-btn:hover {
  background-color: #3a56de;
}

.send-code-btn:disabled {
  background-color: #a8b1ce;
  cursor: not-allowed;
}

/* 条款复选框 */
.terms {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.terms input[type="checkbox"] {
  margin-top: 2px;
}

.terms label {
  font-size: 13px;
  margin-bottom: 0;
}

.terms a {
  color: #4361ee;
  text-decoration: none;
}

.terms a:hover {
  text-decoration: underline;
}

/* 忘记密码链接 */
.forgot-password {
  text-align: right;
}

.forgot-password a {
  font-size: 14px;
  color: #4361ee;
  text-decoration: none;
}

.forgot-password a:hover {
  text-decoration: underline;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #3a56de;
}

/* 错误信息 */
.error-msg {
  color: #dc3545;
  font-size: 13px;
  margin-top: 5px;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .auth-card {
    box-shadow: none;
  }
  
  .code-input-group {
    flex-direction: column;
  }
  
  .send-code-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>