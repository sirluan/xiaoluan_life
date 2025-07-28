<template>
  <view class="account-container">
    <!-- Loading 遮罩 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <view class="loading-icon"></view>
        <text class="loading-text">加载中...</text>
      </view>
    </view>

    <!-- 顶部问候 -->
    <view class="greeting-row">
      <view class="greeting-left">
        <image :src="getGreetingIcon()" class="greeting-emoji-img" />
        <text class="greeting-text">{{ greeting }}</text>
      </view>
      <view class="add-button" @click="handleAdd">
        <image src="/static/greenadd.png" class="add-icon" />
        <text class="add-text">添加</text>
      </view>
    </view>
    <!-- 总资产与变化 -->
    <view class="asset-summary-block" v-if="records.length">
      <view class="asset-summary-left">
        <text class="asset-summary-label">总资产</text>
        <text class="asset-summary-value"> {{ records[0].total.toFixed(2) }} </text>
        <text class="asset-summary-unit">总资产(¥)</text>
      </view>
      <view class="asset-summary-right">
        <text class="asset-summary-change-label">同比变化</text>
        <text :class="getChangeClass(getRecordChange(0))">
          {{ getRecordChange(0) >= 0 ? '+' : '' }}{{ getRecordChange(0).toFixed(2) }}
        </text>
        <text class="asset-summary-change-unit">同比(¥)</text>
      </view>
    </view>
    <view class="asset-summary-block" v-else>
      <view class="asset-summary-left">
        <text class="asset-summary-label">总资产</text>
        <text class="asset-summary-value">0.00</text>
        <text class="asset-summary-unit">总资产(¥)</text>
      </view>
      <view class="asset-summary-right">
        <text class="asset-summary-change-label">同比变化</text>
        <text class="change-up">+0.00</text>
        <text class="asset-summary-change-unit">同比(¥)</text>
      </view>
    </view>
    <!-- 历史记录 -->
    <view v-for="(record, idx) in records" :key="record.date" class="record-block">
      <view class="record-header">
        <view class="record-header-top">
          <text class="record-date">{{ formatDate(record.date) }}</text>
          <text v-if="record.remark" class="record-remark">{{ record.remark }}</text>
          <view class="record-actions">
            <view class="delete-button" @click="handleDelete(record)">
              <text class="delete-icon">×</text>
            </view>
          </view>
        </view>
        <view class="record-summary">
          <view class="record-total-group">
            <image src="/static/money.png" class="record-icon" />
            <text class="record-total-label">总金额：</text>
            <text class="record-total">¥{{ record.total.toFixed(2) }}</text>
          </view>
          <view class="record-change-group">
            <image src="/static/comparison.png" class="record-icon" />
            <text class="record-change-label">同比：</text>
            <text :class="getChangeClass(getRecordChange(idx))">
              {{ getRecordChange(idx) >= 0 ? '+' : '' }}{{ getRecordChange(idx).toFixed(2) }}
            </text>
          </view>
        </view>
      </view>
      <view class="record-details">
        <view v-for="item in record.details" :key="item.type" class="detail-item">
          <image :src="'/static/' + item.icon" class="detail-icon" />
          <text class="detail-type">{{ item.custom_type || item.type }}</text>
          <text class="detail-amount" :class="item.amount >= 0 ? 'amount-up' : 'amount-down'">
            ¥{{ item.amount.toFixed(2) }}
          </text>
        </view>
      </view>
    </view>

    <!-- 空状态提示 -->
    <view v-if="records.length === 0 && !loading" class="empty-state">
      <image src="/static/empty.png" class="empty-icon" />
      <text class="empty-text">暂无记录，点击右上角添加</text>
    </view>

    <!-- 确认删除弹窗 -->
    <view v-if="showDeleteConfirm" class="modal-mask" @click.self="cancelDelete">
      <view class="modal-content">
        <view class="modal-title">确认删除</view>
        <view class="modal-message">确定要删除这条记录吗？删除后无法恢复。</view>
        <view class="modal-buttons">
          <button class="modal-button cancel" @click.stop="cancelDelete">取消</button>
          <button class="modal-button confirm" @click.stop="confirmDelete">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      greeting: '',
      assetSummary: {
        total: 0,
        change: 0
      },
      records: [],
      deleteRecord: null,
      showDeleteConfirm: false
    }
  },
  onShow() {
    // 每次页面显示时刷新数据
    this.fetchRecords()
    this.updateGreeting()
  },
  methods: {
    // 获取记录列表
    async fetchRecords() {
      try {
        this.loading = true
        const res = await request({
          url: '/api/account/records',
          method: 'GET'
        })

        if (res.data.code === 0) {
          const { assetSummary, records } = res.data.data
          this.assetSummary = assetSummary
          this.records = records.sort((a, b) => new Date(b.date) - new Date(a.date))
        } else {
          uni.showToast({
            title: res.data.message || '获取记录失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.showToast({
          title: '获取失败，请检查网络环境或是否登录',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    // 格式化日期
    formatDate(dateStr) {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    },

    // 根据时间更新问候语
    updateGreeting() {
      const hour = new Date().getHours()
      if (hour < 6) {
        this.greeting = '凌晨好，要注意休息哦~'
      } else if (hour < 9) {
        this.greeting = '早上好，开始美好的一天~'
      } else if (hour < 12) {
        this.greeting = '上午好，工作顺利哦~'
      } else if (hour < 14) {
        this.greeting = '中午好，记得吃午饭~'
      } else if (hour < 17) {
        this.greeting = '下午好，继续加油~'
      } else if (hour < 19) {
        this.greeting = '傍晚好，准备下班啦~'
      } else if (hour < 22) {
        this.greeting = '晚上好，记得放松一下~'
      } else {
        this.greeting = '夜深了，早点休息哦~'
      }
    },

    // 获取问候表情图片
    getGreetingIcon() {
      const hour = new Date().getHours()
      if (hour < 6) return '/static/moon.png'
      if (hour < 9) return '/static/morning.png'
      if (hour < 17) return '/static/sun.png'
      if (hour < 19) return '/static/sunset.png'
      return '/static/moon.png'
    },

    // 跳转到添加记录页面
    handleAdd() {
      uni.navigateTo({
        url: '/pages/account/add-record/add-record'
      })
    },

    // 处理删除按钮点击
    handleDelete(record) {
      this.deleteRecord = record
      this.showDeleteConfirm = true
    },

    // 取消删除
    cancelDelete() {
      this.deleteRecord = null
      this.showDeleteConfirm = false
    },

    // 确认删除
    async confirmDelete() {
      if (!this.deleteRecord || !this.deleteRecord.record_id) {
        return
      }

      try {
        this.loading = true
        const res = await request({
          url: `/api/account/record/${this.deleteRecord.record_id}`,
          method: 'DELETE'
        })



        if (res.data.code === 0) {
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
          })
          // 等待提示显示完成后再刷新列表
          setTimeout(async () => {
            await this.fetchRecords()
          }, 2000)
        } else {
          uni.showToast({
            title: res.data.message || '删除失败',
            icon: 'none',
            duration: 2000
          })
        }
      } catch (error) {
        console.error('Delete error:', error) // 添加日志
        uni.showToast({
          title: '网络错误',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.loading = false
        this.deleteRecord = null
        this.showDeleteConfirm = false
      }
    },

    getChangeClass(val) {
      return val >= 0 ? 'change-up' : 'change-down';
    },

    getRecordChange(idx) {
      if (idx === this.records.length - 1) return 0;
      return this.records[idx].total - this.records[idx + 1].total;
    }
  },

  // 微信小程序分享功能
  onShareAppMessage() {
    return {
      title: '存钱罐 - 记录生活点滴',
      path: '/pages/account/account',
      imageUrl: '/static/icon_account.png'
    }
  },

  onShareTimeline() {
    return {
      title: '存钱罐 - 记录生活点滴',
      query: '',
      imageUrl: '/static/icon_account.png'
    }
  }
}
</script>

<style>
.account-container {
  padding: 0 0 24rpx 0;
  background: #f8f8f8;
  min-height: 100vh;
}
.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 0 32rpx;
}
.greeting-left {
  display: flex;
  align-items: center;
}
.greeting-emoji-img {
  width: 100rpx;
  height: 100rpx;
  margin-right: 12rpx;
  vertical-align: middle;
}
.greeting-text {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}
.asset-summary-block {
  margin: 32rpx 24rpx 24rpx 24rpx;
  background: linear-gradient(90deg, #a8e063 0%, #56ab2f 100%);
  border-radius: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 36rpx 32rpx;
  color: #fff;
  box-shadow: 0 4rpx 16rpx rgba(86,171,47,0.10);
}
.asset-summary-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.asset-summary-label {
  font-size: 24rpx;
  opacity: 0.9;
}
.asset-summary-value {
  font-size: 44rpx;
  font-weight: bold;
  margin: 8rpx 0 0 0;
  letter-spacing: 2rpx;
}
.asset-summary-unit {
  font-size: 20rpx;
  opacity: 0.8;
  margin-top: 2rpx;
}
.asset-summary-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.asset-summary-change-label {
  font-size: 24rpx;
  opacity: 0.9;
}
.asset-summary-change-unit {
  font-size: 20rpx;
  opacity: 0.8;
  margin-top: 2rpx;
}
.change-up {
  color: #71e475;
  font-size: 36rpx;
  font-weight: bold;
  margin: 8rpx 0 0 0;
}
.change-down {
  color: #f44336;
  font-size: 36rpx;
  font-weight: bold;
  margin: 8rpx 0 0 0;
}
.record-block {
  background: #fff;
  border-radius: 20rpx;
  margin: 0 24rpx 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
  padding: 32rpx 24rpx 24rpx 24rpx;
}
.record-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 18rpx;
}
.record-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8rpx;
}
.record-date {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}
.record-remark {
  margin: 0 16rpx;
  font-size: 24rpx;
  color: #888;
  flex: 1;
  word-break: break-all;
  text-align: left;
}
.record-actions {
  display: flex;
  align-items: center;
}
.delete-button {
  padding: 8rpx;
  border-radius: 8rpx;
  transition: background-color 0.3s;
}
.delete-button:active {
  background-color: #f5f5f5;
}
.record-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.record-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}
.record-total-group, .record-change-group {
  display: flex;
  align-items: center;
}
.record-total-label, .record-change-label {
  font-size: 22rpx;
  color: #888;
}
.record-total {
  font-size: 28rpx;
  font-weight: bold;
  color: #222;
  margin-left: 2rpx;
}
.record-details {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.detail-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  margin-bottom: 0;
}
.detail-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 14rpx;
}
.detail-type {
  width: 150rpx;
  color: #333;
}
.detail-amount {
  margin-left: auto;
  font-size: 28rpx;
  font-weight: 500;
}
.amount-up {
  color: #222;
}
.amount-down {
  color: #f44336;
}
.add-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx;
  cursor: pointer;
}
.add-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 4rpx;
}
.add-text {
  font-size: 24rpx;
  color: #888;
}
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 32rpx;
}
.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
  opacity: 0.5;
}
.empty-text {
  font-size: 28rpx;
  color: #999;
}
.loading-icon {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16rpx;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.delete-icon {
  font-size: 32rpx;
  color: #999;
  font-weight: bold;
  line-height: 1;
}
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  width: 560rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  position: relative;
  z-index: 1000;
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 24rpx;
}
.modal-message {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 32rpx;
}
.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 32rpx;
}
.modal-button {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
  padding: 0;
}
.modal-button.cancel {
  background: #f5f5f5;
  color: #666;
}
.modal-button.confirm {
  background: #f44336;
  color: #fff;
}
.modal-button:active {
  opacity: 0.8;
}
</style> 