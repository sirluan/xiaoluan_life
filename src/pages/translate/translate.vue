<template>
  <view class="translate-content">
    <view class="header">
      <text class="title">翻译工具</text>
    </view>
    
    <!-- 语言选择 -->
    <view class="language-selector">
      <view class="language-item">
        <text class="language-label">源语言</text>
        <picker @change="onSourceLanguageChange" :value="sourceLanguageIndex" :range="languageOptions" range-key="name">
          <view class="picker-view">
            {{ sourceLanguage.name || '自动检测' }}
          </view>
        </picker>
      </view>
      <view class="swap-btn" @click="swapLanguages">
        <text class="swap-icon">⇄</text>
      </view>
      <view class="language-item">
        <text class="language-label">目标语言</text>
        <picker @change="onTargetLanguageChange" :value="targetLanguageIndex" :range="languageOptions" range-key="name">
          <view class="picker-view">
            {{ targetLanguage.name || '请选择' }}
          </view>
        </picker>
      </view>
    </view>
    
    <!-- 输入区域 -->
    <view class="input-section">
      <textarea 
        v-model="inputText" 
        placeholder="请输入要翻译的文本" 
        class="input-textarea"
        :maxlength="5000"
        show-confirm-bar="false"
        @input="onInputChange"
      />
      <view class="input-footer">
        <text class="word-count">{{ inputText.length }}/5000</text>
        <view class="detect-btn" @click="detectLanguage" v-if="inputText.length > 0">
          <text class="detect-text">检测语言</text>
        </view>
      </view>
    </view>
    
    <!-- 翻译按钮 -->
    <view class="translate-btn-container">
      <button 
        class="translate-btn" 
        @click="translateText" 
        :disabled="!inputText.trim() || !targetLanguage.code"
        :loading="translating"
      >
        {{ translating ? '翻译中...' : '翻译' }}
      </button>
    </view>
    
    <!-- 翻译结果 -->
    <view v-if="translatedText" class="result-section">
      <view class="result-header">
        <text class="result-title">翻译结果</text>
        <view class="copy-btn" @click="copyResult">
          <text class="copy-text">复制</text>
        </view>
      </view>
      <view class="result-content">
        <text class="result-text">{{ translatedText }}</text>
      </view>
      <view v-if="translationInfo" class="translation-info">
        <text class="info-text">源语言: {{ translationInfo.source_language }}</text>
        <text class="info-text">字符数: {{ translationInfo.word_count }}</text>
      </view>
    </view>
    
    <!-- 历史记录 -->
    <view v-if="translationHistory.length > 0" class="history-section">
      <view class="history-header">
        <text class="history-title">翻译历史</text>
        <view class="clear-btn" @click="clearHistory">
          <text class="clear-text">清空</text>
        </view>
      </view>
      <view class="history-list">
        <view 
          v-for="(item, index) in translationHistory" 
          :key="index" 
          class="history-item"
          @click="loadHistoryItem(item)"
        >
          <text class="history-original">{{ item.original_text }}</text>
          <text class="history-translated">{{ item.translated_text }}</text>
          <text class="history-time">{{ formatTime(item.timestamp) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '@/utils/request.js';

// 响应式数据
const inputText = ref('');
const translatedText = ref('');
const translating = ref(false);
const sourceLanguage = ref({ code: 'auto', name: '自动检测' });
const targetLanguage = ref({ code: 'zh', name: '中文' });
const sourceLanguageIndex = ref(0);
const targetLanguageIndex = ref(0);
const languageOptions = ref([]);
const translationInfo = ref(null);
const translationHistory = ref([]);
const detectedLanguage = ref(null);

// 获取支持的语言列表
const fetchSupportedLanguages = async () => {
  try {
    const res = await request({
      url: '/api/translate/languages',
      method: 'GET'
    });
    if (res.data && res.data.languages) {
      languageOptions.value = Object.entries(res.data.languages).map(([code, name]) => ({
        code,
        name
      }));
      // 设置默认目标语言为中文
      const zhIndex = languageOptions.value.findIndex(lang => lang.code === 'zh');
      if (zhIndex !== -1) {
        targetLanguageIndex.value = zhIndex;
        targetLanguage.value = languageOptions.value[zhIndex];
      }
    }
  } catch (error) {
    console.error('获取语言列表失败:', error);
    uni.showToast({ title: '获取语言列表失败', icon: 'none' });
  }
};

// 语言选择事件
const onSourceLanguageChange = (e) => {
  const index = e.detail.value;
  sourceLanguageIndex.value = index;
  sourceLanguage.value = languageOptions.value[index];
};

const onTargetLanguageChange = (e) => {
  const index = e.detail.value;
  targetLanguageIndex.value = index;
  targetLanguage.value = languageOptions.value[index];
};

// 交换语言
const swapLanguages = () => {
  if (sourceLanguage.value.code !== 'auto') {
    const temp = { ...sourceLanguage.value };
    sourceLanguage.value = { ...targetLanguage.value };
    targetLanguage.value = temp;
    
    const tempIndex = sourceLanguageIndex.value;
    sourceLanguageIndex.value = targetLanguageIndex.value;
    targetLanguageIndex.value = tempIndex;
  }
};

// 输入变化
const onInputChange = (e) => {
  inputText.value = e.detail.value;
};

// 检测语言
const detectLanguage = async () => {
  if (!inputText.value.trim()) {
    uni.showToast({ title: '请先输入文本', icon: 'none' });
    return;
  }
  
  try {
    const res = await request({
      url: '/api/translate/detect',
      method: 'POST',
      data: {
        text: inputText.value
      }
    });
    
    if (res.data && res.data.success) {
      detectedLanguage.value = res.data.detected_language;
      uni.showToast({ 
        title: `检测到语言: ${res.data.detected_language}`, 
        icon: 'none' 
      });
    }
  } catch (error) {
    console.error('语言检测失败:', error);
    uni.showToast({ title: '语言检测失败', icon: 'none' });
  }
};

// 翻译文本
const translateText = async () => {
  if (!inputText.value.trim()) {
    uni.showToast({ title: '请输入要翻译的文本', icon: 'none' });
    return;
  }
  
  if (!targetLanguage.value.code) {
    uni.showToast({ title: '请选择目标语言', icon: 'none' });
    return;
  }
  
  translating.value = true;
  
  try {
    const res = await request({
      url: '/api/translate/translate',
      method: 'POST',
      data: {
        text: inputText.value,
        source_language: sourceLanguage.value.code,
        target_language: targetLanguage.value.code
      }
    });
    
    if (res.data && res.data.success) {
      translatedText.value = res.data.translated_text;
      translationInfo.value = {
        source_language: res.data.source_language,
        word_count: res.data.word_count
      };
      
      // 保存到历史记录
      saveToHistory({
        original_text: inputText.value,
        translated_text: res.data.translated_text,
        source_language: res.data.source_language,
        target_language: res.data.target_language,
        timestamp: Date.now()
      });
      
      uni.showToast({ title: '翻译成功', icon: 'success' });
    } else {
      uni.showToast({ title: res.data.error || '翻译失败', icon: 'none' });
    }
  } catch (error) {
    console.error('翻译失败:', error);
    uni.showToast({ title: '翻译失败，请检查网络', icon: 'none' });
  } finally {
    translating.value = false;
  }
};

// 复制结果
const copyResult = () => {
  uni.setClipboardData({
    data: translatedText.value,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' });
    }
  });
};

// 保存到历史记录
const saveToHistory = (item) => {
  const history = uni.getStorageSync('translationHistory') || [];
  history.unshift(item);
  // 只保留最近50条记录
  if (history.length > 50) {
    history.splice(50);
  }
  uni.setStorageSync('translationHistory', history);
  translationHistory.value = history;
};

// 加载历史记录
const loadHistoryItem = (item) => {
  inputText.value = item.original_text;
  translatedText.value = item.translated_text;
  translationInfo.value = {
    source_language: item.source_language,
    target_language: item.target_language
  };
};

// 清空历史记录
const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有翻译历史吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('translationHistory');
        translationHistory.value = [];
        uni.showToast({ title: '已清空历史记录', icon: 'success' });
      }
    }
  });
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 加载历史记录
const loadHistory = () => {
  const history = uni.getStorageSync('translationHistory') || [];
  translationHistory.value = history;
};

onMounted(() => {
  fetchSupportedLanguages();
  loadHistory();
});

// 微信小程序分享功能
const onShareAppMessage = () => {
  return {
    title: '翻译工具 - 多语言翻译助手',
    path: '/pages/translate/translate',
    imageUrl: '/static/translate.png'
  };
};

const onShareTimeline = () => {
  return {
    title: '翻译工具 - 多语言翻译助手',
    query: '',
    imageUrl: '/static/translate.png'
  };
};
</script>

<style>
.translate-content {
  padding: 40rpx 20rpx;
  min-height: 100vh;
  background: #f7f7f7;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
}

.language-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.language-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.language-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

.picker-view {
  background: #f8f9fa;
  border: 2rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 30rpx;
  color: #333;
  text-align: center;
}

.swap-btn {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 32rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.swap-btn:active {
  transform: scale(0.95);
}

.swap-icon {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.input-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.input-textarea {
  width: 100%;
  min-height: 200rpx;
  border: 2rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 30rpx;
  line-height: 1.6;
  background: #f8f9fa;
  box-sizing: border-box;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.word-count {
  font-size: 24rpx;
  color: #999;
}

.detect-btn {
  background: #e3f2fd;
  border: 2rpx solid #2196f3;
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  cursor: pointer;
}

.detect-text {
  font-size: 24rpx;
  color: #2196f3;
}

.translate-btn-container {
  margin-bottom: 32rpx;
}

.translate-btn {
  width: 100%;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: #fff;
  border: none;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 32rpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.translate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.result-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.copy-btn {
  background: #e8f5e8;
  border: 2rpx solid #4CAF50;
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  cursor: pointer;
}

.copy-text {
  font-size: 24rpx;
  color: #4CAF50;
}

.result-content {
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.result-text {
  font-size: 30rpx;
  line-height: 1.6;
  color: #333;
}

.translation-info {
  display: flex;
  gap: 32rpx;
}

.info-text {
  font-size: 24rpx;
  color: #666;
}

.history-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.history-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.clear-btn {
  background: #ffebee;
  border: 2rpx solid #f44336;
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
  cursor: pointer;
}

.clear-text {
  font-size: 24rpx;
  color: #f44336;
}

.history-list {
  max-height: 400rpx;
  overflow-y: auto;
}

.history-item {
  border-bottom: 1rpx solid #f0f0f0;
  padding: 16rpx 0;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f8f9fa;
}

.history-original {
  font-size: 28rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.history-translated {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.history-time {
  font-size: 22rpx;
  color: #999;
}
</style> 