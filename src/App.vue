<script>
import auth from './utils/auth.js'

export default {
  globalData: {
    auth: auth
  },
  
  onLaunch: function () {
    // 初始化登录状态
    this.initGlobalAuth()
  },
  
  onShow: function () {
  },
  
  onHide: function () {
  },
  
  methods: {
    // 初始化全局认证状态
    async initGlobalAuth() {
      try {
        // 检查是否为微信小程序环境
        if (auth.isWechatMiniProgram()) {
          // 可以在这里添加全局的登录状态检查
        } else {
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error)
      }
    }
  }
}
</script>

<style>
/*每个页面公共css */

/* 全局样式 */
page {
  background-color: #f5f5f5;
}

/* 登录相关样式 */
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  width: 80%;
  max-width: 600rpx;
}

.login-title {
  font-size: 36rpx;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40rpx;
  color: #333;
}

.login-btn {
  background: linear-gradient(135deg, #007AFF, #0056CC);
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 32rpx;
  width: 100%;
  margin-top: 20rpx;
}

.login-btn:active {
  opacity: 0.8;
}
</style>
