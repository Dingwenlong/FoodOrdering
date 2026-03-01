<script setup lang="ts">
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { Bell, Search, LogOut, Menu } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="h-16 px-6 flex items-center justify-between glass-card rounded-none border-x-0 border-t-0 border-b border-white/10 bg-black/10 backdrop-blur-md sticky top-0">
    <!-- Left: Mobile Menu Trigger & Title -->
    <div class="flex items-center gap-4">
      <button class="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg">
        <Menu class="w-5 h-5" />
      </button>
      <h2 class="text-lg font-medium text-white/90 tracking-wide hidden sm:block">
        工作台
      </h2>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-4">
      <!-- Search -->
      <div class="relative hidden md:block">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input 
          type="text" 
          placeholder="全局搜索..." 
          class="glass-input h-9 w-64 pl-9 py-0 text-sm bg-white/5 border-transparent focus:bg-black/40 focus:border-white/10"
        />
      </div>

      <!-- Notifications -->
      <button class="relative p-2 text-white/60 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors">
        <Bell class="w-5 h-5" />
        <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
      </button>

      <!-- Logout -->
      <button 
        @click="handleLogout" 
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white/70 hover:text-red-400 hover:bg-white/5 transition-colors"
      >
        <LogOut class="w-4 h-4" />
        <span class="hidden sm:inline">退出登录</span>
      </button>
    </div>
  </header>
</template>
