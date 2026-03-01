<script setup lang="ts">
import * as echarts from 'echarts'
import { onMounted, ref, watch } from 'vue'
import Card from '../components/Card.vue'

const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value, 'dark', {
    renderer: 'svg',
    useDirtyRect: true
  })

  // 深色玻璃态 ECharts 主题配置
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      textStyle: {
        color: '#fff'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
      borderColor: 'transparent'
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      axisLabel: { color: 'rgba(255,255,255,0.6)' }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: {
          color: '#22d3ee' // Cyan-400
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 211, 238, 0.5)' },
            { offset: 1, color: 'rgba(34, 211, 238, 0)' }
          ])
        },
        lineStyle: {
          width: 3,
          shadowColor: 'rgba(34, 211, 238, 0.5)',
          shadowBlur: 10
        }
      },
      {
        name: '订单量',
        type: 'bar',
        data: [220, 182, 191, 234, 290, 330, 310],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#a855f7' }, // Purple-500
            { offset: 1, color: '#6366f1' }  // Indigo-500
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => chartInstance?.resize())
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <div class="text-white/60 text-sm uppercase tracking-wider font-medium mb-1">总销售额</div>
        <div class="text-3xl font-bold text-white mb-2">¥ 12,580</div>
        <div class="text-cyan-400 text-sm flex items-center">
          <span class="bg-cyan-400/10 px-1.5 py-0.5 rounded mr-2">+15%</span>
          <span>较上周</span>
        </div>
      </Card>
      <Card>
        <div class="text-white/60 text-sm uppercase tracking-wider font-medium mb-1">总订单量</div>
        <div class="text-3xl font-bold text-white mb-2">856</div>
        <div class="text-purple-400 text-sm flex items-center">
          <span class="bg-purple-400/10 px-1.5 py-0.5 rounded mr-2">+8%</span>
          <span>较上周</span>
        </div>
      </Card>
      <Card>
        <div class="text-white/60 text-sm uppercase tracking-wider font-medium mb-1">当前活跃用户</div>
        <div class="text-3xl font-bold text-white mb-2">3,240</div>
        <div class="text-white/40 text-sm">刚刚更新</div>
      </Card>
    </div>

    <Card title="销售趋势" class="h-96">
      <div ref="chartRef" class="w-full h-full"></div>
    </Card>
  </div>
</template>
