<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusPill from '@/components/StatusPill.vue'
import { api } from '@/lib/api'
import type { AdminAccount, PageResult, Role } from '@/types'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const page = ref(1)
const pageSize = ref(10)
const result = ref<PageResult<AdminAccount>>({ list: [], total: 0, page: 1, pageSize: 10 })
const roles = ref<Role[]>([])
const editing = ref<AdminAccount | null>(null)
const resetPassword = ref('')
const filters = reactive<{ keyword: string; roleName: string; status: '' | AdminAccount['status'] }>({ keyword: '', roleName: '', status: '' })
const form = reactive({ username: '', password: '', displayName: '', roleName: '店长', enabled: true })

const totalPages = computed(() => Math.max(1, Math.ceil(result.value.total / pageSize.value)))

async function load(resetPage = false) {
  if (resetPage) page.value = 1
  loading.value = true
  error.value = ''
  try {
    const [accounts, roleList] = await Promise.all([
      api.listAdminAccounts({
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
        roleName: filters.roleName || undefined,
        status: filters.status || undefined,
      }),
      api.listRoles(),
    ])
    result.value = accounts
    roles.value = roleList
    if (!form.roleName && roleList[0]) form.roleName = roleList[0].name
  } catch (err) {
    error.value = err instanceof Error ? err.message : '管理员数据加载失败'
  } finally {
    loading.value = false
  }
}

function startCreate() {
  editing.value = null
  resetPassword.value = ''
  Object.assign(form, { username: '', password: '', displayName: '', roleName: roles.value[0]?.name ?? '店长', enabled: true })
}

function startEdit(account: AdminAccount) {
  editing.value = account
  resetPassword.value = ''
  Object.assign(form, {
    username: account.username,
    password: '',
    displayName: account.displayName,
    roleName: account.roleName,
    enabled: account.status === 'ACTIVE',
  })
}

async function saveAccount() {
  saving.value = true
  error.value = ''
  try {
    if (editing.value) {
      await api.updateAdminAccount({ adminUserId: editing.value.id, username: form.username, displayName: form.displayName, roleName: form.roleName, enabled: form.enabled })
      if (resetPassword.value.trim()) await api.resetAdminPassword({ adminUserId: editing.value.id, password: resetPassword.value.trim() })
    } else {
      await api.createAdminAccount({ ...form })
    }
    startCreate()
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '管理员保存失败'
  } finally {
    saving.value = false
  }
}

async function toggle(account: AdminAccount) {
  await api.updateAdminAccountStatus({ adminUserId: account.id, status: account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
  await load()
}

function changePage(delta: number) {
  const next = Math.min(totalPages.value, Math.max(1, page.value + delta))
  if (next !== page.value) {
    page.value = next
    void load()
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="管理员" description="维护后台账号、角色和登录状态。" />
    <section class="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div class="grid gap-3 md:grid-cols-[1.4fr_160px_140px_auto]">
        <input v-model="filters.keyword" class="input" placeholder="账号、姓名" @keyup.enter="load(true)">
        <select v-model="filters.roleName" class="input">
          <option value="">全部角色</option>
          <option v-for="role in roles" :key="role.name" :value="role.name">{{ role.name }}</option>
        </select>
        <select v-model="filters.status" class="input">
          <option value="">全部状态</option>
          <option value="ACTIVE">启用</option>
          <option value="INACTIVE">停用</option>
        </select>
        <button class="btn-primary" @click="load(true)">筛选</button>
      </div>
      <p v-if="error" class="mt-3 text-sm text-rose-300">{{ error }}</p>
    </section>
    <section class="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
        <table class="w-full text-sm">
          <thead class="bg-white/[0.04] text-left text-white/50">
            <tr><th class="px-4 py-3">账号</th><th class="px-4 py-3">角色</th><th class="px-4 py-3">状态</th><th class="px-4 py-3">权限数</th><th class="px-4 py-3 text-right">操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="account in result.list" :key="account.id" class="border-t border-white/5 hover:bg-white/[0.03]">
              <td class="px-4 py-3"><div class="font-medium">{{ account.displayName }}</div><div class="text-xs text-white/40">{{ account.username }}</div></td>
              <td class="px-4 py-3">{{ account.roleName }}</td>
              <td class="px-4 py-3"><StatusPill :status="account.status" /></td>
              <td class="px-4 py-3">{{ account.permissions.length }}</td>
              <td class="px-4 py-3 text-right"><button class="btn-ghost mr-2" @click="startEdit(account)">编辑</button><button class="btn-ghost" @click="toggle(account)">{{ account.status === 'ACTIVE' ? '停用' : '启用' }}</button></td>
            </tr>
          </tbody>
        </table>
        <div class="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-white/50">
          <span>共 {{ result.total }} 条，第 {{ page }} / {{ totalPages }} 页</span>
          <div class="flex gap-2"><button class="btn-ghost" :disabled="page <= 1" @click="changePage(-1)">上一页</button><button class="btn-ghost" :disabled="page >= totalPages" @click="changePage(1)">下一页</button></div>
        </div>
      </div>
      <aside class="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold">{{ editing ? '编辑管理员' : '新增管理员' }}</h2><button class="btn-ghost" @click="startCreate">清空</button></div>
        <form class="space-y-3" @submit.prevent="saveAccount">
          <input v-model.trim="form.username" class="input" placeholder="登录账号">
          <input v-model.trim="form.displayName" class="input" placeholder="显示名称">
          <input v-if="!editing" v-model.trim="form.password" class="input" type="password" placeholder="初始密码（至少6位）">
          <input v-else v-model.trim="resetPassword" class="input" type="password" placeholder="新密码（留空不修改）">
          <select v-model="form.roleName" class="input"><option v-for="role in roles" :key="role.name" :value="role.name">{{ role.name }}</option></select>
          <label class="flex items-center gap-2 text-sm text-white/70"><input v-model="form.enabled" type="checkbox" class="accent-cyan-400">启用账号</label>
          <button class="btn-primary w-full" :disabled="saving" type="submit">{{ saving ? '保存中...' : '保存账号' }}</button>
        </form>
      </aside>
    </section>
  </div>
</template>
