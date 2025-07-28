<template>
  <view class="memory-day-content">
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
        <view class="add-button" @click="showAddModal = true">
          <image src="/static/greenadd.png" class="add-icon" />
          <text class="add-text">添加</text>
        </view>
      </view>
    </view>
    <view v-if="memoryDays.length === 0" class="empty-tip">暂无纪念日，点击添加吧~</view>
    <view v-for="(item, idx) in memoryDays" :key="item.id" :class="['memory-item', item.type === 'birthday' ? 'birthday-item' : 'anniversary-item']">
      <button v-if="deleteMode" class="delete-btn" @click="deleteMemoryDay(item.id)">×</button>
      <view class="memory-item-main">
        <image class="memory-item-icon" :src="item.type === 'birthday' ? '/static/birthday.png' : '/static/memory_day.png'" />
        <view class="memory-info">
          <text class="memory-name">{{ item.name }}</text>
          <text class="memory-date">{{ formatDateDisplay(item.date, item.type) }}</text>
          <view class="calendar-switch-row" v-if="item.type === 'birthday'">
            <text class="calendar-switch-label">计算方式：</text>
            <view class="calendar-switch-buttons">
              <text 
                class="calendar-switch-btn" 
                :class="{ active: item.calendarMode === 'solar' || !item.calendarMode }"
                @click="switchCalendarMode(item.id, 'solar')"
              >公历</text>
              <text 
                class="calendar-switch-btn" 
                :class="{ active: item.calendarMode === 'lunar' }"
                @click="switchCalendarMode(item.id, 'lunar')"
              >农历</text>
            </view>
          </view>
          <text class="memory-diff">{{ getDiffText(item.date, item.type, item.calendarMode) }}</text>
        </view>
      </view>
    </view>
    <view v-if="showAddModal" class="modal-mask">
      <view class="modal">
        <text class="modal-title">添加纪念日</text>
        <view class="type-select-row">
          <radio-group class="type-radio-group">
            <label class="type-radio" :class="{active: newMemory.type === 'birthday'}" @click="newMemory.type = 'birthday'">
              <radio value="birthday" :checked="newMemory.type === 'birthday'" color="#56ab2f" style="display:none;" />生日
            </label>
            <label class="type-radio" :class="{active: newMemory.type === 'anniversary'}" @click="newMemory.type = 'anniversary'">
              <radio value="anniversary" :checked="newMemory.type === 'anniversary'" color="#56ab2f" style="display:none;" />纪念日
            </label>
          </radio-group>
        </view>
        <input v-model="newMemory.name" :placeholder="newMemory.type === 'birthday' ? '要记录谁的生日呀' : '纪念日名称'" class="modal-input" />
        <picker mode="date" :value="newMemory.date" @change="onDateChange" class="modal-input date-picker-view">
          <view>{{ newMemory.date || '请选择日期' }}</view>
        </picker>
        <view class="modal-actions">
          <button @click="showAddModal = false" class="modal-cancel">取消</button>
          <button @click="addMemoryDay" class="modal-confirm">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '@/utils/request.js';
import { Lunar } from 'lunar-javascript';

const memoryDays = ref([]);
const showAddModal = ref(false);
const newMemory = ref({ name: '', date: '', type: 'anniversary' });
const swipeStates = ref([]);
const deleteMode = ref(false);

// 获取纪念日列表
const fetchMemoryDays = async () => {
  try {
    const userId = uni.getStorageSync('userId');
    const res = await request({ 
      url: '/api/memory/records', 
      method: 'GET',
      data: {
        user_id: userId
      }
    });
    if (res.data && Array.isArray(res.data.data)) {
      // 获取用户保存的农历/公历偏好
      const calendarPreferences = uni.getStorageSync('calendarPreferences') || {};
      
      memoryDays.value = res.data.data.map(item => ({
        id: item.id,
        name: item.content,
        date: item.datetime,
        type: item.type,
        calendarMode: calendarPreferences[item.id] || 'solar' // 使用保存的偏好或默认为公历
      }));
    }
  } catch (e) {
    uni.showToast({ title: '获取失败，请检查网络环境或是否登录', icon: 'none' });
  }
};

onMounted(() => {
  fetchMemoryDays();
});

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，要注意休息哦~';
  if (hour < 9) return '早上好，开始美好的一天~';
  if (hour < 12) return '上午好，工作顺利哦~';
  if (hour < 14) return '中午好，记得吃午饭~';
  if (hour < 17) return '下午好，继续加油~';
  if (hour < 19) return '傍晚好，准备下班啦~';
  if (hour < 22) return '晚上好，记得放松一下~';
  return '夜深了，早点休息哦~';
};

const getGreetingIcon = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '/static/moon.png';
  if (hour < 9) return '/static/morning.png';
  if (hour < 17) return '/static/sun.png';
  if (hour < 19) return '/static/sunset.png';
  return '/static/moon.png';
};

const greeting = ref(getGreeting());

const addMemoryDay = async () => {
  if (!newMemory.value.name || !newMemory.value.date) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  try {
    const userId = uni.getStorageSync('userId');
    const res = await request({
      url: '/api/memory/record',
      method: 'POST',
      data: {
        content: newMemory.value.name,
        datetime: newMemory.value.date,
        type: newMemory.value.type,
        user_id: userId
      }
    });
    if (res.data && res.data.code === 0) {
      uni.showToast({ title: '添加成功', icon: 'success' });
      showAddModal.value = false;
      newMemory.value = { name: '', date: '', type: 'anniversary' };
      fetchMemoryDays();
    } else {
      uni.showToast({ title: res.data.message || '添加失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '网络错误', icon: 'none' });
  }
};


const deleteMemoryDay = async (id) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该纪念日吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const userId = uni.getStorageSync('userId');
          await request({ 
            url: `/api/memory/record/${id}`, 
            method: 'DELETE',
            data: {
              user_id: userId
            }
          });
          uni.showToast({ title: '删除成功', icon: 'success' });
          fetchMemoryDays();
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    }
  });
};

function getDiffText(dateStr, type = 'anniversary', calendarMode = 'solar') {
  const today = new Date();
  const target = new Date(dateStr);
  today.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  
  // 辅助函数：计算两个日期之间的年、月、日差值
  function calculateDateDiff(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    
    // 处理负数情况
    if (days < 0) {
      months--;
      // 获取上个月的天数
      const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  }
  
  // 辅助函数：计算农历生日的下次日期
  function getNextLunarBirthday(birthDate) {
    const today = new Date();
    const birthLunar = Lunar.fromDate(birthDate);
    
    // 获取今年的农历生日对应的公历日期
    let nextLunarBirthday = Lunar.fromYmd(today.getFullYear(), birthLunar.getMonth(), birthLunar.getDay());
    let nextSolarDate = new Date(nextLunarBirthday.getSolar().getYear(), nextLunarBirthday.getSolar().getMonth() - 1, nextLunarBirthday.getSolar().getDay());
    
    // 如果今年的农历生日已经过了，计算明年的
    if (nextSolarDate < today) {
      nextLunarBirthday = Lunar.fromYmd(today.getFullYear() + 1, birthLunar.getMonth(), birthLunar.getDay());
      nextSolarDate = new Date(nextLunarBirthday.getSolar().getYear(), nextLunarBirthday.getSolar().getMonth() - 1, nextLunarBirthday.getSolar().getDay());
    }
    
    return nextSolarDate;
  }
  
  if (type === 'birthday') {
    let nextBirthday;
    
    if (calendarMode === 'lunar') {
      // 农历生日计算
      nextBirthday = getNextLunarBirthday(target);
    } else {
      // 公历生日计算
      nextBirthday = new Date(today.getFullYear(), target.getMonth(), target.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
    }
    
    const diff = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return '今天生日！';
    
    // 计算年、月、日
    const { years, months, days } = calculateDateDiff(today, nextBirthday);
    let result = '距离下次生日还有';
    if (years > 0) result += `${years}年`;
    if (months > 0) result += `${months}月`;
    if (days > 0) result += `${days}天`;
    result += ` (${calendarMode === 'lunar' ? '农历' : '公历'})`;
    return result;
  } else {
    // 纪念日计算
    const diff = Math.floor((target - today) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return '就是今天！';
    
    if (diff > 0) {
      // 还未到来的纪念日
      const { years, months, days } = calculateDateDiff(today, target);
      let result = '还有';
      if (years > 0) result += `${years}年`;
      if (months > 0) result += `${months}月`;
      if (days > 0) result += `${days}天`;
      return result;
    } else {
      // 已过去的纪念日
      const { years, months, days } = calculateDateDiff(target, today);
      let result = '已过去';
      if (years > 0) result += `${years}年`;
      if (months > 0) result += `${months}月`;
      if (days > 0) result += `${days}天`;
      return result;
    }
  }
}

const onDateChange = (e) => {
  newMemory.value.date = e.detail.value;
};

const toggleDeleteMode = () => {
  deleteMode.value = !deleteMode.value;
};

// 格式化日期显示（公历|农历）
const formatDateDisplay = (dateStr, type) => {
  if (type !== 'birthday') {
    return dateStr;
  }
  
  try {
    const date = new Date(dateStr);
    const lunar = Lunar.fromDate(date);
    const solarDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const lunarDate = `${lunar.getMonth()}-${lunar.getDay()}`;
    return `${solarDate}|农历${lunarDate}`;
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateStr;
  }
};

const switchCalendarMode = (id, mode) => {
  const item = memoryDays.value.find(item => item.id === id);
  if (item) {
    item.calendarMode = mode;
    // 保存用户偏好到本地存储
    const calendarPreferences = uni.getStorageSync('calendarPreferences') || {};
    calendarPreferences[id] = mode;
    uni.setStorageSync('calendarPreferences', calendarPreferences);
  }
};

// 微信小程序分享功能
const onShareAppMessage = () => {
  return {
    title: '纪念日 - 记录重要时刻',
    path: '/pages/memory-day/memory-day',
    imageUrl: '/static/memory_day.png'
  };
};

const onShareTimeline = () => {
  return {
    title: '纪念日 - 记录重要时刻',
    query: '',
    imageUrl: '/static/memory_day.png'
  };
};
</script>

<style>
.memory-day-content {
  padding: 40rpx 20rpx;
  min-height: 100vh;
  background: #f7f7f7;
}
.greeting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx 0 32rpx;
  margin-bottom: 24rpx;
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
.delete-toggle-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx;
  cursor: pointer;
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
.empty-tip {
  color: #aaa;
  text-align: center;
  margin-top: 80rpx;
  font-size: 32rpx;
}
.memory-item {
  position: relative;
  border-radius: 24rpx;
  padding: 32rpx 32rpx 32rpx 24rpx;
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
  min-height: 120rpx;
}
.memory-item-main {
  display: flex;
  align-items: center;
}
.memory-item-icon {
  width: 64rpx;
  height: 64rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.memory-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.memory-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}
.memory-date {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 2rpx;
}
.memory-diff {
  font-size: 28rpx;
  color: #4CAF50;
  margin-top: 2rpx;
}
.delete-btn {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 77, 79, 0.1);
  border: 2rpx solid rgba(255, 77, 79, 0.3);
  color: #ff4d4f;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}
.delete-btn:hover {
  background: rgba(255, 77, 79, 0.2);
  border-color: rgba(255, 77, 79, 0.5);
  transform: scale(1.1);
}
.delete-btn:active {
  background: rgba(255, 77, 79, 0.3);
  transform: scale(0.95);
}
.modal-mask {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 36rpx 36rpx 36rpx;
  width: 80vw;
  max-width: 600rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 32rpx rgba(160,120,255,0.10);
}
.modal-title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 36rpx;
  color: #333;
  text-align: center;
  letter-spacing: 2rpx;
}
.type-select-row {
  display: flex;
  gap: 32rpx;
  margin-bottom: 24rpx;
  justify-content: center;
}
.type-radio {
  font-size: 28rpx;
  color: #888;
  padding: 8rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e0e0e0;
  background: #f7f7f7;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  position: relative;
}
.type-radio.active {
  color: #fff;
  background: #56ab2f;
  border-color: #56ab2f;
}
.type-radio .uni-radio-input,
.type-radio input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.modal-input {
  width: 100%;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx 18rpx;
  font-size: 30rpx;
  margin-bottom: 28rpx;
  background: #fafaff;
  box-shadow: 0 2rpx 8rpx rgba(160,120,255,0.04);
  outline: none;
}
.modal-actions {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 32rpx;
  margin-top: 12rpx;
}
.modal-confirm {
  background: linear-gradient(90deg, #a8e063 0%, #56ab2f 100%);
  color: #fff;
  border-radius: 16rpx;
  padding: 16rpx 40rpx;
  font-size: 30rpx;
  border: none;
  flex: 1;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(86,171,47,0.10);
}
.modal-cancel {
  background: #eee;
  color: #333;
  border-radius: 16rpx;
  padding: 16rpx 40rpx;
  font-size: 30rpx;
  border: none;
  flex: 1;
  font-weight: bold;
}
.date-picker-view {
  width: 100%;
  color: #333;
  background: #fafaff;
  border: 4rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 20rpx 18rpx;
  font-size: 30rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(160,120,255,0.04);
}
.type-radio-group {
  display: flex;
  gap: 32rpx;
  justify-content: center;
  margin-bottom: 24rpx;
}

.birthday-item {
  background: linear-gradient(90deg, #e0f7fa 0%, #b2ebf2 100%);
  box-shadow: 0 8rpx 24rpx rgba(33, 150, 243, 0.10);
}
.anniversary-item {
  background: linear-gradient(90deg, #f9e6ff 0%, #e0f7fa 100%);
  box-shadow: 0 8rpx 24rpx rgba(160, 120, 255, 0.10);
}
.swipe-row {
  width: 100%;
  height: 100%;
}

.calendar-switch-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  margin-bottom: 8rpx;
}
.calendar-switch-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 12rpx;
}
.calendar-switch-buttons {
  display: flex;
  gap: 8rpx;
}
.calendar-switch-btn {
  font-size: 22rpx;
  color: #888;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  border: 1rpx solid #e0e0e0;
  background: #f7f7f7;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 60rpx;
  text-align: center;
}
.calendar-switch-btn.active {
  color: #fff;
  background: #56ab2f;
  border-color: #56ab2f;
  font-weight: bold;
}

</style> 
