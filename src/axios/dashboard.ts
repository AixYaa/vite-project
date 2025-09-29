import instance from './index';

// 获取仪表盘统计数据
export const fetchDashboardStats = () => {
  return instance.get('/dashboard/stats');
};

// 获取系统状态
export const fetchSystemStatus = () => {
  return instance.get('/dashboard/system-status');
};

// 获取最近活动
export const fetchRecentActivities = (limit: number = 10) => {
  return instance.get('/dashboard/recent-activities', {
    params: { limit }
  });
};

// 获取访问趋势
export const fetchAccessTrend = (range: string = '7d') => {
  return instance.get('/dashboard/access-trend', {
    params: { range }
  });
};

// 获取用户信息
export const fetchUserInfo = () => {
  return instance.get('/dashboard/user-info');
};
