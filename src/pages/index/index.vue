<template>
  <view class="content">
    <view class="system" :style="{height:statusheight+'px'}"></view>
    <view class="custom-navbar">
      <view class="navbar-greeting-row">
        <image :src="getGreetingIcon()" class="greeting-emoji-img" />
        <text class="navbar-title">{{ greeting }}</text>
      </view>
    </view>
    <view class="date-container">
      <text class="date-day">{{ currentDate.day }}</text>
      <view class="date-info">
        <text class="date-month-year">{{ parseInt(currentDate.month) }}月{{ currentDate.year }}年</text>
        <text class="date-weekday">{{ currentDate.weekday }}</text>
      </view>
      <view class="weather-info">
        <text class="weather-location">{{ weather.location }}</text>
        <text class="weather-temp">{{ weather.temperature }}°C</text>
        <text class="weather-text">{{ weather.text }}</text>
      </view>
    </view>
    <view class="poem-container">
      <image 
        class="poem-image" 
        :src="poemUrl" 
        mode="widthFix" 
        @error="handlePoemError"
        alt="每日诗词" 
      />
    </view>
    <view class="entry-row">
      <view class="message-board" @click="navigateToMessageBoard" role="button" aria-label="留言板">
        <image class="message-icon" src="../../static/icon_messages.svg" mode="aspectFit" alt="留言板图标" />
        <text class="message-text">留言板</text>
      </view>
      <view class="account-entry" @click="navigateToAccount" role="button" aria-label="记账">
        <image class="account-icon" src="../../static/icon_account.png" mode="aspectFit" alt="记账图标" />
        <text class="account-text">存钱罐</text>
      </view>
      <view class="asset-entry" @click="navigateToAsset" role="button" aria-label="资产">
        <image class="asset-icon" src="../../static/asset.png" mode="aspectFit" alt="资产图标" />
        <text class="asset-text">资产</text>
      </view>
    </view>
    <view class="entry-row second-row">
      <view class="memoryday-entry" @click="navigateToMemoryDay" role="button" aria-label="纪念日">
        <image class="memoryday-icon" src="../../static/memory_day.png" mode="aspectFit" alt="纪念日图标" />
        <text class="memoryday-text">纪念日</text>
      </view>
      <view class="lucky-wheel-entry" @click="navigateToLuckyWheel" role="button" aria-label="大转盘">
        <image class="lucky-wheel-icon" src="../../static/lucky_wheel.png" mode="aspectFit" alt="大转盘图标" />
        <text class="lucky-wheel-text">大转盘</text>
      </view>
      <view class="todo-entry" @click="navigateToTodo" role="button" aria-label="待办">
        <image class="todo-icon" src="../../static/todo.png" mode="aspectFit" alt="待办图标" />
        <text class="todo-text">待办</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';

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

const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString();
  const day = date.getDate().toString().padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];

  return {
    year,
    month,
    day,
    weekday
  };
};

const greeting = ref(getGreeting());
const title = ref('Hello');
const currentDate = ref(getCurrentDate());
const weather = reactive({
  location: '加载中...',
  temperature: '--',
  text: '--'
});
const poemUrl = ref('https://v1.jinrishici.com/all.svg?font-size=28&spacing=4'); // 古诗词图片URL
const retryCount = ref(0);
const maxRetries = 3;
const weatherApiKey = 'your_api_key_here'; // 替换为你的API密钥,我这里使用的是心知天气的API
let weatherCache = null;
const weatherCacheTime = 30 * 60 * 1000; // 30分钟缓存
let statusheight = uni.getSystemInfoSync().statusBarHeight



const getGreetingIcon = () => {
  const hour = new Date().getHours();
  if (hour < 6) return '/static/moon.png';
  if (hour < 9) return '/static/morning.png';
  if (hour < 17) return '/static/sun.png';
  if (hour < 19) return '/static/sunset.png';
  return '/static/moon.png';
};

const getLocation = () => {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'wgs84',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

const fetchWeatherData = async (location) => {
  const url = `https://api.seniverse.com/v3/weather/now.json?key=${weatherApiKey}&location=${location.latitude}:${location.longitude}&language=zh-Hans&unit=c`;
  try {
    const response = await uni.request({
      url,
      method: 'GET'
    });
    if (response.statusCode === 200 && response.data.results && response.data.results[0]) {
      const result = response.data.results[0];
      return {
        city: result.location.name,
        temperature: result.now.temperature,
        text: result.now.text
      };
    } else {
      throw new Error('天气数据获取失败');
    }
  } catch (error) {
    throw error;
  }
};

const getWeather = async () => {
  try {
    if (weatherCache && Date.now() - weatherCache.timestamp < weatherCacheTime) {
      Object.assign(weather, weatherCache.data);
      return;
    }

    const location = await getLocation();
    const weatherData = await fetchWeatherData(location);
    
    weather.location = weatherData.city;
    weather.temperature = weatherData.temperature;
    weather.text = weatherData.text;

    weatherCache = {
      data: { ...weather },
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('获取天气失败:', error);
    weather.location = '获取天气失败';
    weather.temperature = '--';
    weather.text = '--';
  }
};

const handlePoemError = (err) => {
  console.error('古诗词图片加载失败', err);
  if (retryCount.value < maxRetries) {
    retryCount.value++;
    setTimeout(() => {
      poemUrl.value = `https://v1.jinrishici.com/all.svg?font-size=28&spacing=4&t=${Date.now()}`;
    }, 1000);
  } else {
    poemUrl.value = '';
  }
};

const preloadPoemImage = () => {
  // const img = new Image();
  // img.src = poemUrl.value;
};

const navigateToMessageBoard = () => {
  uni.navigateTo({
    url: '/pages/message-board/message-board'
  });
};

const navigateToAccount = () => {
  uni.navigateTo({
    url: '/pages/account/account'
  });
};

const navigateToAsset = () => {
  uni.navigateTo({
    url: '/pages/asset/asset'
  });
};

const navigateToMemoryDay = () => {
  uni.navigateTo({
    url: '/pages/memory-day/memory-day'
  });
};

const navigateToLuckyWheel = () => {
  uni.navigateTo({
    url: '/pages/lucky-wheel/lucky-wheel'
  });
};

const navigateToTodo = () => {
  uni.navigateTo({
    url: '/pages/todo/todo'
  });
};



onLoad(() => {
  getWeather();
  preloadPoemImage();
});

onShow(() => {
  greeting.value = getGreeting();
});
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

.custom-navbar {
  width: 100%;
  /* 高度、padding-top、背景、阴影、居中、适配安全区由js动态设置 */
  box-sizing: border-box;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-greeting-row {
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: 30rpx;
}

.navbar-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.date-container {
  align-items: center;
  display: flex;
  justify-content: flex-start;
  margin-bottom: 30rpx;
  margin-top: 30rpx;
  width: 100%;
  padding-left: 10%;
  padding-right: 10%;
  box-sizing: border-box;
}

.date-day {
  font-size: 72rpx;
  font-weight: bold;
  color: #4CAF50;
  margin-right: 20rpx;
}

.date-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 72rpx;
}

.date-month-year {
  font-size: 28rpx;
  color: #666;
}

.date-weekday {
  font-size: 42rpx;
  font-weight: bold;
  color: #333;
}

.weather-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 72rpx;
  text-align: right;
  margin-left: auto;
  margin-right: 10%;
  flex-shrink: 0;
}

.weather-location {
  font-size: 28rpx;
  color: #666;
}

.weather-temp {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.weather-text {
  font-size: 28rpx;
  color: #666;
}

.poem-container {
  margin-top: 40rpx;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 10%;
  box-sizing: border-box;
}

.poem-image {
  width: 100%;
  max-width: 600rpx;
  background-color: #f9f9f9;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  padding: 20rpx;
}

.entry-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;
  width: 90%;
  margin-top: 40rpx;
  gap: 40rpx;
}

.second-row {
  margin-top: 20rpx;
  justify-content: flex-start;
  gap: 40rpx;
}

.memoryday-entry {
  margin-left: 0;
}

.message-board, .account-entry, .asset-entry, .memoryday-entry, .lucky-wheel-entry, .todo-entry {
  width: 20%;
  aspect-ratio: 1 / 1;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(76, 175, 80, 0.15);
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2rpx solid #e8f5e8;
  position: relative;
  overflow: hidden;
}

.message-board::before, .account-entry::before, .asset-entry::before, .memoryday-entry::before, .lucky-wheel-entry::before, .todo-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
}

.message-board:hover, .account-entry:hover, .asset-entry:hover, .memoryday-entry:hover, .lucky-wheel-entry:hover, .todo-entry:hover {
  transform: translateY(-4rpx) scale(1.02);
  box-shadow: 0 8rpx 24rpx rgba(76, 175, 80, 0.25);
  border-color: #4CAF50;
}

.message-icon, .account-icon, .asset-icon, .memoryday-icon, .lucky-wheel-icon, .todo-icon {
  width: 60rpx;
  height: 60rpx;
  margin-bottom: 15rpx;
  filter: hue-rotate(120deg) saturate(1.2);
}

.message-text, .account-text, .asset-text, .memoryday-text, .lucky-wheel-text, .todo-text {
  font-size: 28rpx;
  color: #333;
}

.greeting-emoji-img {
  width: 100rpx;
  height: 100rpx;
  margin-right: 12rpx;
  vertical-align: middle;
}
</style>