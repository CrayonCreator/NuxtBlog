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
          <button 
            v-if="activeTab === 'forgotPassword'" 
            :class="['tab-btn', { active: activeTab === 'forgotPassword' }]"
          >
            忘记密码
          </button>
        </div>
      </div>
      
      <div class="auth-body">
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
            <a href="#" @click.prevent="activeTab = 'forgotPassword'">忘记密码？</a>
          </div>
          
          <button type="submit" class="submit-btn">登录</button>
        </form>
        
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
            <label for="register-username">用户名</label>
            <input 
              id="register-username" 
              type="text" 
              v-model="registerForm.username" 
              placeholder="请输入用户名" 
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
                @click="sendVerificationCode('register')"
              >
                {{ cooldown > 0 ? `${cooldown}秒后重试` : '发送验证码' }}
              </button>
            </div>
          </div>
          
          <button type="submit" class="submit-btn">注册</button>
        </form>
        
        <form v-if="activeTab === 'forgotPassword'" @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="forgot-email">邮箱</label>
            <input 
              id="forgot-email" 
              type="email" 
              v-model="forgotPasswordForm.email" 
              placeholder="请输入注册邮箱" 
              required
            />
          </div>
          
          <div class="form-group verification-code">
            <label for="forgot-verification-code">验证码</label>
            <div class="code-input-group">
              <input 
                id="forgot-verification-code" 
                type="text" 
                v-model="forgotPasswordForm.verificationCode" 
                placeholder="请输入验证码" 
                required
              />
              <button 
                type="button" 
                class="send-code-btn" 
                :disabled="forgotPasswordCooldown > 0" 
                @click="sendVerificationCode('forgot')"
              >
                {{ forgotPasswordCooldown > 0 ? `${forgotPasswordCooldown}秒后重试` : '发送验证码' }}
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="new-password">新密码</label>
            <input 
              id="new-password" 
              type="password" 
              v-model="forgotPasswordForm.newPassword" 
              placeholder="请输入新密码" 
              required
            />
          </div>
          
          <div class="form-group">
            <label for="confirm-new-password">确认新密码</label>
            <input 
              id="confirm-new-password" 
              type="password" 
              v-model="forgotPasswordForm.confirmNewPassword" 
              placeholder="请再次输入新密码" 
              required
            />
            <div v-if="newPasswordMismatch" class="error-msg">两次输入密码不一致</div>
          </div>
          
          <button type="submit" class="submit-btn">重置密码</button>
          
          <div class="form-group back-to-login">
            <a href="#" @click.prevent="activeTab = 'login'">返回登录</a>
          </div>
        </form>
      </div>
    </div>
  </div>
  <alert ref="alertComponent" />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import alert from '@/components/alert.vue'
const activeTab = ref('login')
const router = useRouter();

// 使用InstanceType<typeof alert>来明确指定组件类型
const alertComponent = ref<InstanceType<typeof alert> | null>(null)

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
})

const forgotPasswordForm = ref({
  email: '',
  verificationCode: '',
  newPassword: '',
  confirmNewPassword: ''
})

const cooldown = ref(0)
const forgotPasswordCooldown = ref(0)
let cooldownTimer: any = null
let forgotPasswordCooldownTimer: any = null

const passwordMismatch = computed(() => {
  return registerForm.value.password && 
         registerForm.value.confirmPassword &&
         registerForm.value.password !== registerForm.value.confirmPassword
})

const newPasswordMismatch = computed(() => {
  return forgotPasswordForm.value.newPassword && 
         forgotPasswordForm.value.confirmNewPassword &&
         forgotPasswordForm.value.newPassword !== forgotPasswordForm.value.confirmNewPassword
})

const showMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  if (alertComponent.value) {
    alertComponent.value.open({
      message,
      type,
      duration: 3000 
    })
  }
}

const sendVerificationCode = async (type: 'register' | 'forgot') => {
  const email = type === 'register' ? registerForm.value.email : forgotPasswordForm.value.email
  
  if (!email) {
    showMessage('请先输入邮箱', 'warning')
    return
  }
  
  try {
    const { data, error } = await useFetch('/api/auth/send-verification-code', {
      method: 'POST',
      body: {
        email,
        type: type==='register' ? 'register' : 'reset'
      }
    })
    
    if (error.value) {
      throw new Error(error.value.message || '发送验证码失败')
    }
    
    if (type === 'register') {
      cooldown.value = 60
      cooldownTimer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) {
          clearInterval(cooldownTimer)
        }
      }, 1000)
    } else {
      forgotPasswordCooldown.value = 60
      forgotPasswordCooldownTimer = setInterval(() => {
        forgotPasswordCooldown.value--
        if (forgotPasswordCooldown.value <= 0) {
          clearInterval(forgotPasswordCooldownTimer)
        }
      }, 1000)
    }
    
    showMessage('验证码已发送，请查收邮箱', 'success')
    
  } catch (error: any) {
    console.error('发送验证码失败:', error)
    showMessage('发送验证码失败，请稍后重试', 'error')
  }
}

const handleLogin = async () => {
  try {
    const { data, error } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: loginForm.value
    })
    
    if (error.value) {
      throw new Error(error.value.message || '登录失败')
    }
    
    if (data.value && 'token' in data.value) {
      // 只在客户端环境保存token
      if (import.meta.client) {
        localStorage.setItem('token', data.value.token)
      }
      navigateTo('/')
    } else {
      throw new Error('登录成功但未返回有效令牌')
    }
    
  } catch (error: any) {
    console.error('登录失败:', error)
    showMessage('登录失败，请检查邮箱和密码', 'error')
  }
}

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    showMessage('两次输入的密码不一致', 'warning')
    return
  }
  
  try {
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: registerForm.value.username,
        email: registerForm.value.email,
        password: registerForm.value.password,
        verificationCode: registerForm.value.verificationCode
      }
    })
    
    if (error.value) {
      throw new Error(error.value.message || '注册失败')
    }
    
    if (data.value && 'token' in data.value) {
      // 只在客户端环境保存token
      if (import.meta.client) {
        localStorage.setItem('token', data.value.token)
      }
      showMessage('注册成功', 'success')
      navigateTo('/')
    } else {
      throw new Error('登录成功但未返回有效令牌')
    }
    
  } catch (error: any) {
    console.error('注册失败:', error)
    showMessage('注册失败，请稍后重试', 'error')
  }
}

const handleForgotPassword = async () => {
  if (forgotPasswordForm.value.newPassword !== forgotPasswordForm.value.confirmNewPassword) {
    showMessage('两次输入的密码不一致', 'warning')
    return
  }
  
  try {
    const { data, error } = await useFetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: forgotPasswordForm.value.email,
        verificationCode: forgotPasswordForm.value.verificationCode,
        newPassword: forgotPasswordForm.value.newPassword
      }
    })
    
    if (error.value) {
      throw new Error(error.value.message || '重置密码失败')
    }
    
    showMessage('密码重置成功，请使用新密码登录', 'success')
    
    forgotPasswordForm.value = {
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmNewPassword: ''
    }
    
    activeTab.value = 'login'
    
  } catch (error: any) {
    console.error('重置密码失败:', error)
    showMessage('重置密码失败，请稍后重试', 'error')
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 添加装饰元素 */
.auth-container::before,
.auth-container::after {
  content: "";
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(67, 97, 238, 0.1), rgba(58, 86, 222, 0.05));
  z-index: 0;
}

.auth-container::before {
  top: -100px;
  right: -50px;
  animation: float 15s infinite ease-in-out;
}

.auth-container::after {
  bottom: -100px;
  left: -50px;
  animation: float 18s infinite ease-in-out reverse;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(15px, 15px) rotate(5deg); }
  50% { transform: translate(0, 30px) rotate(0deg); }
  75% { transform: translate(-15px, 15px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.7);
  transition: all 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.auth-header {
  padding: 20px 0;
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

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
  position: relative;
}

.tab-btn.active {
  color: #4361ee;
}

.tab-btn::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, #4361ee, #3a56de);
  transition: width 0.3s ease;
}

.tab-btn.active::after {
  width: 100%;
}

.auth-body {
  padding: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #495057;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

input[type="email"],
input[type="password"],
input[type="text"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid rgba(203, 213, 225, 0.6);
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

input[type="email"]:focus,
input[type="password"]:focus,
input[type="text"]:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
  background: rgba(255, 255, 255, 0.95);
}

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input-group input {
  flex: 1;
}

.send-code-btn {
  white-space: nowrap;
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.send-code-btn:hover:not(:disabled) {
  box-shadow: 0 6px 15px rgba(67, 97, 238, 0.3);
  transform: translateY(-2px);
}

.send-code-btn:disabled {
  background: linear-gradient(135deg, #a0aec0, #cbd5e0);
  cursor: not-allowed;
  box-shadow: none;
}

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

.forgot-password, .back-to-login {
  text-align: right;
}

.forgot-password a, .back-to-login a {
  font-size: 14px;
  color: #4361ee;
  text-decoration: none;
  position: relative;
  transition: all 0.3s ease;
}

.forgot-password a::after, .back-to-login a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: -2px;
  left: 0;
  background: linear-gradient(90deg, #4361ee, #3a56de);
  transition: width 0.3s ease;
}

.forgot-password a:hover::after, .back-to-login a:hover::after {
  width: 100%;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #4361ee, #3a56de);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
  box-shadow: 0 4px 10px rgba(67, 97, 238, 0.2);
}

.submit-btn:hover {
  box-shadow: 0 8px 20px rgba(67, 97, 238, 0.3);
  transform: translateY(-2px);
}

.error-msg {
  color: #e53e3e;
  font-size: 13px;
  margin-top: 5px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 576px) {
  .auth-card {
    box-shadow: none;
    background: rgba(255, 255, 255, 0.9);
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