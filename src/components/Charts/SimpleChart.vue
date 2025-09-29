<template>
  <div class="simple-chart">
    <div class="chart-placeholder">
      <el-icon :size="48" color="#409EFF"><TrendCharts /></el-icon>
      <p>访问趋势图表</p>
      <small>请安装 ECharts 以显示完整图表</small>
      <div class="chart-data-preview" v-if="data.length > 0">
        <div class="data-summary">
          <div class="summary-item">
            <span class="label">总访问量:</span>
            <span class="value">{{ totalVisits }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总用户数:</span>
            <span class="value">{{ totalUsers }}</span>
          </div>
          <div class="summary-item">
            <span class="label">总页面浏览量:</span>
            <span class="value">{{ totalPageViews }}</span>
          </div>
        </div>
        <div class="recent-data">
          <h4>最近数据:</h4>
          <div class="data-item" v-for="item in recentData" :key="item.date">
            <span class="date">{{ formatDate(item.date) }}</span>
            <span class="visits">{{ item.visits }}</span>
            <span class="users">{{ item.users }}</span>
            <span class="pageviews">{{ item.pageViews }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'

interface ChartData {
  date: string
  visits: number
  users: number
  pageViews: number
}

interface Props {
  data: ChartData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 计算统计数据
const totalVisits = computed(() => {
  return props.data.reduce((sum, item) => sum + item.visits, 0)
})

const totalUsers = computed(() => {
  return props.data.reduce((sum, item) => sum + item.users, 0)
})

const totalPageViews = computed(() => {
  return props.data.reduce((sum, item) => sum + item.pageViews, 0)
})

// 最近5条数据
const recentData = computed(() => {
  return props.data.slice(-5)
})

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.simple-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.chart-placeholder p {
  margin: 12px 0 8px 0;
  font-size: 16px;
}

.chart-placeholder small {
  font-size: 12px;
  color: #C0C4CC;
}

.chart-data-preview {
  margin-top: 20px;
  text-align: left;
  max-width: 400px;
}

.data-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  font-size: 14px;
}

.value {
  color: #303133;
  font-weight: 600;
  font-size: 14px;
}

.recent-data h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.data-item {
  display: grid;
  grid-template-columns: 60px 60px 60px 80px;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.data-item:last-child {
  border-bottom: none;
}

.date {
  color: #909399;
}

.visits {
  color: #409EFF;
  font-weight: 500;
}

.users {
  color: #67C23A;
  font-weight: 500;
}

.pageviews {
  color: #E6A23C;
  font-weight: 500;
}
</style>
