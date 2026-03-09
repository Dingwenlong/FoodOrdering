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
  <header class="flex sticky top-0 justify-between items-center px-6 h-16 rounded-none border-t-0 border-b backdrop-blur-md glass-card border-x-0 border-white/10 bg-black/10">
    <!-- Left: Mobile Menu Trigger & Title -->
    <div class="flex gap-4 items-center">
      <button class="p-2 rounded-lg md:hidden text-white/70 hover:text-white hover:bg-white/10">
        <Menu class="w-5 h-5" />
      </button>
      <h2 class="hidden text-lg font-medium tracking-wide text-white/90 sm:block">
        工作台
      </h2>
    </div>

    <!-- Right: Actions -->
    <div class="flex gap-4 items-center">
      <!-- Logout -->
      <button 
        class="flex gap-2 items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors text-white/70 hover:text-red-400 hover:bg-white/5" 
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4" />
        <span class="hidden sm:inline">退出登录</span>
      </button>
    </div>
  </header>
</template>
