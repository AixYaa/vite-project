# ECharts 图表组件

## 安装依赖

如果还没有安装 ECharts，请运行以下命令：

```bash
npm install echarts
```

## 组件说明

### AccessTrendChart.vue

访问趋势图表组件，支持：

- **多维度数据展示**：访问量、用户数、页面浏览量
- **时间范围切换**：7天、30天、90天
- **响应式设计**：自动适应容器大小
- **加载状态**：支持加载动画
- **交互功能**：鼠标悬停显示详细数据

## 使用方式

```vue
<template>
  <AccessTrendChart 
    :data="chartData" 
    :loading="isLoading"
  />
</template>

<script setup>
import AccessTrendChart from '@/components/Charts/AccessTrendChart.vue'

const chartData = ref([
  {
    date: '2024-01-01',
    visits: 500,
    users: 100,
    pageViews: 1200
  }
  // ... 更多数据
])
</script>
```

## 数据格式

```typescript
interface ChartData {
  date: string        // 日期 (YYYY-MM-DD)
  visits: number      // 访问量
  users: number       // 用户数
  pageViews: number   // 页面浏览量
}
```

## 特性

- ✅ 按需导入，减少打包体积
- ✅ TypeScript 支持
- ✅ 响应式设计
- ✅ 加载状态
- ✅ 自定义样式
- ✅ 数据更新自动刷新
