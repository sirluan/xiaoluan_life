const BASE_URL = 'your_base_url_here' // 替换为你的实际基础后端URL
// 请求拦截器
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取全局用户ID - 直接从本地存储获取，避免循环依赖
    const userId = uni.getStorageSync('userId')
    
    // 处理请求数据，自动添加user_id
    let requestData = options.data || {}
    
    // 如果是GET或DELETE请求，将user_id添加到URL参数中
    if (options.method === 'GET' || options.method === 'get' || options.method === 'DELETE' || options.method === 'delete') {
      if (userId) {
        // 判断原url是否已有参数
        const hasQuery = options.url.includes('?')
        options.url = options.url + (hasQuery ? '&' : '?') + 'user_id=' + encodeURIComponent(userId)
      }
    } else {
      // 如果是POST/PUT请求，将user_id添加到请求体中
      if (userId && !requestData.user_id) {
        requestData.user_id = userId
      }
    }
    
    const requestOptions = {
      ...options,
      url: `${BASE_URL}${options.url}`,
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...options.header
      },
      success: (response) => {
        if (response.statusCode === 200) {
          resolve(response)
        } else {
          uni.showToast({
            title: response.data?.message || '请求失败',
            icon: 'none'
          })
          reject(response)
        }
      },
      fail: (error) => {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(error)
      }
    }
    uni.request(requestOptions)
  })
}

export default request 