<template>
  <view class="asset-container">
    <view class="greeting-row">
      <view class="greeting-left">
        <image :src="getGreetingIcon()" class="greeting-emoji-img" />
        <text class="greeting-text">{{ greeting }}</text>
      </view>
      <view class="right-buttons">
        <view class="delete-toggle-btn" @click="toggleDeleteMode">
          <image src="/static/delete.png" class="delete-toggle-icon" />
          <text class="delete-toggle-text">{{ deleteMode ? '完成' : '删除' }}</text>
        </view>
        <view class="add-button" @click="openAdd">
          <image src="/static/greenadd.png" class="add-icon" />
          <text class="add-text">添加</text>
        </view>
      </view>
    </view>
    <view class="asset-summary">
      <view class="summary-item">
        <view class="summary-label">总资产(¥)</view>
        <view class="summary-value">{{ totalAsset.toFixed(2) }}</view>
      </view>
      <view class="summary-item">
        <view class="summary-label">总日均(¥)</view>
        <view class="summary-value">{{ totalDailyAvg.toFixed(2) }}</view>
      </view>
    </view>
    <view class="asset-list">
      <view v-for="(item, idx) in assets" :key="item.record_id || idx" class="asset-card">
        <view class="asset-card-header">
          <image :src="item.icon || '/static/asset.png'" class="asset-card-icon" mode="aspectFit" />
          <view class="asset-card-title">{{ item.name }}</view>
          <view v-if="deleteMode" class="delete-x" @click="deleteAsset(item.record_id)">×</view>
        </view>
        <view class="asset-card-body">
          <view class="asset-amount">¥{{ item.buy_price }}</view>
          <view class="asset-meta">
            <text>¥{{ (item.daily_average || 0).toFixed(2) }}/天</text>
            <text>｜{{ item.days_remaining || 0 }}天</text>
          </view>
          <view class="asset-date">购：{{ item.buy_time }}</view>
        </view>
      </view>
    </view>
    <view class="no-more">没有更多了</view>

    <!-- 新增资产弹窗 -->
    <view v-if="showAdd" class="modal-mask">
      <view class="modal-content">
        <view class="modal-title">新增资产</view>
        <input v-model="addForm.name" placeholder="资产名称" class="modal-input" />
        <input v-model="addForm.buy_price" placeholder="购买价格" type="number" class="modal-input" />
        <picker
          mode="date"
          :end="todayStr"
          :value="addForm.buy_time"
          @change="onDateChange"
        >
          <view class="picker-view">
            {{ addForm.buy_time ? addForm.buy_time : '购买时间' }}
          </view>
        </picker>
        <view class="modal-buttons">
          <button class="modal-button cancel" @click="closeAdd">取消</button>
          <button class="modal-button confirm" :loading="addLoading" @click="submitAdd">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import request from '@/utils/request.js';


const greeting = ref('');
const getGreetingIcon = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '/static/moon.png';
  if (hour < 9) return '/static/morning.png';
  if (hour < 17) return '/static/sun.png';
  if (hour < 19) return '/static/sunset.png';
  return '/static/moon.png';
};
const updateGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) greeting.value = '凌晨好，要注意休息哦~';
  else if (hour < 9) greeting.value = '早上好，开始美好的一天~';
  else if (hour < 12) greeting.value = '上午好，工作顺利哦~';
  else if (hour < 14) greeting.value = '中午好，记得吃午饭~';
  else if (hour < 17) greeting.value = '下午好，继续加油~';
  else if (hour < 19) greeting.value = '傍晚好，准备下班啦~';
  else if (hour < 22) greeting.value = '晚上好，记得放松一下~';
  else greeting.value = '夜深了，早点休息哦~';
};
onMounted(() => {
  updateGreeting();
  fetchAssets();
});

const assets = ref([]);
const totalAsset = computed(() => assets.value.reduce((sum, a) => sum + (a.buy_price || 0), 0));
const totalDailyAvg = computed(() => assets.value.reduce((sum, a) => sum + (a.daily_average || 0), 0));

// 新增资产弹窗
const showAdd = ref(false);
const addForm = ref({
  name: '',
  buy_price: '',
  buy_time: ''
});
const addLoading = ref(false);
const todayStr = new Date().toISOString().slice(0, 10);

function openAdd() {
  addForm.value = { name: '', buy_price: '', buy_time: '' };
  showAdd.value = true;
}
function closeAdd() {
  showAdd.value = false;
}
async function submitAdd() {
  if (!addForm.value.name || !addForm.value.buy_price || !addForm.value.buy_time) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  addLoading.value = true;
  try {
    await request({
      url: `/api/asset/record`,
      method: 'POST',
      data: addForm.value,
      header: { 'Content-Type': 'application/json' }
    });
    uni.showToast({ title: '添加成功', icon: 'success' });
    showAdd.value = false;
    fetchAssets();
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'none' });
  } finally {
    addLoading.value = false;
  }
}

// 获取资产列表
async function fetchAssets() {
  try {
    const res = await request({
      url: `/api/asset/records`,
      method: 'GET'
    });
    if (res.data.code === 0) {
      assets.value = res.data.data.records;
    } else {
      uni.showToast({ title: res.data.message || '获取失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '获取失败，请检查网络环境或是否登录', icon: 'none' });
  }
}

// 删除资产
async function deleteAsset(id) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该资产吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/api/asset/record/${id}`,
            method: 'DELETE'
          });
          uni.showToast({ title: '删除成功', icon: 'success' });
          fetchAssets();
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
}

const deleteMode = ref(false);
function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value;
}

function onDateChange(e) {
  addForm.value.buy_time = e.detail.value;
}
</script>

<style>
.asset-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
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
.right-buttons {
  display: flex;
  align-items: center;
  gap: 16rpx;
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
.asset-summary {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(90deg, #a8e063 0%, #56ab2f 100%);
  border-radius: 24rpx;
  margin: 32rpx 24rpx 32rpx 24rpx;
  padding: 32rpx 0;
  color: #fff;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.summary-label {
  font-size: 24rpx;
  opacity: 0.8;
}
.summary-value {
  font-size: 40rpx;
  font-weight: bold;
  margin-top: 8rpx;
}
.asset-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  justify-items: center;
  margin: 0 12rpx;
}
.asset-card {
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
  width: 90%;
  margin-bottom: 16rpx;
  padding: 24rpx 20rpx;
  display: flex;
  flex-direction: column;
}
.asset-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
  position: relative;
}
.asset-card-icon {
  width: 36rpx;
  height: 36rpx;
  margin-right: 12rpx;
}
.asset-card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}
.asset-card-body {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.asset-amount {
  font-size: 32rpx;
  color: #4CAF50;
  font-weight: bold;
}
.asset-meta {
  font-size: 24rpx;
  color: #666;
}
.asset-date {
  font-size: 22rpx;
  color: #999;
}
.delete-x {
  position: absolute;
  top: -8rpx;
  right: 16rpx;
  font-size: 36rpx;
  color: #bbb;
  font-weight: bold;
  cursor: pointer;
  z-index: 2;
  transition: color 0.2s;
}
.delete-x:active {
  color: #f44336;
}
.no-more {
  text-align: center;
  color: #bbb;
  font-size: 26rpx;
  margin-top: 32rpx;
}

/* 新增资产弹窗样式 */
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
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 12rpx;
}
.modal-input {
  font-size: 28rpx;
  border: 1rpx solid #eee;
  border-radius: 8rpx;
  padding: 16rpx;
}
.modal-buttons {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 12rpx;
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
  background: #4CAF50;
  color: #fff;
}
.modal-button:active {
  opacity: 0.8;
}

.delete-toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx;
  cursor: pointer;
  margin-right: 16rpx;
}
.delete-toggle-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 4rpx;
}
.delete-toggle-text {
  font-size: 24rpx;
  color: #888;
}

.picker-view {
  color: #333;
  font-size: 16px;
  padding: 12px 14px;
  background: #f5f5f5;
  border-radius: 8px;
}
</style> 