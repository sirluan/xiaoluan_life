<template>
  <view class="notes-container">
    <!-- 顶部标题栏 -->
    <view class="notes-header">
      <text class="notes-title">{{ pageTitle }}</text>
      <view class="header-actions">
        <view class="categories-btn" @click="goToCategories">
          <image class="categories-icon" src="../../static/classify.png" mode="aspectFit" />
          <text class="categories-text">分类</text>
        </view>
        <view class="refresh-btn" @click="refreshNotes">
          <image class="refresh-icon" src="/static/flushed.png" mode="aspectFit" />
          <text class="refresh-text">刷新</text>
        </view>
      </view>
    </view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <image class="search-icon" src="/static/search.png" mode="aspectFit" />
        <input 
          v-model="searchKeyword" 
          placeholder="搜索笔记标题..." 
          class="search-input"
          @confirm="searchNotes(searchKeyword)"
        />
      </view>
      <button class="search-btn" @click="searchNotes(searchKeyword)">搜索</button>
    </view>
    
    <!-- 分类筛选提示 -->
    <view v-if="currentCategory" class="category-filter">
      <text class="filter-text">当前筛选：{{ currentCategory }}</text>
      <view class="clear-filter" @click="clearCategoryFilter">
        <text class="clear-text">清除</text>
      </view>
    </view>
    
    <!-- 加载状态 -->
    <view v-if="loading && notes.length === 0" class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 笔记列表 -->
    <view v-else class="notes-list">
      <view 
        v-for="(note, index) in notes" 
        :key="note.id" 
        class="note-item"
        @click="viewNoteDetail(note)"
      >
        <view class="note-content">
          <view class="note-header">
            <text class="note-title">{{ note.title }}</text>
            <view class="note-meta">
              <text class="note-time">{{ formatTime(note.created_at) }}</text>
            </view>
          </view>
          
          <view class="note-footer">
            <view class="note-category" v-if="note.category">
              <text class="category-tag">{{ note.category }}</text>
            </view>
            <view class="note-tags" v-if="note.tags && note.tags.length > 0">
              <text v-for="tag in note.tags.slice(0, 3)" :key="tag" class="note-tag">{{ tag }}</text>
            </view>
          </view>
        </view>
        
        <view class="note-arrow">
          <text class="arrow-icon">→</text>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more" @click="loadMore">
        <text v-if="loading" class="load-more-text">加载中...</text>
        <text v-else class="load-more-text">📄 加载更多</text>
      </view>
      
      <!-- 没有更多数据 -->
      <view v-else-if="notes.length > 0" class="no-more">
        <text class="no-more-text">✨ 已加载全部笔记</text>
      </view>
    </view>
    

  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getNotesList, formatNoteItem, formatTime, extractTextFromHTML } from '@/api/notes.js';

const notes = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const currentCategory = ref('');
const searchKeyword = ref('');

// 计算页面标题
const pageTitle = computed(() => {
  if (currentCategory.value) {
    return `📂 ${currentCategory.value}`;
  }
  return '学而时习之，不亦说乎';
});



// 获取笔记列表
const fetchNotes = async (isRefresh = false) => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    if (isRefresh) {
      currentPage.value = 1;
      notes.value = [];
    }
    
    const params = {
      page: currentPage.value,
      limit: 10
    };
    
    if (currentCategory.value) {
      params.category = currentCategory.value;
    }
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value;
    }
    
    const res = await getNotesList(params);
    
    if (res.data && res.data.items) {
      const formattedNotes = res.data.items.map(formatNoteItem);
      
      if (isRefresh) {
        notes.value = formattedNotes;
      } else {
        notes.value.push(...formattedNotes);
      }
      
      hasMore.value = res.data.has_more;
      currentPage.value++;
    }
  } catch (error) {
    console.error('获取笔记失败:', error);
    uni.showToast({
      title: '获取笔记失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 刷新笔记
const refreshNotes = () => {
  uni.showToast({
    title: '刷新成功',
    icon: 'success',
    duration: 1000
  });
  fetchNotes(true);
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchNotes();
  }
};

// 搜索笔记
const searchNotes = (keyword) => {
  searchKeyword.value = keyword;
  fetchNotes(true);
};

// 清除分类筛选
const clearCategoryFilter = () => {
  currentCategory.value = '';
  fetchNotes(true);
};

// 跳转到分类页面
const goToCategories = () => {
  uni.navigateTo({
    url: '/pages/notes/categories'
  });
};

// 查看笔记详情
const viewNoteDetail = (note) => {
  // 跳转到笔记详情页面
  uni.navigateTo({
    url: `/pages/notes/note-detail?id=${note.id}`
  });
};

// 页面加载时获取参数
const onLoad = (options) => {
  if (options.category) {
    currentCategory.value = decodeURIComponent(options.category);
  }
};

// 定义页面生命周期
defineExpose({
  onLoad
});

onMounted(() => {
  fetchNotes(true);
});

// 微信小程序分享功能
const onShareAppMessage = () => {
  return {
    title: '我的笔记 - 学而时习之，不亦说乎',
    path: '/pages/notes/notes',
    imageUrl: '/static/notes.jpg'
  };
};

const onShareTimeline = () => {
  return {
    title: '我的笔记 - 学而时习之，不亦说乎',
    query: '',
    imageUrl: '/static/notes.jpg'
  };
};
</script>

<style>
.notes-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8faf8;
  padding: 0;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 32rpx 24rpx 32rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.notes-title {
  font-size: 36rpx;
  font-weight: bold;
  color: white;
}

.header-actions {
  display: flex;
  gap: 16rpx;
}

.categories-btn, .refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.categories-btn:hover, .refresh-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2rpx);
}

.categories-icon, .refresh-icon {
  width: 24rpx;
  height: 24rpx;
}

.categories-text, .refresh-text {
  font-size: 26rpx;
  color: white;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 32rpx;
  background: white;
  border-bottom: 1rpx solid #e8f5e8;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f8faf8;
  border: 2rpx solid #e8f5e8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: #4CAF50;
  background: white;
  box-shadow: 0 0 0 4rpx rgba(76, 175, 80, 0.1);
}

.search-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  padding: 16rpx 0;
  font-size: 28rpx;
  background: transparent;
  border: none;
  outline: none;
}

.search-btn {
  padding: 4rpx 32rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  cursor: pointer;
  border: none;
  font-size: 28rpx;
  font-weight: bold;
  margin-left: 16rpx;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.search-btn:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
}

.category-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 32rpx;
  background: #f1f8e9;
  border-bottom: 1rpx solid #e8f5e8;
}

.filter-text {
  font-size: 26rpx;
  color: #2e7d32;
  font-weight: bold;
}

.clear-filter {
  background: rgba(76, 175, 80, 0.2);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-filter:hover {
  background: rgba(76, 175, 80, 0.3);
}

.clear-text {
  font-size: 24rpx;
  color: #2e7d32;
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

.notes-list {
  flex: 1;
  padding: 20rpx;
}

.note-item {
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

.note-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.note-item:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.15);
  border-color: #4CAF50;
}

.note-content {
  flex: 1;
  margin-right: 20rpx;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.note-title {
  font-size: 32rpx;
  color: #2e7d32;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
  margin-right: 16rpx;
}

.note-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.note-time {
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e8f5e8;
}

.note-category {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  font-size: 22rpx;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
}

.note-tags {
  display: flex;
  gap: 12rpx;
}

.note-tag {
  background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
  color: white;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(76, 175, 80, 0.2);
  transition: all 0.3s ease;
}

.note-tag:hover {
  transform: translateY(-1rpx);
  box-shadow: 0 4rpx 10rpx rgba(76, 175, 80, 0.3);
}

.note-arrow {
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

.note-item:hover .note-arrow {
  transform: translateX(4rpx);
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
}

.arrow-icon {
  font-size: 32rpx;
  color: white;
  font-weight: bold;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more:hover {
  transform: translateY(-2rpx);
}

.load-more-text {
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
}

.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20rpx;
}

.no-more-text {
  font-size: 28rpx;
  color: #666;
}


</style> 