<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import { MessageSquare, CheckCircle, Clock } from 'lucide-vue-next'

const tickets = ref([
  { id: 101, user: 'Alice', subject: '支付失败', status: 'Open', time: '10 min ago' },
  { id: 102, user: 'Bob', subject: '菜品上错', status: 'Closed', time: '2 hours ago' },
])
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-white tracking-tight">客服管理</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Ticket List -->
      <Card no-padding class="h-[600px] flex flex-col">
        <div class="p-4 border-b border-white/10 bg-white/5 font-bold text-white/80">会话列表</div>
        <div class="flex-1 overflow-y-auto">
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            class="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
          >
            <div class="flex justify-between mb-1">
              <span class="font-bold text-white">{{ ticket.user }}</span>
              <span class="text-xs text-white/40">{{ ticket.time }}</span>
            </div>
            <div class="text-sm text-white/70 mb-2">{{ ticket.subject }}</div>
            <div class="flex items-center gap-2">
              <span :class="['glass-badge', ticket.status === 'Open' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 'bg-green-500/20 text-green-200 border-green-500/30']">
                {{ ticket.status }}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Chat Area (Placeholder) -->
      <Card class="h-[600px] flex flex-col justify-center items-center text-white/30">
        <MessageSquare class="w-16 h-16 mb-4 opacity-50" />
        <p>选择左侧会话查看详情</p>
      </Card>
    </div>
  </div>
</template>
