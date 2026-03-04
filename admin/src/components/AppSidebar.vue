<script setup lang="ts">
import { useRoute } from 'vue-router'
import { 
  LayoutDashboard, 
  Users, 
  Utensils, 
  ShoppingBag, 
  BarChart2, 
  MessageSquare, 
  HelpCircle, 
  Settings,
  Bell
} from 'lucide-vue-next'

const route = useRoute()

const menuItems = [
  { name: '订单管理', path: '/orders', icon: ShoppingBag },
  { name: '菜品管理', path: '/menu', icon: Utensils },
  { name: '用户管理', path: '/users', icon: Users },
  { name: '数据统计', path: '/stats', icon: BarChart2 },
  { name: '公告管理', path: '/notices', icon: Bell },
  { name: '评论管理', path: '/comments', icon: MessageSquare },
  { name: '客服管理', path: '/support', icon: HelpCircle },
  { name: '系统设置', path: '/settings', icon: Settings },
]

const isActive = (path: string) => route.path.startsWith(path)
</script>

<template>
  <aside class="flex flex-col h-full glass-card rounded-l-none border-y-0 border-l-0 border-r border-white/10 bg-black/20 backdrop-blur-xl">
    <!-- Logo Area -->
    <div class="h-16 flex items-center px-6 border-b border-white/5">
      <div class="w-8 h-8 mr-3 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-lg shadow-cyan-500/20 bg-white/5">
        <img src="/Logo.png" alt="FoodOS Logo" class="w-full h-full object-cover" />
      </div>
      <span class="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
        FoodOS
      </span>
    </div>

    <!-- Nav Items -->
    <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-1">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path" 
        :to="item.path"
        class="flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden"
        :class="isActive(item.path) 
          ? 'bg-white/10 text-white shadow-lg shadow-black/10' 
          : 'text-white/60 hover:text-white hover:bg-white/5'"
      >
        <!-- Active Indicator -->
        <div v-if="isActive(item.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>

        <component 
          :is="item.icon" 
          class="w-5 h-5 mr-3 transition-colors"
          :class="isActive(item.path) ? 'text-cyan-400' : 'text-white/50 group-hover:text-cyan-300'" 
        />
        <span class="font-medium tracking-wide">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- User Profile Snippet -->
    <div class="p-4 border-t border-white/5 bg-black/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px]">
          <div class="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <span class="text-xs font-bold">AD</span>
          </div>
        </div>
        <div>
          <div class="text-sm font-medium text-white">管理员</div>
          <div class="text-xs text-white/40">admin@foodos.com</div>
        </div>
      </div>
    </div>
  </aside>
</template>
