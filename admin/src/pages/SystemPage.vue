<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { api } from '@/lib/api'
import type { SystemSettings } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saved = ref(false)
const form = reactive<SystemSettings>({
  storeId: '',
  storeName: '',
  openTime: '09:00',
  closeTime: '22:00',
  autoAccept: true,
  printerEnabled: false,
})

function assign(settings: SystemSettings) {
  Object.assign(form, settings)
}

function validate() {
  if (!form.storeId.trim()) return '门店ID不能为空'
  if (!form.storeName.trim()) return '门店名称不能为空'
  if (!/^\d{2}:\d{2}$/.test(form.openTime) || !/^\d{2}:\d{2}$/.test(form.closeTime)) return '营业时间格式应为 HH:mm'
  return ''
}

async function loadSettings() {
  loading.value = true
  error.value = ''
  try {
    assign(await api.getSystemSettings())
  } catch (err) {
    error.value = err instanceof Error ? err.message : '系统设置加载失败'
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  const msg = validate()
  if (msg) {
    error.value = msg
    return
  }
  saving.value = true
  error.value = ''
  saved.value = false
  try {
    assign(await api.updateSystemSettings({ ...form }))
    saved.value = true
    window.setTimeout(() => { saved.value = false }, 1800)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '系统设置保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="系统设置" description="维护门店基础配置，桌码生成和小程序绑定会使用这里的门店ID。" />

    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div v-if="loading" class="text-white/50">加载设置中...</div>
      <form v-else class="grid gap-5 lg:grid-cols-2" @submit.prevent="saveSettings">
        <label class="grid gap-2 text-sm text-white/60">
          门店ID
          <input v-model.trim="form.storeId" class="input" placeholder="store_1">
        </label>
        <label class="grid gap-2 text-sm text-white/60">
          门店名称
          <input v-model.trim="form.storeName" class="input" placeholder="FoodOrdering 示例门店">
        </label>
        <label class="grid gap-2 text-sm text-white/60">
          营业开始
          <input v-model="form.openTime" class="input" placeholder="09:00">
        </label>
        <label class="grid gap-2 text-sm text-white/60">
          营业结束
          <input v-model="form.closeTime" class="input" placeholder="22:00">
        </label>
        <label class="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
          <span>
            <span class="block font-medium text-white">自动接单</span>
            <span class="text-sm text-white/45">支付成功后自动进入制作队列</span>
          </span>
          <input v-model="form.autoAccept" type="checkbox" class="h-5 w-5 accent-cyan-400">
        </label>
        <label class="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4">
          <span>
            <span class="block font-medium text-white">启用打印</span>
            <span class="text-sm text-white/45">为后续小票打印服务保留开关</span>
          </span>
          <input v-model="form.printerEnabled" type="checkbox" class="h-5 w-5 accent-cyan-400">
        </label>
        <div class="lg:col-span-2 flex items-center gap-3">
          <button class="btn-primary" :disabled="saving" type="submit">{{ saving ? '保存中...' : '保存设置' }}</button>
          <span v-if="saved" class="text-sm text-emerald-300">已保存</span>
          <span v-if="error" class="text-sm text-rose-300">{{ error }}</span>
        </div>
      </form>
    </section>
  </div>
</template>
