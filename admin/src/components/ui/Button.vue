<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'icon'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    as?: 'button' | 'a'
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    class?: string
  }>(),
  {
    variant: 'default',
    size: 'default',
    as: 'button',
    type: 'button',
    disabled: false,
  },
)

const tag = computed(() => (props.as === 'a' && props.href ? 'a' : 'button'))

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background'

const variantClass = computed(() => {
  if (props.variant === 'secondary') return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
  if (props.variant === 'outline') return 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  if (props.variant === 'ghost') return 'hover:bg-accent hover:text-accent-foreground'
  if (props.variant === 'destructive') return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  if (props.variant === 'link') return 'text-primary underline-offset-4 hover:underline'
  return 'bg-primary text-primary-foreground hover:bg-primary/90'
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'h-8 rounded-md px-3 text-xs'
  if (props.size === 'lg') return 'h-10 rounded-md px-8'
  if (props.size === 'icon') return 'h-9 w-9'
  return 'h-9 px-4 py-2'
})
</script>

<template>
  <component
    :is="tag"
    :href="tag === 'a' ? props.href : undefined"
    :type="tag === 'button' ? props.type : undefined"
    :disabled="tag === 'button' ? props.disabled : undefined"
    :class="cn(base, variantClass, sizeClass, props.class)"
  >
    <slot />
  </component>
</template>

