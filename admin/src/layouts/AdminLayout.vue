<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden text-white bg-transparent">
    <!-- 侧边栏：左侧固定 -->
    <AppSidebar class="hidden md:flex flex-shrink-0 w-64 h-full z-20" />

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
      <!-- 顶部栏 -->
      <AppHeader class="flex-shrink-0 z-20" />

      <!-- 页面内容滚动区 -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
        <div class="max-w-7xl mx-auto space-y-6">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
