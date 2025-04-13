<template>
  <Teleport to="body">
    <Transition name="alert-fade">
      <div v-if="visible" class="alert-wrapper" @click.self="closeOnClickOutside && close()">
        <div class="alert-container" :class="typeClass">
          <div class="alert-header">
            <h3 class="alert-title">{{ currentTitle }}</h3>
            <button v-if="showClose" class="alert-close" @click="close">×</button>
          </div>
          <div class="alert-content">
            <slot>{{ currentMessage }}</slot>
          </div>
          <div v-if="showFooter" class="alert-footer">
            <button class="alert-confirm-btn" @click="confirm">{{ confirmText }}</button>
            <button v-if="showCancel" class="alert-cancel-btn" @click="cancel">{{ cancelText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

interface AlertProps {
  title?: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  showClose?: boolean
  showFooter?: boolean
  showCancel?: boolean
  confirmText?: string
  cancelText?: string
  closeOnClickOutside?: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
}

interface AlertOpenOptions {
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  duration?: number
}

const props = withDefaults(defineProps<AlertProps>(), {
  title: '提示',
  message: '',
  type: 'info',
  duration: 0, // 0表示不自动关闭
  showClose: true,
  showFooter: false,
  showCancel: false,
  confirmText: '确定',
  cancelText: '取消',
  closeOnClickOutside: false,
  onConfirm: () => {},
  onCancel: () => {},
  onClose: () => {}
})

const visible = ref(false)
const currentMessage = ref(props.message)
const currentTitle = ref(props.title)
const currentType = ref(props.type)
const currentDuration = ref(props.duration)

const typeClass = computed(() => {
  return {
    'alert-info': currentType.value === 'info',
    'alert-success': currentType.value === 'success',
    'alert-warning': currentType.value === 'warning',
    'alert-error': currentType.value === 'error'
  }
})

// 打开alert
function open(options?: AlertOpenOptions) {
  if (options) {
    if (options.message !== undefined) currentMessage.value = options.message
    if (options.type !== undefined) currentType.value = options.type
    if (options.title !== undefined) currentTitle.value = options.title
    if (options.duration !== undefined) currentDuration.value = options.duration
  } else {
    // 重置为默认值
    currentMessage.value = props.message
    currentTitle.value = props.title
    currentType.value = props.type
    currentDuration.value = props.duration
  }
  
  visible.value = true
  if (currentDuration.value > 0) {
    setTimeout(() => {
      close()
    }, currentDuration.value)
  }
}

// 关闭alert
function close() {
  visible.value = false
  props.onClose()
}

// 确认
function confirm() {
  props.onConfirm()
  close()
}

// 取消
function cancel() {
  props.onCancel()
  close()
}

// 暴露方法给父组件
defineExpose({
  open,
  close
})
</script>

<style>
.alert-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.alert-container {
  background-color: #fff;
  border-radius: 8px;
  min-width: 300px;
  max-width: 90%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.alert-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.alert-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.alert-close:hover {
  color: #666;
}

.alert-content {
  padding: 20px;
  font-size: 16px;
  color: #333;
}

.alert-footer {
  padding: 10px 20px;
  text-align: right;
  border-top: 1px solid #eee;
}

.alert-confirm-btn,
.alert-cancel-btn {
  padding: 8px 16px;
  margin-left: 10px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  font-size: 14px;
}

.alert-confirm-btn {
  background-color: #409eff;
  color: white;
}

.alert-cancel-btn {
  background-color: #f0f0f0;
  color: #606266;
}

.alert-info {
  border-top: 4px solid #409eff;
}

.alert-success {
  border-top: 4px solid #67c23a;
}

.alert-warning {
  border-top: 4px solid #e6a23c;
}

.alert-error {
  border-top: 4px solid #f56c6c;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
}
</style>