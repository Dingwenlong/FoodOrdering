import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AdminUser } from '@/types'
import { api, ADMIN_TOKEN_KEY } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(ADMIN_TOKEN_KEY))
  const user = ref<AdminUser | null>(null)
  const loading = ref(false)

  const isAuthed = computed(() => Boolean(token.value))

  async function login(payload: { username: string; password: string }) {
    loading.value = true
    try {
      const res = await api.login(payload)
      token.value = res.token
      user.value = res.user
      localStorage.setItem(ADMIN_TOKEN_KEY, res.token)
    } finally {
      loading.value = false
    }
  }

  async function ensureProfile() {
    if (!token.value) return
    if (user.value) return
    user.value = await api.getProfile()
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }

  return {
    token,
    user,
    loading,
    isAuthed,
    login,
    ensureProfile,
    logout,
  }
})
