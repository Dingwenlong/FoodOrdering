<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import type { Category, Dish } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const categories = ref<Category[]>([])
const dishes = ref<Dish[]>([])
const selectedCategoryId = ref('')
const editingDish = ref<Dish | null>(null)
const editingCategory = ref<Category | null>(null)
const dishForm = reactive({ categoryId: '', name: '', priceFen: 0, onSale: true, soldOut: false, description: '', image: '', sort: 0 })
const categoryForm = reactive({ name: '', sort: 0 })

const filteredDishes = computed(() => {
  if (!selectedCategoryId.value) return dishes.value
  return dishes.value.filter((dish) => dish.categoryId === selectedCategoryId.value)
})

function money(amountFen: number) {
  return `¥${(amountFen / 100).toFixed(2)}`
}

async function loadMenu() {
  loading.value = true
  error.value = ''
  try {
    const menu = await api.listMenu()
    categories.value = menu.categories
    dishes.value = menu.dishes
    if (!dishForm.categoryId && categories.value[0]) dishForm.categoryId = categories.value[0].id
  } catch (err) {
    error.value = err instanceof Error ? err.message : '菜单加载失败'
  } finally {
    loading.value = false
  }
}

function startDishCreate() {
  editingDish.value = null
  Object.assign(dishForm, { categoryId: categories.value[0]?.id ?? '', name: '', priceFen: 0, onSale: true, soldOut: false, description: '', image: '', sort: 0 })
}

function startDishEdit(dish: Dish) {
  editingDish.value = dish
  Object.assign(dishForm, {
    categoryId: dish.categoryId,
    name: dish.name,
    priceFen: dish.priceFen,
    onSale: dish.onSale,
    soldOut: dish.soldOut,
    description: dish.description ?? '',
    image: dish.image ?? '',
    sort: dish.sort ?? 0,
  })
}

async function saveDish() {
  if (!dishForm.categoryId || !dishForm.name.trim() || dishForm.priceFen < 0) {
    error.value = '请选择分类，填写菜品名称和有效价格'
    return
  }
  saving.value = true
  try {
    if (editingDish.value) {
      await api.updateDish({ dishId: editingDish.value.id, ...dishForm })
    } else {
      await api.createDish({ ...dishForm })
    }
    startDishCreate()
    await loadMenu()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '菜品保存失败'
  } finally {
    saving.value = false
  }
}

async function deleteDish(dish: Dish) {
  if (!window.confirm(`确认删除 ${dish.name}？`)) return
  await api.deleteDish(dish.id)
  await loadMenu()
}

function startCategoryCreate() {
  editingCategory.value = null
  Object.assign(categoryForm, { name: '', sort: 0 })
}

function startCategoryEdit(category: Category) {
  editingCategory.value = category
  Object.assign(categoryForm, { name: category.name, sort: category.sort })
}

async function saveCategory() {
  if (!categoryForm.name.trim()) {
    error.value = '分类名称不能为空'
    return
  }
  if (editingCategory.value) {
    await api.updateCategory({ categoryId: editingCategory.value.id, name: categoryForm.name, sort: categoryForm.sort, enabled: true })
  } else {
    await api.createCategory({ name: categoryForm.name, sort: categoryForm.sort, enabled: true })
  }
  startCategoryCreate()
  await loadMenu()
}

async function deleteCategory(category: Category) {
  if (!window.confirm(`确认删除分类 ${category.name}？分类下有菜品时后端会拒绝删除。`)) return
  await api.deleteCategory(category.id)
  await loadMenu()
}

onMounted(loadMenu)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="菜品管理" description="维护分类、菜品上下架、售罄、图片、描述和排序。" />
    <p v-if="error" class="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{{ error }}</p>

    <section class="grid gap-4 xl:grid-cols-[300px_1fr_360px]">
      <aside class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">分类</h2>
          <button class="btn-ghost" @click="startCategoryCreate">新增</button>
        </div>
        <div class="space-y-2">
          <button class="w-full rounded-xl px-3 py-2 text-left" :class="!selectedCategoryId ? 'bg-cyan-400/20 text-white' : 'bg-black/20 text-white/65'" @click="selectedCategoryId = ''">全部菜品</button>
          <div v-for="category in categories" :key="category.id" class="flex items-center gap-2 rounded-xl bg-black/20 p-2">
            <button class="min-w-0 flex-1 truncate text-left" @click="selectedCategoryId = category.id">{{ category.name }}</button>
            <button class="text-xs text-cyan-200" @click="startCategoryEdit(category)">编辑</button>
            <button class="text-xs text-rose-200" @click="deleteCategory(category)">删除</button>
          </div>
        </div>
        <form class="mt-5 space-y-3" @submit.prevent="saveCategory">
          <input v-model.trim="categoryForm.name" class="input" placeholder="分类名称">
          <input v-model.number="categoryForm.sort" class="input" type="number" placeholder="排序">
          <button class="btn-primary w-full" type="submit">{{ editingCategory ? '保存分类' : '创建分类' }}</button>
        </form>
      </aside>

      <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <table class="w-full text-sm">
          <thead class="bg-white/[0.04] text-left text-white/50">
            <tr>
              <th class="px-4 py-3">菜品</th>
              <th class="px-4 py-3">价格</th>
              <th class="px-4 py-3">状态</th>
              <th class="px-4 py-3">排序</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dish in filteredDishes" :key="dish.id" class="border-t border-white/5 hover:bg-white/[0.03]">
              <td class="px-4 py-3">
                <div class="font-medium">{{ dish.name }}</div>
                <div class="line-clamp-1 text-xs text-white/40">{{ dish.description || '暂无描述' }}</div>
              </td>
              <td class="px-4 py-3">{{ money(dish.priceFen) }}</td>
              <td class="px-4 py-3 flex gap-2"><StatusPill :status="dish.onSale ? 'ACTIVE' : 'INACTIVE'" /><StatusPill v-if="dish.soldOut" status="SOLD_OUT" /></td>
              <td class="px-4 py-3">{{ dish.sort }}</td>
              <td class="px-4 py-3 text-right">
                <button class="btn-ghost mr-2" @click="startDishEdit(dish)">编辑</button>
                <button class="btn-ghost" @click="deleteDish(dish)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="p-5 text-white/40">加载中...</div>
      </div>

      <aside class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ editingDish ? '编辑菜品' : '新增菜品' }}</h2>
          <button class="btn-ghost" @click="startDishCreate">清空</button>
        </div>
        <form class="space-y-3" @submit.prevent="saveDish">
          <select v-model="dishForm.categoryId" class="input">
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
          <input v-model.trim="dishForm.name" class="input" placeholder="菜品名称">
          <input v-model.number="dishForm.priceFen" class="input" type="number" min="0" placeholder="价格（分）">
          <input v-model.trim="dishForm.image" class="input" placeholder="图片地址">
          <textarea v-model.trim="dishForm.description" class="input min-h-24" placeholder="菜品描述" />
          <input v-model.number="dishForm.sort" class="input" type="number" placeholder="排序">
          <label class="flex items-center gap-2 text-sm text-white/70"><input v-model="dishForm.onSale" type="checkbox" class="accent-cyan-400">上架</label>
          <label class="flex items-center gap-2 text-sm text-white/70"><input v-model="dishForm.soldOut" type="checkbox" class="accent-cyan-400">售罄</label>
          <button class="btn-primary w-full" :disabled="saving" type="submit">{{ saving ? '保存中...' : '保存菜品' }}</button>
        </form>
      </aside>
    </section>
  </div>
</template>
