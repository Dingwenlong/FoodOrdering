<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '../lib/api'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-vue-next'

interface Dish {
  id: string
  name: string
  priceFen: number
  categoryName: string
  onSale: boolean
  image?: string
}

const dishes = ref<Dish[]>([])
const loading = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const currentDish = ref<Partial<Dish>>({})

const fetchMenu = async () => {
  loading.value = true
  try {
    // Mock data for now
    dishes.value = [
      { id: '1', name: '招牌牛肉面', priceFen: 2800, categoryName: '热销推荐', onSale: true, image: 'https://placehold.co/100x100' },
      { id: '2', name: '鲜虾云吞', priceFen: 2200, categoryName: '热销推荐', onSale: true, image: 'https://placehold.co/100x100' },
      { id: '3', name: '冰可乐', priceFen: 300, categoryName: '饮料', onSale: true },
    ]
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  isEdit.value = false
  currentDish.value = { onSale: true }
  showModal.value = true
}

const openEdit = (dish: Dish) => {
  isEdit.value = true
  currentDish.value = { ...dish }
  showModal.value = true
}

const saveDish = async () => {
  // Save logic here
  showModal.value = false
  fetchMenu()
}

onMounted(fetchMenu)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold text-white tracking-tight">菜品管理</h1>
      <div class="flex gap-3">
        <button class="glass-btn-secondary flex items-center gap-2">
          <Filter class="w-4 h-4" /> 筛选
        </button>
        <button @click="openAdd" class="glass-btn flex items-center gap-2">
          <Plus class="w-5 h-5" /> 新增菜品
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
      <input 
        type="text" 
        placeholder="搜索菜品名称..." 
        class="glass-input pl-10"
      />
    </div>

    <!-- Table -->
    <Card no-padding class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="glass-table">
          <thead>
            <tr>
              <th>图片</th>
              <th>名称</th>
              <th>分类</th>
              <th>价格</th>
              <th>状态</th>
              <th class="text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dish in dishes" :key="dish.id" class="group">
              <td>
                <div class="w-12 h-12 rounded-lg bg-white/10 overflow-hidden border border-white/10">
                  <img v-if="dish.image" :src="dish.image" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-xs text-white/30">无图</div>
                </div>
              </td>
              <td class="font-bold text-white">{{ dish.name }}</td>
              <td class="text-white/70"><span class="glass-badge bg-blue-500/20 text-blue-200 border-blue-500/30">{{ dish.categoryName }}</span></td>
              <td class="font-bold text-cyan-300">¥{{ (dish.priceFen / 100).toFixed(2) }}</td>
              <td>
                <span :class="['glass-badge', dish.onSale ? 'bg-green-500/20 text-green-200 border-green-500/30' : 'bg-red-500/20 text-red-200 border-red-500/30']">
                  {{ dish.onSale ? '上架中' : '已下架' }}
                </span>
              </td>
              <td class="text-right space-x-2">
                <button @click="openEdit(dish)" class="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors" title="编辑">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button class="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors" title="删除">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Edit Modal -->
    <GlassModal v-model="showModal" :title="isEdit ? '编辑菜品' : '新增菜品'">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">菜品名称</label>
          <input v-model="currentDish.name" type="text" class="glass-input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">价格 (分)</label>
          <input v-model="currentDish.priceFen" type="number" class="glass-input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">所属分类</label>
          <select class="glass-select w-full">
            <option>热销推荐</option>
            <option>主食</option>
            <option>饮料</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="currentDish.onSale" class="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500/50" />
          <span class="text-white/80">立即上架</span>
        </div>
      </div>
      <template #footer>
        <button @click="showModal = false" class="glass-btn-secondary">取消</button>
        <button @click="saveDish" class="glass-btn">保存</button>
      </template>
    </GlassModal>
  </div>
</template>
