<template>
  <view class="categories-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back-btn" @click="goBack">
        <image src="/static/back.png" class="back-icon" mode="aspectFit" />
      </view>
      <text class="nav-title">笔记分类</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 分类列表 -->
    <view v-else class="categories-list">
      <view 
        v-for="category in categories" 
        :key="category.name" 
        class="category-item"
        @click="viewCategoryNotes(category)"
      >
        <view class="category-content">
          <view class="category-header">
            <text class="category-name">{{ category.name }}</text>
            <view class="category-count">
              <text class="count-number">{{ category.count }}</text>
              <text class="count-label">篇笔记</text>
            </view>
          </view>
          
          <view class="category-description">
            <text class="description-text">{{ getCategoryDescription(category.name) }}</text>
          </view>
        </view>
        
        <view class="category-arrow">
          <text class="arrow-icon">→</text>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!loading && categories.length === 0" class="empty-container">
      <view class="empty-icon">📂</view>
      <text class="empty-text">暂无分类</text>
      <text class="empty-subtext">还没有创建任何笔记分类</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCategories } from '@/api/notes.js';

const categories = ref([]);
const loading = ref(false);
const statusBarHeight = ref(0);

// 获取状态栏高度
const getStatusBarHeight = () => {
  try {
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;
  } catch (error) {
    statusBarHeight.value = 20;
  }
};

// 获取分类描述
const getCategoryDescription = (categoryName) => {
  const descriptions = {
    'algorithm': '算法',
    'mysql': '数据库语言MySQL',
    'R': '统计语言R',
    'python': 'python的一些小知识',
    'HIVE': '大数据的SQL语言与mysql略有不同',
    'machine_learning':'机器学习',
    'other': '其他分类的笔记'
  };
  return descriptions[categoryName] || '该分类下的笔记内容';
};

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true;
  
  try {
    const res = await getCategories();
    
    if (res.data && res.data.categories) {
      categories.value = res.data.categories;
    } else {
      categories.value = [];
    }
  } catch (error) {
    console.error('获取分类失败:', error);
    uni.showToast({
      title: '获取分类失败',
      icon: 'none'
    });
    categories.value = [];
  } finally {
    loading.value = false;
  }
};

// 查看分类下的笔记
const viewCategoryNotes = (category) => {
  uni.navigateTo({
    url: `/pages/notes/category-notes?category=${encodeURIComponent(category.name)}`
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

onMounted(() => {
  getStatusBarHeight();
  fetchCategories();
});
</script>

<style>
.categories-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8faf8;
  padding: 0;
}

.nav-bar {
  display: flex;
  align-items: center;
  position: relative;
  height: 88rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
  padding: 0 32rpx;
}

.back-btn, .nav-placeholder {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  width: 32rpx;
  height: 32rpx;
}

.nav-title {
  position: absolute;
  margin-top: 32rpx;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80rpx 40rpx;
  gap: 20rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #e8f5e8;
  border-top: 4rpx solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #4CAF50;
}

.categories-list {
  flex: 1;
  padding: 20rpx;
}

.category-item {
  background: white;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1rpx solid #e8f5e8;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.category-item:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.15);
  border-color: #4CAF50;
}

.category-content {
  flex: 1;
  margin-right: 20rpx;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.category-name {
  font-size: 32rpx;
  color: #2e7d32;
  font-weight: 600;
  line-height: 1.4;
}

.category-count {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.count-number {
  font-size: 36rpx;
  color: #4CAF50;
  font-weight: bold;
}

.count-label {
  font-size: 24rpx;
  color: #666;
}

.category-description {
  margin-top: 8rpx;
}

.description-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.category-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
  transition: all 0.3s ease;
}

.category-item:hover .category-arrow {
  transform: translateX(4rpx);
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
}

.arrow-icon {
  font-size: 32rpx;
  color: white;
  font-weight: bold;
}

.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 80rpx 40rpx;
  gap: 24rpx;
}

.empty-icon {
  font-size: 120rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #2e7d32;
  font-weight: bold;
}

.empty-subtext {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}
</style> 