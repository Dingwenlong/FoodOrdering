<script setup lang="ts">
import { ref } from 'vue'
import Card from '../components/Card.vue'
import { Star, MessageCircle } from 'lucide-vue-next'

const comments = ref([
  { id: 1, user: 'User123', dish: '招牌牛肉面', rating: 5, content: '味道非常好，汤很浓郁！', date: '2023-10-05 12:30' },
  { id: 2, user: 'Guest_99', dish: '冰可乐', rating: 4, content: '够冰，爽！', date: '2023-10-04 18:20' },
  { id: 3, user: 'Foodie', dish: '鲜虾云吞', rating: 3, content: '虾有点小，皮有点厚。', date: '2023-10-03 11:15' },
])
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-white tracking-tight">评论管理</h1>

    <div class="grid gap-4">
      <Card v-for="comment in comments" :key="comment.id" class="group hover:border-white/20 transition-all">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white">{{ comment.user }}</span>
            <span class="text-white/40 text-sm">点评了</span>
            <span class="text-cyan-300 font-medium">{{ comment.dish }}</span>
          </div>
          <div class="text-white/30 text-xs">{{ comment.date }}</div>
        </div>
        
        <div class="flex items-center gap-1 mb-3">
          <Star 
            v-for="i in 5" 
            :key="i" 
            class="w-4 h-4" 
            :class="i <= comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/10 fill-white/5'"
          />
        </div>

        <p class="text-white/80 mb-4 bg-white/5 p-3 rounded-lg border border-white/5">{{ comment.content }}</p>

        <div class="flex justify-end">
          <button class="glass-btn-secondary flex items-center gap-2 text-sm py-1.5">
            <MessageCircle class="w-4 h-4" /> 回复
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>
