<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import type { Order, OrderStatus, PageResult } from '@/types'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const detailLoading = ref(false)
const selectedOrder = ref<Order | null>(null)
const page = ref(1)
const pageSize = ref(10)
const filters = ref<{ keyword: string; status: '' | OrderStatus; from: string; to: string }>({
  keyword: '',
  status: '',
  from: '',
  to: '',
})
const result = ref<PageResult<Order>>({ list: [], total: 0, page: 1, pageSize: 10 })

const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize.value)))
const canOperate = computed(() => auth.hasPermission('ORDER_STATUS_UPDATE'))

const statusOptions: Array<{ label: string; value: '' | OrderStatus }> = [
  { label: '全部状态', value: '' },
  { label: '待支付', value: 'PENDING_PAY' },
  { label: '已支付', value: 'PAID' },
  { label: '制作中', value: 'COOKING' },
  { label: '已完成', value: 'DONE' },
  { label: '已取消', value: 'CANCELED' },
]

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: 'COOKING',
  COOKING: 'DONE',
}

function formatMoney(amountFen?: number) {
  return `¥${((amountFen ?? 0) / 100).toFixed(2)}`
}

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function nextStatusLabel(status: OrderStatus) {
  const next = nextStatusMap[status]
  if (next === 'COOKING') return '开始制作'
  if (next === 'DONE') return '完成订单'
  return ''
}

async function loadOrders(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = ''
  try {
    result.value = await api.listOrdersPaged({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.value.keyword || undefined,
      status: filters.value.status || undefined,
      from: filters.value.from || undefined,
      to: filters.value.to || undefined,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '订单加载失败'
  } finally {
    loading.value = false
  }
}

async function openDetail(order: Order) {
  selectedOrder.value = order
  detailLoading.value = true
  try {
    selectedOrder.value = await api.getOrderDetail(order.id)
  } finally {
    detailLoading.value = false
  }
}

async function updateStatus(order: Order, status: OrderStatus) {
  if (!canOperate.value) return
  const updated = await api.updateOrderStatus({ orderId: order.id, status })
  selectedOrder.value = updated
  await loadOrders()
}

function changePage(delta: number) {
  const next = Math.min(totalPages.value, Math.max(1, page.value + delta))
  if (next !== page.value) {
    page.value = next
    void loadOrders()
  }
}

onMounted(() => loadOrders())
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="订单管理" description="实时检索订单、查看支付明细并推进出餐状态。" />

    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="grid gap-3 md:grid-cols-[1.4fr_160px_160px_160px_auto]">
        <input v-model="filters.keyword" class="input" placeholder="订单号、用户、桌台" @keyup.enter="loadOrders(true)">
        <select v-model="filters.status" class="input">
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <input v-model="filters.from" class="input" type="date">
        <input v-model="filters.to" class="input" type="date">
        <button class="btn-primary" @click="loadOrders(true)">筛选</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1fr_420px]">
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <table class="w-full text-sm">
          <thead class="bg-white/[0.04] text-left text-white/50">
            <tr>
              <th class="px-4 py-3">订单</th>
              <th class="px-4 py-3">用户/桌台</th>
              <th class="px-4 py-3">金额</th>
              <th class="px-4 py-3">状态</th>
              <th class="px-4 py-3">下单时间</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in result.list" :key="order.id" class="border-t border-white/5 hover:bg-white/[0.03]">
              <td class="px-4 py-3">
                <div class="font-medium text-white">{{ order.orderNo || order.id }}</div>
                <div class="text-xs text-white/40">#{{ order.id }}</div>
              </td>
              <td class="px-4 py-3">
                <div>{{ order.user?.nickname || '未知用户' }}</div>
                <div class="text-xs text-white/40">{{ order.tableName }}</div>
              </td>
              <td class="px-4 py-3 font-medium">{{ formatMoney(order.totalPrice.amountFen) }}</td>
              <td class="px-4 py-3"><StatusPill :status="order.status" /></td>
              <td class="px-4 py-3 text-white/60">{{ formatTime(order.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <button class="btn-ghost" @click="openDetail(order)">详情</button>
              </td>
            </tr>
            <tr v-if="!loading && result.list.length === 0">
              <td colspan="6" class="px-4 py-10 text-center text-white/40">暂无订单</td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/50">
          <span>共 {{ result.total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
          <div class="flex gap-2">
            <button class="btn-ghost" :disabled="page <= 1" @click="changePage(-1)">上一页</button>
            <button class="btn-ghost" :disabled="page >= totalPages" @click="changePage(1)">下一页</button>
          </div>
        </div>
      </div>

      <aside class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div v-if="!selectedOrder" class="flex h-full min-h-80 items-center justify-center text-white/40">选择订单查看详情</div>
        <div v-else class="space-y-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-white">{{ selectedOrder.orderNo || selectedOrder.id }}</h2>
              <p class="text-sm text-white/50">{{ selectedOrder.user?.nickname || '未知用户' }} · {{ selectedOrder.tableName }}</p>
            </div>
            <StatusPill :status="selectedOrder.status" />
          </div>
          <div v-if="detailLoading" class="text-sm text-white/40">加载详情中...</div>
          <div class="space-y-3">
            <div v-for="item in selectedOrder.items" :key="`${item.dishId}:${item.skuName || ''}`" class="flex justify-between rounded-xl bg-black/20 p-3">
              <div>
                <div class="font-medium">{{ item.dishName }}</div>
                <div v-if="item.skuName" class="text-xs text-white/45">{{ item.skuName }}</div>
                <div class="text-xs text-white/40">x {{ item.qty }}</div>
              </div>
              <div>{{ formatMoney(item.unitPrice.amountFen * item.qty) }}</div>
            </div>
          </div>
          <div class="rounded-xl bg-black/20 p-3 text-sm">
            <div class="flex justify-between"><span class="text-white/50">合计</span><strong>{{ formatMoney(selectedOrder.totalPrice.amountFen) }}</strong></div>
            <div class="mt-2 flex justify-between"><span class="text-white/50">备注</span><span>{{ selectedOrder.remark || '-' }}</span></div>
            <div class="mt-2 flex justify-between"><span class="text-white/50">完成时间</span><span>{{ formatTime(selectedOrder.completedAt) }}</span></div>
          </div>
          <div>
            <h3 class="mb-2 text-sm font-medium text-white/70">支付记录</h3>
            <div v-for="pay in selectedOrder.payments || []" :key="pay.id" class="mb-2 rounded-xl bg-black/20 p-3 text-sm">
              <div class="flex justify-between"><span>{{ pay.paymentNo }}</span><span>{{ pay.status }}</span></div>
              <div class="mt-1 text-white/45">{{ pay.method }} · {{ formatMoney(pay.amount.amountFen) }} · {{ formatTime(pay.paidAt) }}</div>
            </div>
            <div v-if="!selectedOrder.payments?.length" class="text-sm text-white/40">暂无支付记录</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="nextStatusMap[selectedOrder.status]"
              class="btn-primary"
              :disabled="!canOperate"
              @click="updateStatus(selectedOrder, nextStatusMap[selectedOrder.status]!)"
            >
              {{ nextStatusLabel(selectedOrder.status) }}
            </button>
            <button
              v-if="selectedOrder.status !== 'DONE' && selectedOrder.status !== 'CANCELED'"
              class="btn-ghost"
              :disabled="!canOperate"
              @click="updateStatus(selectedOrder, 'CANCELED')"
            >
              取消订单
            </button>
          </div>
        </div>
      </aside>
    </section>
  </div>
</template>
