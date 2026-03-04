<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { SupportTicket, SupportTicketDetail } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import { MessageSquare, RefreshCw, Search } from 'lucide-vue-next'

const tickets = ref<SupportTicket[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const updatingId = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const keyword = ref('')
const statusFilter = ref<'ALL' | SupportTicket['status']>('ALL')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const detail = ref<SupportTicketDetail | null>(null)
const detailLoading = ref(false)

const selectedTicket = computed(() => tickets.value.find((t) => t.id === selectedId.value) ?? null)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const rangeFrom = computed(() => (total.value <= 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(total.value, page.value * pageSize.value))

async function loadTickets(resetPage = false) {
  if (resetPage) {
    page.value = 1
  }
  loading.value = true
  errorMsg.value = null
  try {
    const res = await api.listSupportTicketsPaged({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
    })
    tickets.value = res.list
    total.value = res.total
    if (page.value > pageCount.value) {
      page.value = pageCount.value
      const retry = await api.listSupportTicketsPaged({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value.trim() || undefined,
        status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
      })
      tickets.value = retry.list
      total.value = retry.total
    }
    if (!selectedId.value && tickets.value.length > 0) {
      selectedId.value = tickets.value[0].id
    }
    if (selectedId.value && !tickets.value.some((t) => t.id === selectedId.value)) {
      selectedId.value = tickets.value[0]?.id ?? null
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载工单失败'
  } finally {
    loading.value = false
  }
}

function statusLabel(status: SupportTicket['status']) {
  return status === 'OPEN' ? '待处理' : '已关闭'
}

async function loadDetail(ticketId: string) {
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await api.getSupportTicketDetail(ticketId)
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载工单详情失败'
  } finally {
    detailLoading.value = false
  }
}

async function toggleTicketStatus(ticket: SupportTicket) {
  const nextStatus: SupportTicket['status'] = ticket.status === 'OPEN' ? 'CLOSED' : 'OPEN'
  updatingId.value = ticket.id
  errorMsg.value = null
  try {
    const updated = await api.updateSupportTicketStatus({ ticketId: ticket.id, status: nextStatus })
    const idx = tickets.value.findIndex((t) => t.id === ticket.id)
    if (idx >= 0) {
      tickets.value[idx] = updated
    }
    if (detail.value?.id === ticket.id) {
      detail.value = { ...detail.value, status: updated.status }
      await loadDetail(ticket.id)
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '更新工单状态失败'
  } finally {
    updatingId.value = null
  }
}

function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  loadTickets()
}

function nextPage() {
  if (page.value >= pageCount.value) return
  page.value += 1
  loadTickets()
}

let keywordTimer: number | null = null
watch(keyword, () => {
  if (keywordTimer) window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(() => loadTickets(true), 300)
})

watch([statusFilter, pageSize], () => {
  loadTickets(true)
})

watch(
  selectedId,
  (id) => {
    if (!id) {
      detail.value = null
      return
    }
    loadDetail(id)
  },
  { immediate: false },
)

onMounted(() => loadTickets())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white tracking-tight">客服管理</h1>
      <div class="flex items-center gap-3">
        <select v-model="statusFilter" class="glass-input h-10 px-3 w-28">
          <option value="ALL">全部</option>
          <option value="OPEN">待处理</option>
          <option value="CLOSED">已关闭</option>
        </select>
        <select v-model.number="pageSize" class="glass-input h-10 px-3 w-28">
          <option :value="10">10/页</option>
          <option :value="20">20/页</option>
          <option :value="50">50/页</option>
        </select>
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input v-model.trim="keyword" type="text" placeholder="搜索工单..." class="glass-input pl-9 h-10" />
        </div>
        <button class="glass-btn-secondary flex items-center gap-2" :disabled="loading" @click="loadTickets()">
          <RefreshCw class="w-4 h-4" /> 刷新
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {{ errorMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ticket List -->
      <Card no-padding class="h-[600px] flex flex-col">
        <div class="p-4 border-b border-white/10 bg-white/5 font-bold text-white/80">会话列表</div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="loading" class="p-6 text-sm text-white/50">加载中...</div>
          <div v-else-if="tickets.length === 0" class="p-6 text-sm text-white/50">暂无工单</div>
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group"
            :class="{ 'bg-white/10': selectedId === ticket.id }"
            @click="selectedId = ticket.id"
          >
            <div class="flex justify-between mb-1">
              <span class="font-bold text-white">{{ ticket.nickname }}</span>
              <span class="text-xs text-white/40">{{ new Date(ticket.lastMessageAt).toLocaleString() }}</span>
            </div>
            <div class="text-sm text-white/70 mb-2">{{ ticket.topic }}</div>
            <div class="flex items-center justify-between gap-2">
              <span :class="['glass-badge', ticket.status === 'OPEN' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30']">
                {{ statusLabel(ticket.status) }}
              </span>
              <button
                class="h-7 rounded-md border border-white/20 px-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40"
                :disabled="updatingId === ticket.id"
                @click.stop="toggleTicketStatus(ticket)"
              >
                {{ ticket.status === 'OPEN' ? '关闭工单' : '重新打开' }}
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between px-4 py-3 border-t border-white/10 bg-black/20">
          <div class="text-sm text-white/50">显示 {{ rangeFrom }}-{{ rangeTo }} 共 {{ total }} 条</div>
          <div class="flex items-center gap-2">
            <button class="glass-btn-secondary px-3 py-2 text-sm" :disabled="page <= 1" @click="prevPage">上一页</button>
            <div class="text-sm text-white/60">第 {{ page }} / {{ pageCount }} 页</div>
            <button class="glass-btn-secondary px-3 py-2 text-sm" :disabled="page >= pageCount" @click="nextPage">下一页</button>
          </div>
        </div>
      </Card>

      <!-- Chat Area (Placeholder) -->
      <Card class="h-[600px] flex flex-col">
        <div class="p-4 border-b border-white/10 bg-white/5 font-bold text-white/80">工单详情</div>
        <div class="flex-1 overflow-y-auto p-6">
          <div v-if="!selectedTicket" class="flex flex-col justify-center items-center text-white/30 h-full">
            <MessageSquare class="w-16 h-16 mb-4 opacity-50" />
            <p>选择左侧会话查看详情</p>
          </div>
          <div v-else-if="detailLoading" class="text-sm text-white/50">加载中...</div>
          <div v-else-if="detail" class="space-y-4">
            <div class="flex items-start gap-3">
              <MessageSquare class="w-10 h-10 text-white/30" />
              <div class="flex-1">
                <div class="text-lg text-white font-semibold">{{ detail.nickname }}</div>
                <div class="text-sm text-white/70">{{ detail.topic }}</div>
                <div class="text-xs text-white/40 mt-1">工单ID：{{ detail.id }}</div>
              </div>
              <span :class="['glass-badge', detail.status === 'OPEN' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30']">
                {{ statusLabel(detail.status) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div class="text-white/40">最后消息</div>
                <div class="text-white/80">{{ new Date(detail.lastMessageAt).toLocaleString() }}</div>
              </div>
              <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div class="text-white/40">更新时间</div>
                <div class="text-white/80">{{ new Date(detail.updatedAt).toLocaleString() }}</div>
              </div>
              <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 col-span-2">
                <div class="text-white/40">创建时间</div>
                <div class="text-white/80">{{ new Date(detail.createdAt).toLocaleString() }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-white/50">暂无详情数据</div>
        </div>
        <div class="p-4 border-t border-white/10 bg-black/20 flex items-center justify-end gap-3">
          <button class="glass-btn-secondary" :disabled="!selectedTicket || detailLoading" @click="selectedId && loadDetail(selectedId)">
            刷新详情
          </button>
          <button
            v-if="selectedTicket"
            class="glass-btn"
            :disabled="updatingId === selectedTicket.id"
            @click="toggleTicketStatus(selectedTicket)"
          >
            {{ selectedTicket.status === 'OPEN' ? '关闭工单' : '重新打开' }}
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>
