// 微信小程序登录工具类
class Auth {
  constructor() {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.token = null;
    
    // 初始化时从本地存储恢复用户信息
    this.restoreFromStorage();
  }
  
  // 从本地存储恢复用户信息
  restoreFromStorage() {
    try {
      const token = uni.getStorageSync('token');
      const userInfo = uni.getStorageSync('userInfo');
      
      if (token && userInfo) {
        this.token = token;
        this.userInfo = userInfo;
        this.isLoggedIn = true;
      }
    } catch (error) {
      console.error('恢复用户信息失败:', error);
    }
  }

  // 检查是否为微信小程序环境
  isWechatMiniProgram() {
    // #ifdef MP-WEIXIN
    return true;
    // #endif
    // #ifndef MP-WEIXIN
    return false;
    // #endif
  }

  // 自动登录（检查本地存储）
  async autoLogin() {
    if (!this.isWechatMiniProgram()) {
      return false;
    }

    // 从本地存储恢复用户信息
    this.restoreFromStorage();
    
    if (this.isLoggedIn && this.userInfo) {
      return true;
    }
    
    // 如果没有本地存储的用户信息，尝试获取登录凭证
    try {
      const loginResult = await this.getWechatCode();
      if (loginResult.success) {
        this.token = 'wechat_token_' + Date.now();
        uni.setStorageSync('token', this.token);
        return false; // 返回false表示需要用户主动授权
      }
    } catch (error) {
      console.error('自动登录失败:', error);
    }
    
    return false;
  }

  // 获取微信登录凭证
  getWechatCode() {
    return new Promise((resolve) => {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          resolve({
            success: true,
            code: res.code
          });
        },
        fail: (err) => {
          console.error('获取登录凭证失败:', err);
          resolve({
            success: false,
            message: err.errMsg || '获取登录凭证失败'
          });
        }
      });
    });
  }

  // 退出登录
  logout() {
    this.isLoggedIn = false;
    this.userInfo = null;
    this.token = null;
    
    // 清除本地存储
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
    
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  }

  // 获取登录状态
  getLoginStatus() {
    // 确保从本地存储恢复最新状态
    this.restoreFromStorage();
    
    return {
      isLoggedIn: this.isLoggedIn,
      userInfo: this.userInfo,
      isWechat: this.isWechatMiniProgram()
    };
  }

  // 获取用户信息
  getUserInfo() {
    // 确保从本地存储恢复最新状态
    this.restoreFromStorage();
    return this.userInfo;
  }
}

// 创建单例实例
const auth = new Auth();

export default auth; 