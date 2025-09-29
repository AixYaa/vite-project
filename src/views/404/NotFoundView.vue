<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">页面未找到</div>
      <div class="error-description">
        抱歉，您访问的页面不存在或已被移除
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
    <div class="not-found-illustration">
      <el-icon class="illustration-icon">
        <DocumentDelete />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { HomeFilled, ArrowLeft, DocumentDelete } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped lang="scss">
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.not-found-content {
  text-align: center;
  color: #333;
  z-index: 2;
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 1rem;
  color: #999;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #666;
}

.error-description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  color: #888;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-actions .el-button {
  padding: 12px 24px;
  font-size: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.error-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.not-found-illustration {
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  opacity: 0.1;
  z-index: 1;
}

.illustration-icon {
  font-size: 20rem;
  color: #e0e0e0;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .not-found-container {
    flex-direction: column;
    text-align: center;
  }
  
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 2rem;
  }
  
  .error-description {
    font-size: 1rem;
  }
  
  .not-found-illustration {
    position: static;
    transform: none;
    margin-top: 2rem;
  }
  
  .illustration-icon {
    font-size: 8rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
}

// 暗色主题适配
:deep(.dark) {
  .not-found-container {
    background: #1a1a1a;
  }
  
  .not-found-content {
    color: #e0e0e0;
  }
  
  .error-code {
    color: #666;
  }
  
  .error-title {
    color: #999;
  }
  
  .error-description {
    color: #777;
  }
  
  .illustration-icon {
    color: #333;
  }
}
</style>
