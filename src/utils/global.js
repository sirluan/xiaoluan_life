// 全局配置文件
// 定义全局变量和配置

// 应用配置
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: 'Life',
  
  // 版本号
  VERSION: '1.0.0',
  
  // 环境配置
  ENV: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production'
  },
  
  // 当前环境
  CURRENT_ENV: process.env.NODE_ENV || 'development'
}

// API 配置
export const API_CONFIG = {
  // 基础URL
  BASE_URL: 'your_base_url_here', // 替换为你的实际基础后端URL
  // 超时时间
  TIMEOUT: 10000,
  
  // 请求头
  HEADERS: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

// 存储键名
export const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  SECRET_KEY: 'secretKey',
  IS_LOGGED_IN: 'isLoggedIn',
  USER_ID: 'userId',
  TOKEN: 'token'
}

// 页面路径
export const PAGE_PATHS = {
  HOME: '/pages/home/home',
  ACCOUNT: '/pages/account/account',
  NOTES: '/pages/notes/notes',
  MESSAGE_BOARD: '/pages/message-board/message-board',
  ASSET: '/pages/asset/asset',
  MEMORY_DAY: '/pages/memory-day/memory-day'
}

// 全局工具函数
export const GLOBAL_UTILS = {
  // 获取用户ID
  getUserId() {
    return uni.getStorageSync(STORAGE_KEYS.USER_ID)
  },
  
  // 获取用户信息
  getUserInfo() {
    return uni.getStorageSync(STORAGE_KEYS.USER_INFO)
  },
  
  // 检查是否已登录
  isLoggedIn() {
    return uni.getStorageSync(STORAGE_KEYS.IS_LOGGED_IN) === true
  },
  
  // 显示提示
  showToast(title, icon = 'none') {
    uni.showToast({
      title,
      icon
    })
  },
  
  // 显示加载
  showLoading(title = '加载中...') {
    uni.showLoading({
      title
    })
  },
  
  // 隐藏加载
  hideLoading() {
    uni.hideLoading()
  },
  
  // 格式化日期
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    const second = String(d.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second)
  }
}

// 导出默认配置
export default {
  APP_CONFIG,
  API_CONFIG,
  STORAGE_KEYS,
  PAGE_PATHS,
  GLOBAL_UTILS
} 