<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AppUser } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import { Search, UserCheck, UserX } from 'lucide-vue-next'

const users = ref<AppUser[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const keyword = ref('')
const updatingId = ref<string | null>(null)

const filteredUsers = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter((u) => {
    return (
      u.nickname.toLowerCase().includes(q) ||
      (u.phone ?? '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
  })
})

async function loadUsers() {
  loading.value = true
  errorMsg.value = null
  try {
    users.value = await api.listUsers()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载用户失败'
  } finally {
    loading.value = false
  }
}

async function toggleStatus(user: AppUser) {
  updatingId.value = user.id
  errorMsg.value = null
  const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    await api.updateUserStatus({ userId: user.id, status: nextStatus })
    const idx = users.value.findIndex((u) => u.id === user.id)
    if (idx >= 0) {
      users.value[idx] = { ...users.value[idx], status: nextStatus }
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '更新用户状态失败'
  } finally {
    updatingId.value = null
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white tracking-tight">用户管理</h1>
      <div class="relative w-64">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
        <input v-model.trim="keyword" type="text" placeholder="搜索用户..." class="glass-input pl-9 h-10" />
      </div>
    </div>

    <div v-if="errorMsg" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {{ errorMsg }}
    </div>

    <Card no-padding class="overflow-hidden">
      <table class="glass-table">
        <thead>
          <tr>
            <th>用户</th>
            <th>手机号</th>
            <th>订单数</th>
            <th>最后活跃</th>
            <th>状态</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-8 text-center text-white/40">加载中...</td>
          </tr>
          <tr v-else-if="filteredUsers.length === 0">
            <td colspan="6" class="py-8 text-center text-white/40">暂无数据</td>
          </tr>
          <tr v-for="user in filteredUsers" :key="user.id" class="group">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                  {{ user.nickname.charAt(0) }}
                </div>
                <span class="font-medium text-white">{{ user.nickname }}</span>
              </div>
            </td>
            <td class="text-white/70">{{ user.phone || '未绑定' }}</td>
            <td class="text-white/70">{{ user.orderCount }}</td>
            <td class="text-white/40 text-sm">{{ new Date(user.lastActiveAt).toLocaleString() }}</td>
            <td>
              <span :class="['glass-badge', user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-200 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20']">
                {{ user.status === 'ACTIVE' ? '正常' : '禁用' }}
              </span>
            </td>
            <td class="text-right">
              <button
                class="inline-flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors disabled:opacity-40"
                :disabled="updatingId === user.id"
                @click="toggleStatus(user)"
              >
                <UserX v-if="user.status === 'ACTIVE'" class="w-4 h-4" />
                <UserCheck v-else class="w-4 h-4" />
                <span class="text-xs">{{ user.status === 'ACTIVE' ? '禁用' : '启用' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>
