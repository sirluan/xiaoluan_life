<template>
  <view class="category-notes-container">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back-btn" @click="goBack">
        <image src="/static/back.png" class="back-icon" mode="aspectFit" />
      </view>
      <text class="nav-title">{{ categoryName }}</text>
      <view class="nav-placeholder"></view>
    </view>
    
    <!-- 内容区域 -->
    <view class="content-area">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      
      <view v-else-if="notes.length === 0" class="empty">
        <text>暂无{{ categoryName }}分类的笔记</text>
      </view>
      
      <view v-else class="notes-list">
        <view 
          v-for="note in notes" 
          :key="note.id" 
          class="note-item"
          @click="viewNoteDetail(note)"
        >
          <text class="note-title">{{ note.post_title }}</text>
          <text class="note-time">{{ formatTime(note.post_date) }}</text>
        </view>
        
        <view v-if="hasMore" class="load-more" @click="loadMore">
          <text v-if="!loading">加载更多</text>
          <text v-else>加载中...</text>
        </view>
        
        <view v-else-if="notes.length > 0" class="no-more">
          <text>已加载全部数据</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad, onShow, onReady } from '@dcloudio/uni-app';
import { getNoteDetail_bycategory,formatTime } from '@/api/notes.js';

const notes = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const hasMore = ref(true);
const categoryName = ref('');
const statusBarHeight = ref(0);

// 获取状态栏高度
const getStatusBarHeight = () => {
  try {
    const systemInfo = uni.getSystemInfoSync();
    statusBarHeight.value = systemInfo.statusBarHeight || 0;
    
  } catch (error) {
    console.error('获取状态栏高度失败:', error);
    statusBarHeight.value = 20; // 默认值
  }
};

const fetchNotes = async (isRefresh = false) => {
  if (loading.value) {
    return;
  }
  
  loading.value = true;
  
  try {
    if (isRefresh) {
      currentPage.value = 1;
      notes.value = [];
    }
    
    // 传递当前页码给API
    const res = await getNoteDetail_bycategory(categoryName.value, currentPage.value);
    
    if (res && res.data) {
      if (res.data.items && Array.isArray(res.data.items)) {
        const newNotes = res.data.items;
        
        if (isRefresh) {
          notes.value = newNotes;
        } else {
          notes.value.push(...newNotes);
        }
        
        hasMore.value = res.data.has_more || false;
        
        // 只有在成功获取数据后才增加页码
        if (newNotes.length > 0) {
          currentPage.value++;
        }
      } else {
        notes.value = [];
        hasMore.value = false;
      }
    } else {
      notes.value = [];
      hasMore.value = false;
    }
  } catch (error) {
    console.error('获取笔记失败:', error);
    uni.showToast({ 
      title: `获取笔记失败: ${error.message}`, 
      icon: 'none',
      duration: 3000
    });
    notes.value = [];
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    fetchNotes(false);
  }
};

const viewNoteDetail = (note) => {
  uni.navigateTo({ url: `/pages/notes/note-detail?id=${note.id}` });
};

const goBack = () => {
  uni.navigateBack();
};

// 使用 uni-app 的 onLoad 钩子
onLoad((options) => {
  // 获取状态栏高度
  getStatusBarHeight();
  
  if (options && options.category) {
    categoryName.value = decodeURIComponent(options.category);
    
    // 立即获取数据
    setTimeout(() => {
      fetchNotes(true);
    }, 100);
  } else {
    // 测试用默认值
    categoryName.value = 'test';
    
    uni.showToast({
      title: '缺少分类参数，使用测试数据',
      icon: 'none',
      duration: 2000
    });
    
    // 延迟获取测试数据
    setTimeout(() => {
      fetchNotes(true);
    }, 100);
  }
});

// 使用 uni-app 的 onShow 钩子
onShow(() => {
});

// 使用 uni-app 的 onReady 钩子
onReady(() => {
});

// 移除 onMounted 中的数据获取，改为在 onLoad 中处理
onMounted(() => {
});
</script>

<style>
.category-notes-container {
  min-height: 100vh;
  background: #f8faf8;
}

/* 自定义导航栏 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 32rpx 24rpx 32rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
  position: relative;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.back-icon {
  width: 32rpx;
  height: 32rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: bold;
  color: white;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  margin-top: 35rpx;
  line-height: 1;
}

.nav-placeholder {
  width: 60rpx;
  height: 60rpx;
}

/* 内容区域 */
.content-area {
  padding: 20rpx;
}

.loading, .empty {
  text-align: center;
  padding: 40rpx;
  color: #666;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.note-item {
  background: white;
  padding: 24rpx;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  border: 1rpx solid #e8f5e8;
  transition: all 0.3s ease;
}

.note-item:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.note-title {
  font-size: 30rpx;
  color: #2e7d32;
  font-weight: 600;
  margin-bottom: 8rpx;
  display: block;
}

.note-time {
  font-size: 24rpx;
  color: #666;
}

.load-more {
  text-align: center;
  padding: 20rpx;
  color: #4CAF50;
  font-weight: bold;
  background: white;
  border-radius: 12rpx;
  margin-top: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.load-more:hover {
  background: #f0f8f0;
  transform: translateY(-1rpx);
}

.no-more {
  text-align: center;
  padding: 20rpx;
  color: #666;
  background: white;
  border-radius: 12rpx;
  margin-top: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
</style> 