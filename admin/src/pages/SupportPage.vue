<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { SupportTicket } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import { MessageSquare, RefreshCw } from 'lucide-vue-next'

const tickets = ref<SupportTicket[]>([])
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const updatingId = ref<string | null>(null)
const selectedId = ref<string | null>(null)

const selectedTicket = computed(() => tickets.value.find((t) => t.id === selectedId.value) ?? null)

async function loadTickets() {
  loading.value = true
  errorMsg.value = null
  try {
    tickets.value = await api.listSupportTickets()
    if (!selectedId.value && tickets.value.length > 0) {
      selectedId.value = tickets.value[0].id
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
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '更新工单状态失败'
  } finally {
    updatingId.value = null
  }
}

onMounted(loadTickets)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white tracking-tight">客服管理</h1>
      <button class="glass-btn-secondary flex items-center gap-2" :disabled="loading" @click="loadTickets">
        <RefreshCw class="w-4 h-4" /> 刷新
      </button>
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
      </Card>

      <!-- Chat Area (Placeholder) -->
      <Card class="h-[600px] flex flex-col justify-center items-center text-white/30">
        <template v-if="selectedTicket">
          <MessageSquare class="w-12 h-12 mb-4 opacity-50" />
          <div class="text-lg text-white mb-2">{{ selectedTicket.nickname }}</div>
          <div class="text-sm text-white/70 mb-2">{{ selectedTicket.topic }}</div>
          <div class="text-xs text-white/50">最后消息：{{ new Date(selectedTicket.lastMessageAt).toLocaleString() }}</div>
          <div class="mt-3">
            <span :class="['glass-badge', selectedTicket.status === 'OPEN' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30']">
              {{ statusLabel(selectedTicket.status) }}
            </span>
          </div>
        </template>
        <template v-else>
          <MessageSquare class="w-16 h-16 mb-4 opacity-50" />
          <p>选择左侧会话查看详情</p>
        </template>
      </Card>
    </div>
  </div>
</template>
