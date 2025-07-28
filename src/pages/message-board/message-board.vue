<template>
  <view class="message-board-container">
    <view class="message-grid">
      <view v-for="(message, index) in messages" :key="index" class="message-card" @click="showDetail(message)">
        <view class="message-title">{{ message.title }}</view>
        <view class="message-content">{{ message.content }}</view>
      </view>
    </view>
    <view class="fab" @click="showInput = true">
      <text class="fab-plus">+</text>
    </view>
    <view v-if="showInput" class="input-modal">
      <view class="input-modal-content">
        <input 
          class="input-author" 
          v-model="newTitle" 
          placeholder="标题（可选）" 
        />
        <textarea class="input-message" v-model="newContent" placeholder="写下你的留言..." />
        <view class="input-actions">
          <button class="cancel-btn" @click="showInput = false">取消</button>
          <button class="submit-btn" @click="submitMessage">发送</button>
        </view>
      </view>
    </view>
    <view v-if="showDetailModal" class="input-modal" @click="showDetailModal = false">
      <view class="detail-modal-content" @click.stop>
        <view class="detail-header">
          <view class="detail-title">{{ detailMessage.title }}</view>
          <view v-if="canDeleteMessage(detailMessage)" class="delete-btn" @click="deleteMessage(detailMessage.id, detailMessageIndex)">
            <image class="delete-icon" src="../../static/delete.png" mode="aspectFit" />
          </view>
        </view>
        <view class="detail-time">{{ new Date(detailMessage.date).getFullYear() }}年{{ new Date(detailMessage.date).getMonth() + 1 }}月{{ new Date(detailMessage.date).getDate() }}日   {{ detailMessage.author }}</view>
        <view class="detail-content">{{ detailMessage.content }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import request from '../../utils/request.js'

export default {
  data() {
    return {
      messages: [],
      page: 1,
      limit: 20,
      total: 0,
      newTitle: '',
      newContent: '',
      showInput: false,
      showDetailModal: false,
      detailMessage: {},
      detailMessageIndex: -1
    }
  },
  
  onLoad() {
    this.fetchMessages();
  },
  
  methods: {
    async fetchMessages() {
      try {
        const res = await request({
          url: '/api/messages',
          method: 'GET',
          data: { page: this.page, limit: this.limit }
        });
        if (res.data.code === 200) {
          this.messages = res.data.data.list;
          this.total = res.data.data.total;
        } else {
          uni.showToast({ title: res.data.message || '获取留言失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取留言失败:', error);
        uni.showToast({ title: '获取留言失败', icon: 'none' });
      }
    },
    
    async submitMessage() {
      if (!this.newTitle.trim() || !this.newContent.trim()) {
        uni.showToast({ title: '标题和内容不能为空', icon: 'none' });
        return;
      }
      
      // 新增：获取当前时间，格式为 YYYY-MM-DD HH:mm:ss
      const now = new Date();
      const pad = n => n < 10 ? '0' + n : n;
      const formatDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      const date = formatDate(now);
      const userId= uni.getStorageSync('userId');
      
      try {
        const res = await request({
          url: '/api/messages',
          method: 'POST',
          data: { title: this.newTitle, content: this.newContent, user_id: userId, date }
        });
        if (res.data.code === 200) {
          uni.showToast({ title: '留言成功', icon: 'success' });
          this.showInput = false;
          this.newTitle = '';
          this.newContent = '';
          this.fetchMessages();
        } else {
          uni.showToast({ title: res.data.message || '留言失败', icon: 'none' });
        }
      } catch (error) {
        console.error('提交留言失败:', error);
        uni.showToast({ title: '留言失败', icon: 'none' });
      }
    },
    
    async deleteMessage(id, index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条留言吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const response = await request({
                url: `/api/messages/${id}`,
                method: 'DELETE'
              });
              
              if (response.data.code === 200) {
                uni.showToast({ title: '删除成功', icon: 'success' });
                // 从本地数组中移除该消息
                this.messages.splice(index, 1);
                // 关闭详情模态框
                this.showDetailModal = false;
              } else {
                uni.showToast({ title: response.data.message || '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除留言失败:', error);
              uni.showToast({ title: '删除失败', icon: 'none' });
            }
          }
        }
      });
    },
    
    showDetail(message) {
      this.detailMessage = message;
      // 找到消息在数组中的索引
      this.detailMessageIndex = this.messages.findIndex(m => m.id === message.id);
      this.showDetailModal = true;
    },
    
    canDeleteMessage(message) {
      const currentUserId = uni.getStorageSync('userId');
      return message.user_id && currentUserId && message.user_id === currentUserId;
    }
  },

  // 微信小程序分享功能
  onShareAppMessage() {
    return {
      title: '留言板 - 分享你的想法',
      path: '/pages/message-board/message-board',
      imageUrl: '/static/icon_messages.svg'
    }
  },

  onShareTimeline() {
    return {
      title: '留言板 - 分享你的想法',
      query: '',
      imageUrl: '/static/icon_messages.svg'
    }
  }
}
</script>

<style>
.message-board-container {
  position: relative;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24rpx 16rpx 0 16rpx;
  box-sizing: border-box;
}

.message-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32rpx 24rpx;
  padding-bottom: 120rpx;
}

.message-card {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
  padding: 32rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 120rpx;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.message-card:active {
  box-shadow: 0 4rpx 16rpx rgba(0,122,255,0.15);
}

.message-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.message-content {
  font-size: 26rpx;
  color: #666;
  word-break: break-all;
}

.fab {
  position: fixed;
  right: 40rpx;
  bottom: 60rpx;
  width: 88rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #a8e063 0%, #56ab2f 100%);
  border-radius: 50%;
  box-shadow: 0 8rpx 32rpx rgba(86,171,47,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border: 2rpx solid #bbb;
  transition: box-shadow 0.2s, transform 0.2s;
}

.fab:active {
  box-shadow: 0 12rpx 40rpx rgba(86,171,47,0.28);
  transform: scale(1.08);
}

.fab-plus {
  font-size: 64rpx;
  color: #fff;
  font-weight: bold;
  transition: transform 0.2s;
}

.fab:active .fab-plus {
  transform: rotate(90deg) scale(1.15);
}

.input-modal {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.input-modal-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 32rpx 32rpx 32rpx;
  width: 80vw;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
}
.input-author {
  font-size: 28rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 16rpx;
}
.input-message {
  font-size: 28rpx;
  min-height: 120rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 16rpx;
  margin-bottom: 24rpx;
}
.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 32rpx;
  margin-top: 8rpx;
}
.cancel-btn {
  background: #f0f0f0;
  color: #888;
  border-radius: 32rpx;
  padding: 18rpx 48rpx;
  font-size: 30rpx;
  border: none;
  transition: background 0.2s, color 0.2s;
}
.cancel-btn:active {
  background: #e0e0e0;
  color: #aaa;
}
.submit-btn {
  background: linear-gradient(90deg, #a8e063 0%, #56ab2f 100%);
  color: #fff;
  border-radius: 32rpx;
  padding: 18rpx 48rpx;
  font-size: 30rpx;
  border: none;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(86,171,47,0.10);
  transition: background 0.2s, box-shadow 0.2s;
}
.submit-btn:active {
  background: linear-gradient(90deg, #56ab2f 0%, #a8e063 100%);
  box-shadow: 0 4rpx 16rpx rgba(86,171,47,0.18);
}
.detail-modal-content {
  background: #fff;
  border-radius: 20rpx;
  padding: 48rpx 36rpx 36rpx 36rpx;
  width: 82vw;
  max-width: 640rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,122,255,0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.2s;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 12rpx;
  margin-left: 20rpx;
}

.detail-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #007AFF;
  flex: 1;
  text-align: center;
}

.delete-btn {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:active {
  background: #f5f5f5;
}

.delete-icon {
  width: 32rpx;
  height: 32rpx;
}

.detail-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
  text-align: center;
}
.detail-content {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 36rpx;
  word-break: break-all;
  text-align: left;
  line-height: 1.7;
  width: 100%;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style> 