<template>
  <view class="note-detail-container">
    <!-- 背景图平铺容器 -->
    <view class="bg-container">
      <image 
        v-for="n in bgImageCount" 
        :key="n"
        class="bg-image"
        src="/static/note_background.jpeg"
        mode="widthFix"
        :style="{ top: ((n-1) * bgImageHeight) + 'px' }"
        @load="onBgImageLoad"
        @error="onBgImageError"
      />
    </view>
    
    <!-- 内容区域 -->
    <view class="content-wrapper">
      <!-- 顶部导航栏 -->
      <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="back-btn" @click="goBack">
          <image class="back-icon" src="/static/back.png" mode="aspectFit" />
        </view>
        <text class="nav-title">笔记详情</text>
      </view>
      
      <!-- 笔记内容 -->
      <view class="note-content" v-if="note && !loading">
        <view class="note-header">
          <text class="note-title">{{ note.title }}</text>
          <view class="note-meta">
            <text class="note-time">{{ formatTime(note.created_at) }}</text>
            <text class="note-category" v-if="note.category">{{ note.category }}</text>
          </view>
        </view>
        
        <view class="note-tags" v-if="note.tags && note.tags.length > 0">
          <text v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</text>
        </view>
        
        <view class="note-body">
          <!-- 使用mp-html组件展示HTML内容 -->
          <mp-html 
            :content="note.content" 
            :preview-img="true"
            :lazy-load="true"
            :copy-link="true"
            :selectable="true"
            @imgtap="onImgTap"
            @linktap="onLinkTap"
            @load="onLoad"
            @ready="onReady"
            @error="onError"
          />
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-else-if="loading" class="loading-container">
        <text class="loading-text">加载中...</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { getNoteDetail, formatTime } from '@/api/notes.js';

const note = ref(null);
const loading = ref(false);
const statusBarHeight = ref(0);
const bgImageHeight = ref(400); // 初始值
const bgImageCount = ref(5); // 初始至少5张

// 背景图片加载完成事件
const onBgImageLoad = (e) => {
  // 获取图片实际高度
  nextTick(() => {
    try {
      const query = uni.createSelectorQuery();
      query.select('.bg-image').boundingClientRect(rect => {
        if (rect) {
          bgImageHeight.value = rect.height;
          updateBgImageCount();
        }
      }).exec();
    } catch (error) {
      console.error('获取背景图片高度失败:', error);
      // 如果获取失败，使用默认值
      bgImageHeight.value = 400;
      updateBgImageCount();
    }
  });
};

// 背景图片加载错误事件
const onBgImageError = (e) => {
  console.error('背景图片加载失败:', e.detail);
};

// 更新背景图片数量
const updateBgImageCount = () => {
  nextTick(() => {
    try {
      const query = uni.createSelectorQuery();
      query.select('.content-wrapper').boundingClientRect(rect => {
        if (rect && bgImageHeight.value > 0) {
          // 确保背景图片数量足够覆盖整个内容区域
          const neededCount = Math.ceil(rect.height / bgImageHeight.value);
          bgImageCount.value = Math.max(neededCount + 2, 5); // 至少5张，多渲染2张确保覆盖
    
        }
      }).exec();
    } catch (error) {
      console.error('更新背景图片数量失败:', error);
      // 如果获取失败，使用默认值
      bgImageCount.value = 5;
    }
  });
};

// 获取笔记详情
const fetchNoteDetail = async (id) => {
  loading.value = true;
  
  try {
    const res = await getNoteDetail(id);
    
    if (res.data) {
      note.value = {
        id: res.data.id,
        title: res.data.post_title,
        content: res.data.post_content,
        category: res.data.post_name,
        created_at: res.data.post_date,
        tags: res.data.tags || []
      };
      // 内容加载完成后更新背景图片数量
      setTimeout(() => {
        updateBgImageCount();
      }, 1000); // 增加延迟确保内容完全渲染
    } else {
      throw new Error('笔记不存在');
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    uni.showToast({
      title: '连接错误，请检查网络',
      icon: 'none'
    });
    goBack();
  } finally {
    loading.value = false;
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

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

// 图片点击事件
const onImgTap = (e) => {
  
  uni.showToast({
    title: '图片预览',
    icon: 'none'
  });
};

// 链接点击事件
const onLinkTap = (e) => {
  
  uni.showToast({
    title: '链接已复制到剪贴板',
    icon: 'success'
  });
};

// 组件加载完成事件
const onLoad = (e) => {
  
  updateBgImageCount();
};

// 图片加载完成事件
const onReady = (e) => {
  
  updateBgImageCount();
};

// 渲染错误事件
const onError = (e) => {
  
  uni.showToast({
    title: '渲染出错',
    icon: 'error'
  });
};

onMounted(() => {
  // 获取状态栏高度
  getStatusBarHeight();
  
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const id = currentPage.options?.id;
  
  if (id) {
    fetchNoteDetail(id);
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    });
    goBack();
  }
  
  // 初始化背景图片数量，延迟执行确保页面渲染完成
  setTimeout(() => {
    updateBgImageCount();
  }, 500);
});
</script>

<style>
.note-detail-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.bg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-image {
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 0;
}

.content-wrapper {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

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
  padding: 12rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2rpx);
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

.note-content {
  background-color: transparent;
  padding: 32rpx;
}

.note-header {
  margin-bottom: 24rpx;
}

.note-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #2e7d32;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: block;
}

.note-meta {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.note-time, .note-category {
  font-size: 26rpx;
  color: #666;
}

.note-category {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-left: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.3);
}

.note-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 32rpx;
  flex-wrap: wrap;
}

.note-tag {
  background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
  color: white;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.2);
  transition: all 0.3s ease;
}

.note-tag:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.note-body {
  background-color: transparent;
  padding: 12rpx;
  margin-bottom: 32rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #4CAF50;
}
</style> 