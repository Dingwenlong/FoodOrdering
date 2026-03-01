<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import { Search, MoreHorizontal, UserCheck, UserX } from 'lucide-vue-next'

const users = ref([
  { id: 1, name: 'Alice', role: 'Admin', status: 'Active', lastLogin: '2023-10-01 12:00' },
  { id: 2, name: 'Bob', role: 'User', status: 'Inactive', lastLogin: '2023-09-28 09:30' },
  { id: 3, name: 'Charlie', role: 'User', status: 'Active', lastLogin: '2023-10-02 14:15' },
])
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white tracking-tight">用户管理</h1>
      <div class="relative w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
        <input type="text" placeholder="搜索用户..." class="glass-input pl-9 h-10" />
      </div>
    </div>

    <Card no-padding class="overflow-hidden">
      <table class="glass-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>角色</th>
            <th>状态</th>
            <th>最后登录</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="group">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {{ user.name.charAt(0) }}
                </div>
                <span class="font-medium text-white">{{ user.name }}</span>
              </div>
            </td>
            <td class="text-white/70">{{ user.role }}</td>
            <td>
              <span :class="['glass-badge', user.status === 'Active' ? 'bg-green-500/20 text-green-200 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20']">
                {{ user.status === 'Active' ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="text-white/40 text-sm">{{ user.lastLogin }}</td>
            <td class="text-right">
              <button class="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
                <MoreHorizontal class="w-5 h-5" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>
