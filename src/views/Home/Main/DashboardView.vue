<template>
  <div class="dashboard-container" v-loading="loading" element-loading-text="加载中...">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">欢迎回来，{{ userInfo.username }}！</h1>
        <p class="welcome-subtitle">今天是 {{ currentDate }}，祝您工作愉快！</p>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon v-if="!loading"><Refresh /></el-icon>
          {{ loading ? '加载中...' : '刷新数据' }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.key">
        <div class="stat-icon" :style="{ backgroundColor: stat.color }">
          <el-icon :size="24">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            <el-skeleton v-if="loading" :rows="1" animated />
            <span v-else>{{ stat.value }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-change" :class="stat.changeType">
            <el-icon><component :is="stat.changeIcon" /></el-icon>
            <el-skeleton v-if="loading" :rows="1" animated style="width: 40px;" />
            <span v-else>{{ stat.change }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>访问趋势</span>
                <el-select v-model="chartTimeRange" size="small" style="width: 120px">
                  <el-option label="最近7天" value="7d" />
                  <el-option label="最近30天" value="30d" />
                  <el-option label="最近90天" value="90d" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <AccessTrendChart 
                v-if="hasECharts"
                :data="accessTrendData" 
                :loading="chartLoading"
              />
              <SimpleChart 
                v-else
                :data="accessTrendData" 
                :loading="chartLoading"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>系统状态</span>
                <div class="status-indicator">
                  <el-icon class="pulse-icon"><DataAnalysis /></el-icon>
                  <span class="update-text">实时更新</span>
                </div>
              </div>
            </template>
            <div class="system-status">
              <div class="status-item" v-for="status in systemStatus" :key="status.name">
                <div class="status-info">
                  <span class="status-name">{{ status.name }}</span>
                  <span class="status-value">
                    <el-skeleton v-if="loading" :rows="1" animated style="width: 50px;" />
                    <span v-else>{{ status.value }}</span>
                  </span>
                </div>
                <el-progress 
                  v-if="!loading"
                  :percentage="status.percentage" 
                  :color="status.color"
                  :show-text="false"
                  :stroke-width="6"
                />
                <el-skeleton v-else :rows="1" animated style="height: 6px;" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span>最近活动</span>
                <el-button size="small" type="text">查看全部</el-button>
              </div>
            </template>
            <el-table :data="recentActivities" size="small" style="width: 100%" v-loading="loading">
              <el-table-column prop="action" label="操作" width="120" />
              <el-table-column prop="user" label="用户" width="100" />
              <el-table-column prop="time" label="时间" width="120" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'" size="small">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="table-card">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            <div class="quick-actions">
              <div class="action-item" v-for="action in quickActions" :key="action.name">
                <div class="action-icon" :style="{ backgroundColor: action.color }">
                  <el-icon><component :is="action.icon" /></el-icon>
                </div>
                <div class="action-content">
                  <div class="action-name">{{ action.name }}</div>
                  <div class="action-desc">{{ action.description }}</div>
                </div>
                <el-button size="small" type="primary" @click="handleQuickAction(action)">
                  执行
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Document, 
  Setting, 
  DataAnalysis,
  TrendCharts,
  Refresh,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit,
  Delete,
  View
} from '@element-plus/icons-vue'
import { 
  fetchDashboardStats, 
  fetchSystemStatus, 
  fetchRecentActivities, 
  fetchAccessTrend, 
  fetchUserInfo 
} from '@/axios/dashboard'
import AccessTrendChart from '@/components/Charts/AccessTrendChart.vue'
import SimpleChart from '@/components/Charts/SimpleChart.vue'

// 用户信息
const userInfo = ref({
  username: '管理员',
  role: 'ADMIN',
  email: '',
  avatar: '',
  lastLoginAt: null
})

// 当前日期
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 统计卡片数据
const stats = ref([
  {
    key: 'users',
    label: '用户总数',
    value: '0',
    change: '+0%',
    changeType: 'positive',
    changeIcon: ArrowUp,
    icon: User,
    color: '#409EFF'
  },
  {
    key: 'roles',
    label: '角色数量',
    value: '0',
    change: '+0',
    changeType: 'positive',
    changeIcon: ArrowUp,
    icon: Setting,
    color: '#67C23A'
  },
  {
    key: 'menus',
    label: '菜单数量',
    value: '0',
    change: '+0',
    changeType: 'positive',
    changeIcon: ArrowUp,
    icon: Document,
    color: '#E6A23C'
  },
  {
    key: 'permissions',
    label: '权限数量',
    value: '0',
    change: '+0',
    changeType: 'positive',
    changeIcon: ArrowUp,
    icon: DataAnalysis,
    color: '#F56C6C'
  }
])

// 图表时间范围
const chartTimeRange = ref('7d')

// 访问趋势数据
const accessTrendData = ref([])
const chartLoading = ref(false)

// 检测ECharts是否可用
const hasECharts = ref(false)

// 加载状态
const loading = ref(false)

// 系统状态定时器
let systemStatusTimer: NodeJS.Timeout | null = null

// 系统状态
const systemStatus = ref([
  {
    name: 'CPU使用率',
    value: '0%',
    percentage: 0,
    color: '#67C23A'
  },
  {
    name: '内存使用率',
    value: '0%',
    percentage: 0,
    color: '#E6A23C'
  },
  {
    name: '磁盘使用率',
    value: '0%',
    percentage: 0,
    color: '#409EFF'
  },
  {
    name: '网络使用率',
    value: '0%',
    percentage: 0,
    color: '#909399'
  }
])

// 最近活动
const recentActivities = ref([])

// 快速操作
const quickActions = ref([
  {
    name: '创建用户',
    description: '添加新的系统用户',
    icon: Plus,
    color: '#409EFF',
    action: 'createUser'
  },
  {
    name: '编辑角色',
    description: '修改角色权限配置',
    icon: Edit,
    color: '#67C23A',
    action: 'editRole'
  },
  {
    name: '查看日志',
    description: '查看系统操作日志',
    icon: View,
    color: '#E6A23C',
    action: 'viewLogs'
  }
])

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 并行加载所有数据
    const [statsRes, systemStatusRes, activitiesRes, userInfoRes, trendRes] = await Promise.all([
      fetchDashboardStats(),
      fetchSystemStatus(),
      fetchRecentActivities(10),
      fetchUserInfo(),
      fetchAccessTrend(chartTimeRange.value)
    ])

    // 更新统计数据
    if (statsRes.data.success) {
      const statsData = statsRes.data.data
      stats.value[0].value = statsData.users.total.toString()
      stats.value[0].change = statsData.users.change
      stats.value[0].changeType = statsData.users.changeType
      
      stats.value[1].value = statsData.roles.total.toString()
      stats.value[1].change = statsData.roles.change
      stats.value[1].changeType = statsData.roles.changeType
      
      stats.value[2].value = statsData.menus.total.toString()
      stats.value[2].change = statsData.menus.change
      stats.value[2].changeType = statsData.menus.changeType
      
      stats.value[3].value = statsData.permissions.total.toString()
      stats.value[3].change = statsData.permissions.change
      stats.value[3].changeType = statsData.permissions.changeType
    }

    // 更新系统状态
    if (systemStatusRes.data.success) {
      systemStatus.value = systemStatusRes.data.data
    }

    // 更新最近活动
    if (activitiesRes.data.success) {
      recentActivities.value = activitiesRes.data.data
    }

    // 更新用户信息
    if (userInfoRes.data.success) {
      const userData = userInfoRes.data.data
      userInfo.value = {
        username: userData.username,
        role: userData.role,
        email: userData.email,
        avatar: userData.avatar,
        lastLoginAt: userData.lastLoginAt
      }
    }

    // 更新访问趋势数据
    if (trendRes.data.success) {
      accessTrendData.value = trendRes.data.data.data
    }

  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  await loadDashboardData()
  ElMessage.success('数据已刷新')
}

// 单独刷新系统状态
const refreshSystemStatus = async () => {
  try {
    const response = await fetchSystemStatus()
    if (response.data.success) {
      // 后端已返回数组，直接覆盖
      systemStatus.value = response.data.data
    }
  } catch (error) {
    console.error('刷新系统状态失败:', error)
  }
}

// 启动系统状态定时器
const startSystemStatusTimer = () => {
  // 先立即刷新一次，确保首屏就是最新数据
  refreshSystemStatus()
  // 每30秒更新一次系统状态
  systemStatusTimer = setInterval(() => {
    refreshSystemStatus()
  }, 30000)
}

// 停止系统状态定时器
const stopSystemStatusTimer = () => {
  if (systemStatusTimer) {
    clearInterval(systemStatusTimer)
    systemStatusTimer = null
  }
}

// 处理快速操作
const handleQuickAction = (action: any) => {
  ElMessage.info(`执行操作: ${action.name}`)
  // 这里可以根据action.action执行相应的操作
}

// 监听时间范围变化
watch(chartTimeRange, async (newRange) => {
  try {
    chartLoading.value = true
    const trendRes = await fetchAccessTrend(newRange)
    if (trendRes.data.success) {
      accessTrendData.value = trendRes.data.data.data
    }
  } catch (error) {
    console.error('获取访问趋势失败:', error)
  } finally {
    chartLoading.value = false
  }
})

// 检测ECharts可用性
const checkECharts = async () => {
  try {
    await import('echarts')
    hasECharts.value = true
  } catch (error) {
    console.warn('ECharts 未安装，使用简化图表组件')
    hasECharts.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  checkECharts()
  loadDashboardData()
  startSystemStatusTimer()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopSystemStatusTimer()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 欢迎区域 */
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  /* color: white; */
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  /* background: white; */
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* color: white; */
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  /* color: #303133; */
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #67C23A;
}

.stat-change.negative {
  color: #F56C6C;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #67C23A;
}

.pulse-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.update-text {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
  /* color: #909399; */
}

.chart-placeholder p {
  margin: 12px 0 8px 0;
  font-size: 16px;
}

.chart-placeholder small {
  font-size: 12px;
}

/* 系统状态 */
.system-status {
  padding: 20px 0;
}

.status-item {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-name {
  font-size: 14px;
  color: #606266;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  /* color: #303133; */
}

/* 表格区域 */
.table-section {
  margin-bottom: 24px;
}

.table-card {
  height: 400px;
}

/* 快速操作 */
.quick-actions {
  padding: 20px 0;
}

.action-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* color: white; */
  margin-right: 12px;
}

.action-content {
  flex: 1;
  margin-right: 12px;
}

.action-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  /* color: #909399; */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }
  
  .welcome-section {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section .el-col,
  .table-section .el-col {
    margin-bottom: 20px;
  }
}
</style>