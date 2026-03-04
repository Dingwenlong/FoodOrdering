<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { AppUser, AppUserDetail } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Eye, Search, UserCheck, UserX } from 'lucide-vue-next'

const users = ref<AppUser[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const keyword = ref('')
const updatingId = ref<string | null>(null)

const statusFilter = ref<'ALL' | AppUser['status']>('ALL')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const rangeFrom = computed(() => (total.value <= 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(total.value, page.value * pageSize.value))

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailUser = ref<AppUserDetail | null>(null)

async function loadUsers(resetPage = false) {
  if (resetPage) {
    page.value = 1
  }
  loading.value = true
  errorMsg.value = null
  try {
    const res = await api.listUsersPaged({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
    })
    users.value = res.list
    total.value = res.total
    if (page.value > pageCount.value) {
      page.value = pageCount.value
      const retry = await api.listUsersPaged({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value.trim() || undefined,
        status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
      })
      users.value = retry.list
      total.value = retry.total
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载用户失败'
  } finally {
    loading.value = false
  }
}

async function openDetail(user: AppUser) {
  detailOpen.value = true
  detailLoading.value = true
  detailUser.value = null
  try {
    detailUser.value = await api.getUserDetail(user.id)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载用户详情失败'
    detailOpen.value = false
  } finally {
    detailLoading.value = false
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
    if (detailUser.value?.id === user.id) {
      detailUser.value = { ...detailUser.value, status: nextStatus }
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '更新用户状态失败'
  } finally {
    updatingId.value = null
  }
}

function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  loadUsers()
}

function nextPage() {
  if (page.value >= pageCount.value) return
  page.value += 1
  loadUsers()
}

let keywordTimer: number | null = null
watch(keyword, () => {
  if (keywordTimer) window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => loadUsers(true), 300)
})

watch([statusFilter, pageSize], () => {
  loadUsers(true)
})

onMounted(() => loadUsers())
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white tracking-tight">用户管理</h1>
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="glass-input h-10 px-3 w-28">
          <option value="ALL">全部</option>
          <option value="ACTIVE">正常</option>
          <option value="INACTIVE">禁用</option>
        </select>
        <select v-model.number="pageSize" class="glass-input h-10 px-3 w-28">
          <option :value="10">10/页</option>
          <option :value="20">20/页</option>
          <option :value="50">50/页</option>
        </select>
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input v-model.trim="keyword" type="text" placeholder="搜索用户..." class="glass-input pl-9 h-10" />
        </div>
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
          <tr v-else-if="users.length === 0">
            <td colspan="6" class="py-8 text-center text-white/40">暂无数据</td>
          </tr>
          <tr v-for="user in users" :key="user.id" class="group">
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
              <div class="inline-flex items-center gap-2">
                <button
                  class="inline-flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors disabled:opacity-40"
                  @click="openDetail(user)"
                >
                  <Eye class="w-4 h-4" />
                  <span class="text-xs">详情</span>
                </button>
                <button
                  class="inline-flex items-center gap-1 p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors disabled:opacity-40"
                  :disabled="updatingId === user.id"
                  @click="toggleStatus(user)"
                >
                  <UserX v-if="user.status === 'ACTIVE'" class="w-4 h-4" />
                  <UserCheck v-else class="w-4 h-4" />
                  <span class="text-xs">{{ user.status === 'ACTIVE' ? '禁用' : '启用' }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/20">
        <div class="text-sm text-white/50">显示 {{ rangeFrom }}-{{ rangeTo }} 共 {{ total }} 条</div>
        <div class="flex items-center gap-2">
          <button class="glass-btn-secondary px-3 py-2 text-sm" :disabled="page <= 1" @click="prevPage">上一页</button>
          <div class="text-sm text-white/60">第 {{ page }} / {{ pageCount }} 页</div>
          <button class="glass-btn-secondary px-3 py-2 text-sm" :disabled="page >= pageCount" @click="nextPage">下一页</button>
        </div>
      </div>
    </Card>

    <GlassModal v-model="detailOpen" title="客户详情">
      <div v-if="detailLoading" class="py-8 text-center text-white/50">加载中...</div>
      <div v-else-if="detailUser" class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
            {{ detailUser.nickname.charAt(0) }}
          </div>
          <div>
            <div class="text-white font-semibold">{{ detailUser.nickname }}</div>
            <div class="text-white/40 text-sm">ID：{{ detailUser.id }}</div>
          </div>
          <div class="ml-auto">
            <span :class="['glass-badge', detailUser.status === 'ACTIVE' ? 'bg-green-500/20 text-green-200 border-green-500/30' : 'bg-white/10 text-white/50 border-white/20']">
              {{ detailUser.status === 'ACTIVE' ? '正常' : '禁用' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div class="text-white/40">手机号</div>
            <div class="text-white/80">{{ detailUser.phone || '未绑定' }}</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div class="text-white/40">邮箱</div>
            <div class="text-white/80">{{ detailUser.email || '未绑定' }}</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div class="text-white/40">订单数</div>
            <div class="text-white/80">{{ detailUser.orderCount }}</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <div class="text-white/40">最后活跃</div>
            <div class="text-white/80">{{ new Date(detailUser.lastActiveAt).toLocaleString() }}</div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 col-span-2">
            <div class="text-white/40">注册时间</div>
            <div class="text-white/80">{{ new Date(detailUser.createdAt).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="glass-btn-secondary" @click="detailOpen = false">关闭</button>
        <button
          v-if="detailUser"
          class="glass-btn"
          :disabled="updatingId === detailUser.id"
          @click="toggleStatus(detailUser)"
        >
          {{ detailUser.status === 'ACTIVE' ? '禁用' : '启用' }}
        </button>
      </template>
    </GlassModal>
  </div>
</template>
