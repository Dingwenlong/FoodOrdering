<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import type { SupportTicket, SupportTicketDetail, SupportTicketMessage } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import { MessageSquare, RefreshCw, Search, Send } from 'lucide-vue-next'

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

const messages = ref<SupportTicketMessage[]>([])
const messagesLoading = ref(false)
const messagesPage = ref(1)
const messagesTotal = ref(0)
const messageInput = ref('')
const sendingMessage = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const selectedTicket = computed(() => tickets.value.find((t) => t.id === selectedId.value) ?? null)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const rangeFrom = computed(() => (total.value <= 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeTo = computed(() => Math.min(total.value, page.value * pageSize.value))
const hasMoreMessages = computed(() => messages.value.length < messagesTotal.value)

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

async function loadMessages(ticketId: string, resetPage = true) {
  if (resetPage) {
    messagesPage.value = 1
    messages.value = []
  }
  messagesLoading.value = true
  try {
    const res = await api.listTicketMessages(ticketId, {
      page: messagesPage.value,
      pageSize: 20,
    })
    if (resetPage) {
      messages.value = res.list
    } else {
      messages.value = [...res.list, ...messages.value]
    }
    messagesTotal.value = res.total
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载消息失败'
  } finally {
    messagesLoading.value = false
  }
}

async function loadMoreMessages() {
  if (messagesLoading.value || !hasMoreMessages.value || !selectedId.value) return
  messagesPage.value++
  await loadMessages(selectedId.value, false)
}

async function sendMessage() {
  if (!selectedId.value || !messageInput.value.trim() || sendingMessage.value) return
  
  sendingMessage.value = true
  errorMsg.value = null
  try {
    const newMessage = await api.sendTicketMessage(selectedId.value, {
      content: messageInput.value.trim(),
    })
    messages.value.unshift(newMessage)
    messagesTotal.value++
    messageInput.value = ''
    
    const ticket = tickets.value.find((t) => t.id === selectedId.value)
    if (ticket) {
      ticket.lastMessageAt = newMessage.createdAt
    }
    if (detail.value) {
      detail.value.lastMessageAt = newMessage.createdAt
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '发送消息失败'
  } finally {
    sendingMessage.value = false
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
      messages.value = []
      return
    }
    loadDetail(id)
    loadMessages(id, true)
  },
  { immediate: false },
)

onMounted(() => loadTickets())
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white tracking-tight">
        客服管理
      </h1>
      <div class="flex items-center gap-3">
        <select
          v-model="statusFilter"
          class="glass-input h-10 px-3 w-28"
        >
          <option value="ALL">
            全部
          </option>
          <option value="OPEN">
            待处理
          </option>
          <option value="CLOSED">
            已关闭
          </option>
        </select>
        <select
          v-model.number="pageSize"
          class="glass-input h-10 px-3 w-28"
        >
          <option :value="10">
            10/页
          </option>
          <option :value="20">
            20/页
          </option>
          <option :value="50">
            50/页
          </option>
        </select>
        <div class="relative w-64">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
          <input
            v-model.trim="keyword"
            type="text"
            placeholder="搜索工单..."
            class="glass-input pl-9 h-10"
          >
        </div>
        <button
          class="glass-btn-secondary flex items-center gap-2"
          :disabled="loading"
          @click="loadTickets()"
        >
          <RefreshCw class="w-4 h-4" /> 刷新
        </button>
      </div>
    </div>

    <div
      v-if="errorMsg"
      class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
    >
      {{ errorMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ticket List -->
      <Card
        no-padding
        class="h-[600px] flex flex-col"
      >
        <div class="p-4 border-b border-white/10 bg-white/5 font-bold text-white/80">
          会话列表
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="loading"
            class="p-6 text-sm text-white/50"
          >
            加载中...
          </div>
          <div
            v-else-if="tickets.length === 0"
            class="p-6 text-sm text-white/50"
          >
            暂无工单
          </div>
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer"
            :class="{ 'bg-white/10': selectedId === ticket.id }"
            @click="selectedId = ticket.id"
          >
            <div class="flex justify-between mb-1">
              <span class="font-bold text-white">{{ ticket.nickname }}</span>
              <span class="text-xs text-white/40">{{ new Date(ticket.lastMessageAt).toLocaleString() }}</span>
            </div>
            <div class="text-sm text-white/70 mb-2">
              {{ ticket.topic }}
            </div>
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
          <div class="text-sm text-white/50">
            显示 {{ rangeFrom }}-{{ rangeTo }} 共 {{ total }} 条
          </div>
          <div class="flex items-center gap-2">
            <button
              class="glass-btn-secondary px-3 py-2 text-sm"
              :disabled="page <= 1"
              @click="prevPage"
            >
              上一页
            </button>
            <div class="text-sm text-white/60">
              第 {{ page }} / {{ pageCount }} 页
            </div>
            <button
              class="glass-btn-secondary px-3 py-2 text-sm"
              :disabled="page >= pageCount"
              @click="nextPage"
            >
              下一页
            </button>
          </div>
        </div>
      </Card>

      <!-- Chat Area -->
      <Card class="h-[600px] flex flex-col">
        <div class="p-4 border-b border-white/10 bg-white/5 font-bold text-white/80 flex items-center justify-between">
          <span>工单详情</span>
          <button
            v-if="selectedId"
            class="text-xs text-white/60 hover:text-white flex items-center gap-1"
            :disabled="messagesLoading"
            @click="selectedId && loadMessages(selectedId, true)"
          >
            <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': messagesLoading }" />
            刷新消息
          </button>
        </div>
        
        <!-- Ticket Info -->
        <div
          v-if="!selectedTicket"
          class="flex flex-col justify-center items-center text-white/30 h-full"
        >
          <MessageSquare class="w-16 h-16 mb-4 opacity-50" />
          <p>选择左侧会话查看详情</p>
        </div>
        <div
          v-else-if="detailLoading"
          class="p-4 text-sm text-white/50"
        >
          加载中...
        </div>
        <template v-else-if="detail">
          <!-- Ticket Header -->
          <div class="p-4 border-b border-white/10">
            <div class="flex items-start gap-3">
              <MessageSquare class="w-10 h-10 text-white/30" />
              <div class="flex-1 min-w-0">
                <div class="text-lg text-white font-semibold truncate">
                  {{ detail.nickname }}
                </div>
                <div class="text-sm text-white/70 truncate">
                  {{ detail.topic }}
                </div>
                <div class="text-xs text-white/40 mt-1">
                  工单ID：{{ detail.id }}
                </div>
              </div>
              <span :class="['glass-badge shrink-0', detail.status === 'OPEN' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30']">
                {{ statusLabel(detail.status) }}
              </span>
            </div>
          </div>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto p-4 space-y-3"
          >
            <!-- Load More -->
            <div
              v-if="hasMoreMessages"
              class="text-center"
            >
              <button
                class="text-xs text-white/50 hover:text-white/80 py-2"
                :disabled="messagesLoading"
                @click="loadMoreMessages"
              >
                {{ messagesLoading ? '加载中...' : '加载更多消息' }}
              </button>
            </div>

            <!-- Message List -->
            <div
              v-for="message in [...messages].reverse()"
              :key="message.id"
              class="flex"
              :class="message.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-lg px-3 py-2"
                :class="message.senderType === 'ADMIN' 
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-100' 
                  : 'bg-white/10 border border-white/20 text-white'"
              >
                <div class="text-xs opacity-70 mb-1">
                  {{ message.senderName }} · {{ new Date(message.createdAt).toLocaleString() }}
                </div>
                <div class="text-sm whitespace-pre-wrap">
                  {{ message.content }}
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="messages.length === 0 && !messagesLoading"
              class="text-center text-white/30 py-8"
            >
              暂无消息，开始对话吧
            </div>
          </div>

          <!-- Input Area -->
          <div class="p-4 border-t border-white/10 bg-black/20">
            <div class="flex gap-2">
              <textarea
                v-model="messageInput"
                rows="2"
                placeholder="输入回复消息..."
                class="glass-input flex-1 resize-none"
                :disabled="sendingMessage || detail.status === 'CLOSED'"
                @keydown.enter.prevent="sendMessage"
              />
              <button
                class="glass-btn px-4 flex items-center gap-2 shrink-0"
                :disabled="!messageInput.trim() || sendingMessage || detail.status === 'CLOSED'"
                @click="sendMessage"
              >
                <Send class="w-4 h-4" />
                {{ sendingMessage ? '发送中...' : '发送' }}
              </button>
            </div>
            <div
              v-if="detail.status === 'CLOSED'"
              class="text-xs text-white/40 mt-2"
            >
              该工单已关闭，无法发送消息
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
