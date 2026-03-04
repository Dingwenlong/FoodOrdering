<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/lib/api'
import type { Order } from '@/types'
import Card from '../components/Card.vue'
import StatusPill from '../components/StatusPill.vue'
import { Search, Filter, MoreHorizontal } from 'lucide-vue-next'

const orders = ref<Order[]>([])
const loading = ref(false)

function statusLabel(status: Order['status']) {
  if (status === 'PENDING_PAY') return '待支付'
  if (status === 'PAID') return '已支付'
  if (status === 'COOKING') return '制作中'
  if (status === 'DONE') return '已完成'
  return '已取消'
}

function statusVariant(status: Order['status']) {
  if (status === 'PENDING_PAY') return 'amber'
  if (status === 'PAID') return 'blue'
  if (status === 'COOKING') return 'blue'
  if (status === 'DONE') return 'green'
  return 'red'
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const data = await api.listOrders()
    orders.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
      <h1 class="text-2xl font-bold tracking-tight text-white">订单管理</h1>
      <div class="flex gap-3">
        <button class="flex gap-2 items-center glass-btn-secondary">
          <Filter class="w-4 h-4" /> 筛选
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-white/40" />
      <input 
        type="text" 
        placeholder="搜索订单号或桌号..." 
        class="pl-10 glass-input"
      />
    </div>

    <!-- Orders Table -->
    <Card no-padding class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="glass-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>桌号</th>
              <th>状态</th>
              <th>商品明细</th>
              <th>总金额</th>
              <th>下单时间</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="py-8 text-center text-white/40">加载中...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="7" class="py-8 text-center text-white/40">暂无订单</td>
            </tr>
            <tr v-for="order in orders" :key="order.id" class="transition-colors group">
              <td class="font-mono text-xs text-white/50">#{{ order.id.slice(0, 8) }}</td>
              <td class="font-bold text-white">{{ order.tableName }}</td>
              <td><StatusPill :label="statusLabel(order.status)" :variant="statusVariant(order.status)" /></td>
              <td class="text-sm text-white/70">
                {{ order.items?.map(i => i.dishName).join(', ') }}
              </td>
              <td class="font-bold text-cyan-300">¥{{ (order.totalPrice.amountFen / 100).toFixed(2) }}</td>
              <td class="text-sm text-white/40">{{ new Date(order.createdAt).toLocaleTimeString() }}</td>
              <td class="text-right">
                <button class="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/60 hover:text-white">
                  <MoreHorizontal class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="flex justify-between items-center px-6 py-4 text-sm border-t border-white/5 text-white/50">
        <div>显示 1-10 共 50 条</div>
        <div class="flex gap-2">
          <button class="px-3 py-1 rounded hover:bg-white/10 disabled:opacity-50">上一页</button>
          <button class="px-3 py-1 text-white rounded bg-white/10">1</button>
          <button class="px-3 py-1 rounded hover:bg-white/10">2</button>
          <button class="px-3 py-1 rounded hover:bg-white/10">下一页</button>
        </div>
      </div>
    </Card>
  </div>
</template>
