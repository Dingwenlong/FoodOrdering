<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('admin')
const password = ref('admin123')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login({ username: username.value, password: password.value })
    await router.push('/orders')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex overflow-hidden relative justify-center items-center min-h-screen">
    <!-- 背景光效装饰 -->
    <div class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse-slow"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/30 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

    <!-- 登录卡片 -->
    <div class="relative z-10 p-8 w-full max-w-md border-t glass-card md:p-10 border-white/20">
      <div class="mb-10 text-center">
        <div class="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">管理后台</h1>
        <p class="mt-2 text-sm text-white/50">登录以管理您的数字餐饮帝国</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block mb-2 ml-1 text-xs font-medium tracking-wider uppercase text-white/60">用户名</label>
          <input 
            v-model="username" 
            type="text" 
            class="glass-input"
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label class="block mb-2 ml-1 text-xs font-medium tracking-wider uppercase text-white/60">密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="glass-input"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="p-3 text-sm text-center text-red-300 rounded-lg border bg-red-500/10 border-red-500/20">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="overflow-hidden relative py-3 w-full text-lg glass-btn group"
          :disabled="loading"
        >
          <span class="flex relative z-10 gap-2 justify-center items-center">
            <span v-if="loading" class="w-5 h-5 rounded-full border-2 animate-spin border-white/30 border-t-white"></span>
            {{ loading ? '认证中...' : '进入系统' }}
            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
          <!-- 按钮内部光效 -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-white/20 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
        </button>
      </form>

      <div class="mt-8 text-center">
        <a href="#" class="text-sm transition-colors text-white/40 hover:text-cyan-400">忘记密码？</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse-slow {
  animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
