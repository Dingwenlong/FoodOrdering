<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import { Save } from 'lucide-vue-next'

const settings = ref({
  storeName: '未来餐厅旗舰店',
  openTime: '09:00',
  closeTime: '22:00',
  autoAccept: true,
  printerEnabled: false
})

const saving = ref(false)

const handleSave = () => {
  saving.value = true
  setTimeout(() => saving.value = false, 1000)
}
</script>

<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold text-white tracking-tight">
      系统设置
    </h1>

    <Card title="门店信息">
      <div class="grid gap-6">
        <div>
          <label class="block text-sm font-medium text-white/60 mb-2">门店名称</label>
          <input
            v-model="settings.storeName"
            type="text"
            class="glass-input"
          >
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">营业开始时间</label>
            <input
              v-model="settings.openTime"
              type="time"
              class="glass-input"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-white/60 mb-2">营业结束时间</label>
            <input
              v-model="settings.closeTime"
              type="time"
              class="glass-input"
            >
          </div>
        </div>
      </div>
    </Card>

    <Card title="订单设置">
      <div class="space-y-4">
        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
          <div>
            <div class="font-medium text-white">
              自动接单
            </div>
            <div class="text-xs text-white/50">
              新订单自动进入制作状态
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="settings.autoAccept"
              type="checkbox"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>

        <div class="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
          <div>
            <div class="font-medium text-white">
              云打印机
            </div>
            <div class="text-xs text-white/50">
              接单后自动打印小票
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="settings.printerEnabled"
              type="checkbox"
              class="sr-only peer"
            >
            <div class="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
          </label>
        </div>
      </div>
    </Card>

    <div class="flex justify-end pt-4">
      <button 
        class="glass-btn px-8 py-3 text-lg flex items-center gap-2" 
        :disabled="saving"
        @click="handleSave"
      >
        <Save
          v-if="!saving"
          class="w-5 h-5"
        />
        <span
          v-else
          class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
        />
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>
  </div>
</template>
