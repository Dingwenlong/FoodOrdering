<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { api } from '@/lib/api'
import type { DishSales, StatsSummary, StatsTrendPoint } from '@/types'

const loading = ref(false)
const error = ref('')
const today = new Date().toISOString().slice(0, 10)
const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
const range = ref({ from: weekAgo, to: today })
const summary = ref<StatsSummary | null>(null)
const trend = ref<StatsTrendPoint[]>([])
const dishSales = ref<DishSales[]>([])

const maxRevenue = computed(() => Math.max(1, ...trend.value.map((p) => p.revenue.amountFen)))

function money(amountFen?: number) {
  return `¥${((amountFen ?? 0) / 100).toFixed(2)}`
}

async function loadStats() {
  loading.value = true
  error.value = ''
  try {
    const params = { from: range.value.from || undefined, to: range.value.to || undefined }
    const [summaryRes, trendRes, dishRes] = await Promise.all([
      api.getStatsSummary(params),
      api.getStatsTrend(params),
      api.getDishSales(),
    ])
    summary.value = summaryRes
    trend.value = trendRes
    dishSales.value = dishRes.slice(0, 8)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '统计数据加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="数据统计" description="按日期查看营收、订单、支付成功率和菜品销量。" />

    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="flex flex-wrap items-end gap-3">
        <label class="grid gap-1 text-sm text-white/60">开始日期<input v-model="range.from" class="input" type="date"></label>
        <label class="grid gap-1 text-sm text-white/60">结束日期<input v-model="range.to" class="input" type="date"></label>
        <button class="btn-primary" :disabled="loading" @click="loadStats">刷新</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
    </section>

    <section class="grid gap-4 md:grid-cols-4">
      <div class="stat-card"><span>营业额</span><strong>{{ money(summary?.revenue.amountFen) }}</strong></div>
      <div class="stat-card"><span>订单数</span><strong>{{ summary?.orderCount ?? 0 }}</strong></div>
      <div class="stat-card"><span>客单价</span><strong>{{ money(summary?.averageOrderValue.amountFen) }}</strong></div>
      <div class="stat-card"><span>支付成功率</span><strong>{{ (((summary?.paymentSuccessRate ?? 0) * 100).toFixed(1)) }}%</strong></div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
        <h2 class="mb-4 text-lg font-semibold">营收趋势</h2>
        <div class="flex h-72 items-end gap-3">
          <div v-for="point in trend" :key="point.date" class="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div class="w-full rounded-t-lg bg-cyan-400/70" :style="{ height: `${Math.max(8, point.revenue.amountFen / maxRevenue * 220)}px` }" />
            <span class="truncate text-xs text-white/45">{{ point.date.slice(5) }}</span>
          </div>
        </div>
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 class="mb-4 text-lg font-semibold">热销菜品</h2>
        <div class="space-y-3">
          <div v-for="dish in dishSales" :key="dish.dishId" class="flex items-center justify-between rounded-xl bg-black/20 p-3">
            <span>{{ dish.dishName }}</span>
            <strong>{{ dish.soldQty }}</strong>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
