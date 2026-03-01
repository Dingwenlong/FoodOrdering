<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'

const notices = ref([
  { id: 1, title: '系统维护通知', content: '将于本周日凌晨进行系统升级...', date: '2023-10-05', status: 'Published' },
  { id: 2, title: '新品上市', content: '秋季新品系列将于下周一正式上线，敬请期待！', date: '2023-10-01', status: 'Draft' },
])

const showModal = ref(false)
const currentNotice = ref({})

const openEdit = (notice: any) => {
  currentNotice.value = { ...notice }
  showModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white tracking-tight">公告管理</h1>
      <button @click="showModal = true" class="glass-btn flex items-center gap-2">
        <Plus class="w-5 h-5" /> 发布公告
      </button>
    </div>

    <Card no-padding class="overflow-hidden">
      <table class="glass-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>内容摘要</th>
            <th>状态</th>
            <th>发布时间</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="notice in notices" :key="notice.id" class="group">
            <td class="font-bold text-white">{{ notice.title }}</td>
            <td class="text-white/60 max-w-xs truncate">{{ notice.content }}</td>
            <td>
              <span :class="['glass-badge', notice.status === 'Published' ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30' : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30']">
                {{ notice.status === 'Published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="text-white/40 text-sm">{{ notice.date }}</td>
            <td class="text-right space-x-2">
              <button @click="openEdit(notice)" class="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
              <button class="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>

    <GlassModal v-model="showModal" title="编辑公告">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">标题</label>
          <input type="text" class="glass-input" placeholder="输入公告标题" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">内容</label>
          <textarea class="glass-input h-32 resize-none" placeholder="输入公告内容..."></textarea>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" class="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500" />
          <span class="text-white/80">立即发布</span>
        </div>
      </div>
      <template #footer>
        <button @click="showModal = false" class="glass-btn-secondary">取消</button>
        <button @click="showModal = false" class="glass-btn">保存</button>
      </template>
    </GlassModal>
  </div>
</template>
