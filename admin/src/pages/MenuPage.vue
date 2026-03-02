<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Category, Dish } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-vue-next'

type DishRow = Dish & { categoryName: string }

const categories = ref<Category[]>([])
const dishes = ref<Dish[]>([])
const keyword = ref('')
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const showModal = ref(false)
const isEdit = ref(false)
const form = ref({
  dishId: '',
  categoryId: '',
  name: '',
  priceFen: 0,
  onSale: true,
  soldOut: false,
})

const categoryMap = computed(() => new Map(categories.value.map((c) => [c.id, c.name])))

const dishRows = computed<DishRow[]>(() => {
  const q = keyword.value.trim().toLowerCase()
  const rows = dishes.value.map((dish) => ({
    ...dish,
    categoryName: categoryMap.value.get(dish.categoryId) ?? '未分类',
  }))
  if (!q) return rows
  return rows.filter((d) => d.name.toLowerCase().includes(q) || d.categoryName.toLowerCase().includes(q))
})

function resetForm() {
  form.value = {
    dishId: '',
    categoryId: categories.value[0]?.id ?? '',
    name: '',
    priceFen: 0,
    onSale: true,
    soldOut: false,
  }
}

async function loadMenu() {
  loading.value = true
  errorMsg.value = null
  try {
    const data = await api.listMenu()
    categories.value = data.categories
    dishes.value = data.dishes
    if (!form.value.categoryId && categories.value.length > 0) {
      form.value.categoryId = categories.value[0].id
    }
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载菜单失败'
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  resetForm()
  showModal.value = true
}

function openEdit(dish: Dish) {
  isEdit.value = true
  form.value = {
    dishId: dish.id,
    categoryId: dish.categoryId,
    name: dish.name,
    priceFen: dish.priceFen,
    onSale: dish.onSale,
    soldOut: dish.soldOut,
  }
  showModal.value = true
}

async function saveDish() {
  if (!form.value.name.trim()) {
    errorMsg.value = '菜品名称不能为空'
    return
  }
  if (!form.value.categoryId) {
    errorMsg.value = '请选择所属分类'
    return
  }
  if (!Number.isFinite(form.value.priceFen) || form.value.priceFen < 0) {
    errorMsg.value = '价格必须为非负数'
    return
  }

  saving.value = true
  errorMsg.value = null
  try {
    const payload = {
      categoryId: form.value.categoryId,
      name: form.value.name.trim(),
      priceFen: Number(form.value.priceFen),
      onSale: form.value.onSale,
      soldOut: form.value.soldOut,
    }
    if (isEdit.value) {
      await api.updateDish({ dishId: form.value.dishId, ...payload })
    } else {
      await api.createDish(payload)
    }
    showModal.value = false
    resetForm()
    await loadMenu()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '保存菜品失败'
  } finally {
    saving.value = false
  }
}

async function handleDelete(dishId: string) {
  if (!window.confirm('确认删除该菜品？')) return
  deletingId.value = dishId
  errorMsg.value = null
  try {
    await api.deleteDish(dishId)
    await loadMenu()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '删除菜品失败'
  } finally {
    deletingId.value = null
  }
}

onMounted(async () => {
  await loadMenu()
  resetForm()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 class="text-2xl font-bold text-white tracking-tight">菜品管理</h1>
      <div class="flex gap-3">
        <button class="glass-btn-secondary flex items-center gap-2" :disabled="loading" @click="loadMenu">
          <Filter class="w-4 h-4" /> 筛选
        </button>
        <button @click="openAdd" class="glass-btn flex items-center gap-2">
          <Plus class="w-5 h-5" /> 新增菜品
        </button>
      </div>
    </div>

    <div v-if="errorMsg" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {{ errorMsg }}
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
      <input 
        v-model.trim="keyword"
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
            <tr v-if="loading">
              <td colspan="6" class="py-8 text-center text-white/40">加载中...</td>
            </tr>
            <tr v-else-if="dishRows.length === 0">
              <td colspan="6" class="py-8 text-center text-white/40">暂无菜品</td>
            </tr>
            <tr v-for="dish in dishRows" :key="dish.id" class="group">
              <td>
                <div class="w-12 h-12 rounded-lg bg-white/10 overflow-hidden border border-white/10">
                  <div class="w-full h-full flex items-center justify-center text-xs text-white/30">暂无图</div>
                </div>
              </td>
              <td class="font-bold text-white">{{ dish.name }}</td>
              <td class="text-white/70"><span class="glass-badge bg-blue-500/20 text-blue-200 border-blue-500/30">{{ dish.categoryName }}</span></td>
              <td class="font-bold text-cyan-300">¥{{ (dish.priceFen / 100).toFixed(2) }}</td>
              <td>
                <span :class="['glass-badge', dish.onSale && !dish.soldOut ? 'bg-green-500/20 text-green-200 border-green-500/30' : 'bg-red-500/20 text-red-200 border-red-500/30']">
                  {{ dish.soldOut ? '已售罄' : (dish.onSale ? '上架中' : '已下架') }}
                </span>
              </td>
              <td class="text-right space-x-2">
                <button @click="openEdit(dish)" class="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors" title="编辑">
                  <Edit2 class="w-4 h-4" />
                </button>
                <button
                  class="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors disabled:opacity-40"
                  title="删除"
                  :disabled="deletingId === dish.id"
                  @click="handleDelete(dish.id)"
                >
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
          <input v-model="form.name" type="text" class="glass-input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">价格 (分)</label>
          <input v-model.number="form.priceFen" type="number" class="glass-input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">所属分类</label>
          <select v-model="form.categoryId" class="glass-select w-full">
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="form.onSale" class="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500/50" />
          <span class="text-white/80">立即上架</span>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="form.soldOut" class="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500 focus:ring-cyan-500/50" />
          <span class="text-white/80">标记为售罄</span>
        </div>
      </div>
      <template #footer>
        <button @click="showModal = false" class="glass-btn-secondary" :disabled="saving">取消</button>
        <button @click="saveDish" class="glass-btn" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </template>
    </GlassModal>
  </div>
</template>
