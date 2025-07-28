<template>
  <view class="home-container">
    <!-- 用户信息区域 -->
    <view class="profile-section" @click="showLoginModal">
      <image class="avatar" :src="safeAvatarUrl" mode="aspectFill" />
      <view class="nickname">{{ userNickname }}</view>
      <view class="login-status">{{ loginStatusText }}</view>
    </view>

    <!-- 登录弹窗 -->
    <view v-if="showModal && !isLoggedIn" class="modal-overlay" @click="closeModal">
      <view class="modal-content" :class="{ 'modal-content-show': showModal }" @click.stop>
        <view class="modal-header">
          <text class="modal-title">用户登录</text>
          <view class="modal-close" @click="closeModal">×</view>
        </view>
        
        <view class="modal-body">
          <!-- 头像选择 -->
          <view class="form-item">
            <text class="form-label">头像</text>
            <button class="avatar-select-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
              <image class="avatar-select-preview" :src="safeAvatarUrl" mode="aspectFill" />
              <text class="avatar-select-text">选择头像</text>
            </button>
          </view>
          
          <!-- 昵称输入 -->
          <view class="form-item">
            <text class="form-label">昵称</text>
            <input class="form-input" type="nickname" placeholder="请输入昵称" :value="modalNickname" @input="onInputNickname" />
          </view>
          
          <!-- 密钥输入 -->
          <view class="form-item">
            <text class="form-label">密钥</text>
            <view class="secret-input-wrapper">
              <input class="form-input secret-input" :type="showSecretKey ? 'text' : 'password'" placeholder="这是您的登录凭证" :value="modalSecretKey" @input="onInputSecretKey" />
              <view class="secret-toggle" @click="toggleSecretKey">
                <text class="secret-icon">{{ showSecretKey ? '👁️' : '👁️‍🗨️' }}</text>
              </view>
            </view>
            <text class="form-tip">请设置复杂一点的密钥</text>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-confirm-btn" @click="handleLogin" :disabled="!safeAvatarUrl || !modalNickname || !modalSecretKey">
            <text>确认登录</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 退出登录弹窗 -->
    <view v-if="showLogoutModal" class="modal-overlay" @click="closeLogoutModal">
      <view class="modal-content logout-modal" :class="{ 'modal-content-show': showLogoutModal }" @click.stop>
        <view class="modal-header">
          <text class="modal-title">退出登录</text>
          <view class="modal-close" @click="closeLogoutModal">×</view>
        </view>
        
        <view class="modal-body">
          <view class="logout-content">
            <image class="logout-avatar" :src="safeAvatarUrl" mode="aspectFill" />
            <text class="logout-nickname">{{ userNickname }}</text>
            <text class="logout-text">确定要退出登录吗？</text>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="modal-cancel-btn" @click="closeLogoutModal">
            <text>取消</text>
          </button>
          <button class="modal-confirm-btn" @click="handleLogout">
            <text>确认退出</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import request from '../../utils/request.js'

export default {
  data() {
    return {
      showModal: false,
      showLogoutModal: false,
      modalAvatar: '',
      modalNickname: '',
      modalSecretKey: '',
      showSecretKey: false, // 控制密钥显示/隐藏
      isLoggedIn: false,
      userInfo: null,
      loginCode: '', // 存储登录凭证
      userId: null // 存储用户ID
    }
  },
  
  computed: {
    userAvatar() {
      return this.userInfo?.avatarUrl || '../../static/avatar_default.png'
    },
    
    userNickname() {
      return this.userInfo?.nickName || '未登录'
    },
    
    loginStatusText() {
      return this.isLoggedIn ? '已登录' : '点击登录'
    },
    
    // 安全的头像URL
    safeAvatarUrl() {
      const avatar = this.modalAvatar || this.userInfo?.avatarUrl
      return avatar || '../../static/avatar_default.png'
    }
  },
  
  methods: {
    // 显示登录弹窗
    showLoginModal() {
      if (this.isLoggedIn) {
        // 已登录，显示退出登录弹窗
        this.showLogoutModal = true
      } else {
        // 未登录，显示登录弹窗
        this.showModal = true
      }
    },
    
    // 关闭弹窗
    closeModal() {
      this.showModal = false
      // 清空临时数据
      this.modalAvatar = ''
      this.modalNickname = ''
      this.modalSecretKey = ''
      this.showSecretKey = false
    },
    
    // 关闭退出登录弹窗
    closeLogoutModal() {
      this.showLogoutModal = false
    },
    
    // 处理退出登录
    handleLogout() {
      // 清除本地存储
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('secretKey')
      uni.removeStorageSync('isLoggedIn')
      uni.removeStorageSync('userId')
      
      // 重置本地组件状态
      this.userInfo = null
      this.isLoggedIn = false
      this.userId = null
      this.modalAvatar = ''
      this.modalNickname = ''
      this.modalSecretKey = ''
      this.showSecretKey = false
      
      // 关闭弹窗
      this.closeLogoutModal()
      
      // 显示提示
      uni.showToast({
        title: '已退出登录',
        icon: 'success'
      })
    },
    
    // 选择头像
    onChooseAvatar(e) {

      
      if (e.detail.avatarUrl) {
        // 检查文件路径格式
        const filePath = e.detail.avatarUrl

        
        // 尝试将文件转换为base64
        this.convertToBase64(filePath)
      } else {
        uni.showToast({ title: '头像获取失败', icon: 'none' })
      }
    },
    
    // 将文件转换为base64
    convertToBase64(filePath) {
      uni.showLoading({ title: '处理中...' })
      
      // 读取文件并转换为base64
      uni.getFileSystemManager().readFile({
        filePath: filePath,
        encoding: 'base64',
        success: (res) => {
          uni.hideLoading()
          
          
          // 使用base64显示图片
          this.modalAvatar = 'data:image/jpeg;base64,' + res.data
          uni.showToast({ title: '头像选择成功', icon: 'success' })
        },
        fail: (error) => {
          uni.hideLoading()
          console.error('文件读取失败:', error)
          
          // 如果读取失败，尝试上传到服务器
          this.uploadToServer(filePath)
        }
      })
    },
    
    // 上传到服务器
    uploadToServer(filePath) {
      uni.showLoading({ title: '上传中...' })
      
      uni.uploadFile({
        url: '/api/upload-avatar',
        filePath: filePath,
        name: 'avatar',
        success: (uploadRes) => {
          uni.hideLoading()
          
          
          try {
            const result = JSON.parse(uploadRes.data)
            if (result.success) {
              this.modalAvatar = result.avatarUrl
              uni.showToast({ title: '头像上传成功', icon: 'success' })
            } else {
              uni.showToast({ title: result.message || '上传失败', icon: 'none' })
            }
          } catch (error) {
            console.error('解析上传响应失败:', error)
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        },
        fail: (error) => {
          uni.hideLoading()
          console.error('上传失败:', error)
          
          // 如果上传也失败，使用临时路径（仅用于开发测试）
          console.warn('使用临时文件路径进行测试')
          this.modalAvatar = filePath
          uni.showToast({ title: '头像选择成功（开发模式）', icon: 'success' })
        }
      })
    },
    
    // 输入昵称
    onInputNickname(e) {

      this.modalNickname = e.detail.value
    },
    
    // 输入密钥
    onInputSecretKey(e) {

      this.modalSecretKey = e.detail.value
    },
    
    // 切换密钥显示/隐藏
    toggleSecretKey() {
      this.showSecretKey = !this.showSecretKey
    },
    
    // 处理登录
    handleLogin() {
      if (!this.safeAvatarUrl || !this.modalNickname || !this.modalSecretKey) {
        uni.showToast({ title: '请选择头像、输入昵称和密钥', icon: 'none' })
        return
      }
      
      // 验证密钥复杂度
      if (this.modalSecretKey.length < 6) {
        uni.showToast({ title: '密钥至少需要6位字符', icon: 'none' })
        return
      }
      
      // 获取微信登录凭证
      uni.login({
        provider: 'weixin',
        success: (loginRes) => {
          
          
          // 调用后端登录接口，使用密钥作为主要凭证
          this.callLoginAPI(this.modalSecretKey, this.modalNickname, this.safeAvatarUrl)
        },
        fail: (err) => {
          console.error('获取登录凭证失败:', err)
          uni.showToast({ title: '登录失败', icon: 'none' })
        }
      })
    },
    
    // 调用后端登录接口
    callLoginAPI(secretKey, nickname, avatar) {
      request({
        url: '/api/login',
        method: 'POST',
        data: {
          secret_key: secretKey, // 使用密钥作为主要凭证
          nickname: nickname,
          avatar: avatar
        }
      }).then((res) => {
        
        
        if (res.data.success) {
          // 登录成功
          this.userInfo = {
            avatarUrl: this.safeAvatarUrl,
            nickName: nickname
          }
          this.isLoggedIn = true
          
          // 保存到本地存储
          uni.setStorageSync('userInfo', this.userInfo)
          uni.setStorageSync('secretKey', this.modalSecretKey)
          uni.setStorageSync('isLoggedIn', true)
          uni.setStorageSync('userId', res.data.user_id)
          
          // 同时更新本地组件状态
          this.userId = res.data.user_id
          
          uni.showToast({ 
            title: res.data.message || '登录成功', 
            icon: 'success' 
          })
          this.closeModal()
        } else {
          // 登录失败
          uni.showToast({ 
            title: res.data.message || '登录失败', 
            icon: 'none' 
          })
        }
      }).catch((err) => {
        console.error('调用登录接口失败:', err)
        uni.showToast({ title: '网络错误，请重试', icon: 'none' })
      })
    }
  },
  
  onLoad() {
    // 从本地存储恢复登录状态
    const savedUserInfo = uni.getStorageSync('userInfo')
    const savedIsLoggedIn = uni.getStorageSync('isLoggedIn')
    const savedUserId = uni.getStorageSync('userId')
    const savedSecretKey = uni.getStorageSync('secretKey')
    
    if (savedUserInfo && savedIsLoggedIn) {
      this.userInfo = savedUserInfo
      this.isLoggedIn = true
      this.userId = savedUserId
      this.loginCode = savedSecretKey // 使用密钥作为登录凭证
    }
  },

  // 微信小程序分享功能
  onShareAppMessage() {
    return {
      title: '我的主页 - 个人中心',
      path: '/pages/home/home',
      imageUrl: '/static/logo.png'
    }
  },

  onShareTimeline() {
    return {
      title: '我的主页 - 个人中心',
      query: '',
      imageUrl: '/static/logo.png'
    }
  }
}
</script>

<style>
.home-container {
  height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.profile-section:hover {
  transform: scale(1.05);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #4CAF50;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
  margin-bottom: 20rpx;
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
}

.nickname {
  font-size: 32rpx;
  color: #2e7d32;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.login-status {
  font-size: 24rpx;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1000;
  padding-bottom: 20rpx;
}

.modal-content {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  width: 100%;
  height: 70vh;
  padding: 40rpx;
  box-shadow: 0 -10rpx 30rpx rgba(0, 0, 0, 0.3);
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.modal-content-show {
  transform: translateY(0);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e8f5e8;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #2e7d32;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
  padding: 10rpx;
}

.modal-close:hover {
  color: #666;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #2e7d32;
  margin-bottom: 12rpx;
}

.avatar-select-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8faf8;
  border: 2rpx solid #e8f5e8;
  border-radius: 16rpx;
  padding: 20rpx;
  transition: all 0.3s ease;
}

.avatar-select-btn:hover {
  border-color: #4CAF50;
  background: #e8f5e8;
}

.avatar-select-preview {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2rpx solid #4CAF50;
  margin-bottom: 8rpx;
}

.avatar-select-text {
  font-size: 24rpx;
  color: #4CAF50;
}

.form-input {
  width: 100%;
  padding: 20rpx;
  border: 2rpx solid #e8f5e8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #333;
  background: #f8faf8;
  transition: all 0.3s ease;
}

.form-input:focus {
  border-color: #4CAF50;
  background: white;
}

.form-input::placeholder {
  color: #999;
}

.form-tip {
  display: block;
  font-size: 24rpx;
  color: #ff9800;
  margin-top: 8rpx;
  font-style: italic;
}

.secret-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.secret-input {
  flex: 1;
  padding-right: 80rpx;
}

.secret-toggle {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.secret-toggle:hover {
  background: rgba(76, 175, 80, 0.1);
}

.secret-icon {
  font-size: 32rpx;
  color: #4CAF50;
}

.modal-footer {
  margin-top: 5rpx;
  display: flex;
  justify-content: center;
}

.modal-confirm-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.3);
}

.modal-confirm-btn:hover:not(:disabled) {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.4);
}

.modal-confirm-btn:disabled {
  background: #ccc;
  color: #999;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 退出登录弹窗样式 */
.logout-modal {
  height: 40vh;
}

.logout-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx 0;
}

.logout-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid #4CAF50;
  margin-bottom: 20rpx;
}

.logout-nickname {
  font-size: 32rpx;
  color: #2e7d32;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.logout-text {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

.modal-cancel-btn {
  background: #f5f5f5;
  color: #666;
  padding: 20rpx 40rpx;
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
  margin-right: 20rpx;
}

.modal-cancel-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2rpx);
}
</style>
