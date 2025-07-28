<template>
  <view class="add-record-container">
    <!-- Loading 遮罩 -->
    <view v-if="loading" class="loading-mask">
      <view class="loading-content">
        <uni-load-more status="loading" :content-text="{ contentdown: '加载中...' }" />
      </view>
    </view>

    <view class="form-group">
      <view class="form-item">
        <text class="form-label">日期</text>
        <picker mode="date" :value="date" @change="handleDateChange">
          <view class="picker-value">{{ date }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">备注</text>
        <input type="text" v-model="remark" class="form-input" placeholder="请输入备注" />
      </view>
    </view>

    <view class="type-grid">
      <view v-for="type in typeGrid" :key="type.name" class="type-grid-item" @click="addRecordByType(type.name)">
        <image :src="type.icon" class="type-grid-icon" />
        <text class="type-grid-text">{{ type.name }}</text>
      </view>
    </view>

    <!-- 账单条目列表 -->
    <view class="records-list">
      <view v-for="(item, index) in records" :key="index" class="record-item">
        <view class="record-type">
          <picker :range="paymentTypes" @change="(e) => handleTypeChange(e, index)">
            <view class="type-picker">
              <image :src="getPaymentIcon(item.type)" class="type-icon" />
              <text>{{ item.type }}</text>
            </view>
          </picker>
          <view v-if="item.type === '其他' || item.type === '银行卡'" class="custom-type">
            <input 
              type="text" 
              v-model="item.customType" 
              class="custom-input" 
              :placeholder="item.type === '银行卡' ? '请输入银行卡名称' : '自定义类型'"
            />
          </view>
        </view>
        <view class="record-amount">
          <input 
            type="digit" 
            v-model="item.amount" 
            class="amount-input" 
            placeholder="金额" 
          />
        </view>
        <view class="delete-btn" @click="deleteRecord(index)">
          <text class="delete-icon">×</text>
        </view>
      </view>
    </view>

    <button class="submit-btn" @click="handleSubmit">保存</button>
  </view>
</template>

<script>
import request from '@/utils/request.js'

export default {
  data() {
    return {
      loading: false,
      paymentTypes: [],
      paymentTypeMap: {},
      date: new Date().toISOString().split('T')[0],
      remark: '',
      records: [
        {
          type: '微信',
          customType: '',
          amount: ''
        }
      ],
      typeGrid: [
        { name: '微信', icon: '/static/wechat.png' },
        { name: '支付宝', icon: '/static/alipay.png' },
        { name: '银行卡', icon: '/static/bank_card.png' },
        { name: '其他', icon: '/static/money.png' }
      ]
    }
  },
  onLoad() {
    this.fetchPaymentTypes();
    this.fetchLastRecord();
  },
  methods: {
    // 获取支付类型配置
    async fetchPaymentTypes() {
      try {
        this.loading = true
        const res = await request({
          url: '/api/account/payment-types',
          method: 'GET'
        })
        
        if (res.data.code === 0) {
          const types = res.data.data.types
          // 只使用预定义的四种类型
          const allowedTypes = ['微信', '支付宝', '银行卡', '其他']
          this.paymentTypes = allowedTypes
          
          // 创建支付类型映射，只包含允许的类型
          this.paymentTypeMap = {}
          allowedTypes.forEach(typeName => {
            const serverType = types.find(t => t.name === typeName)
            if (serverType) {
              this.paymentTypeMap[typeName] = serverType
            } else {
              // 如果服务器没有该类型，创建默认配置
              this.paymentTypeMap[typeName] = {
                name: typeName,
                needCustom: typeName === '银行卡' || typeName === '其他'
              }
            }
          })
        } else {
          // 如果获取失败，使用默认的四种类型
          this.paymentTypes = ['微信', '支付宝', '银行卡', '其他']
          this.paymentTypeMap = {
            '微信': { name: '微信', needCustom: false },
            '支付宝': { name: '支付宝', needCustom: false },
            '银行卡': { name: '银行卡', needCustom: true },
            '其他': { name: '其他', needCustom: true }
          }
        }
      } catch (error) {
        // 如果网络错误，使用默认的四种类型
        this.paymentTypes = ['微信', '支付宝', '银行卡', '其他']
        this.paymentTypeMap = {
          '微信': { name: '微信', needCustom: false },
          '支付宝': { name: '支付宝', needCustom: false },
          '银行卡': { name: '银行卡', needCustom: true },
          '其他': { name: '其他', needCustom: true }
        }
      } finally {
        this.loading = false
      }
    },
    async fetchLastRecord() {
      try {
        const res = await request({
          url: '/api/account/records',
          method: 'GET',
          data: { page: 1, page_size: 1 }
        });

        if (res.data.code === 0 && res.data.data.records.length > 0) {
          const last = res.data.data.records[0];
          if (last.details && last.details.length > 0) {
            this.records = last.details.map(item => ({
              type: item.type,
              customType: item.custom_type || '',
              amount: item.amount ? String(item.amount) : ''
            }));
          }
        }
      } catch (e) {
        // 忽略错误，保持默认
      }
    },
    handleTypeChange(e, index) {
      const type = this.paymentTypes[e.detail.value]
      this.records[index].type = type
      const typeConfig = this.paymentTypeMap[type]
      if (!typeConfig?.needCustom) {
        this.records[index].customType = ''
      }
    },
    handleDateChange(e) {
      this.date = e.detail.value
    },
    addNewRecord() {
      this.records.push({
        type: '微信',
        customType: '',
        amount: ''
      })
    },
    deleteRecord(index) {
      if (this.records.length > 1) {
        this.records.splice(index, 1)
      } else {
        uni.showToast({
          title: '至少保留一个条目',
          icon: 'none'
        })
      }
    },
    getPaymentIcon(type) {
      switch (type) {
        case '微信':
          return '/static/wechat.png'
        case '支付宝':
          return '/static/alipay.png'
        case '银行卡':
          return '/static/bank_card.png'
        default:
          return '/static/money.png'
      }
    },
    validateRecords() {
      for (const record of this.records) {
        if (!record.amount) {
          uni.showToast({
            title: '请填写所有金额',
            icon: 'none'
          })
          return false
        }
        const typeConfig = this.paymentTypeMap[record.type]
        if (typeConfig?.needCustom && !record.customType) {
          uni.showToast({
            title: record.type === '银行卡' ? '请填写银行卡名称' : '请填写自定义类型',
            icon: 'none'
          })
          return false
        }
      }
      return true
    },
    async handleSubmit() {
      if (!this.validateRecords()) return

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const dateTime = `${this.date} ${timeStr}`;
      const submitData = {
        date: dateTime,
        remark: this.remark,
        records: this.records.map(record => ({
          type: record.type,
          customType: record.customType,
          amount: parseFloat(record.amount)
        }))
      }
      
      try {
        this.loading = true
        const res = await request({
          url: '/api/account/record',
          method: 'POST',
          data: submitData
        })

        if (res.data.code === 0) {
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              setTimeout(() => {
                uni.navigateBack()
              }, 2000)
            }
          })
        } else {
          uni.showToast({
            title: res.data.message || '保存失败',
            icon: 'none'
          })
        }
      } catch (error) {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },
    addRecordByType(type) {
      this.records.push({
        type,
        customType: '',
        amount: ''
      })
    }
  }
}
</script>

<style>
.add-record-container {
  padding: 32rpx;
  background: #f8f8f8;
  min-height: 100vh;
}

.form-group {
  background: #fff;
  border-radius: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #333;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.picker-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.records-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-type {
  flex: 2;
  margin-right: 24rpx;
}

.type-picker {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #333;
}

.type-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 8rpx;
}

.custom-type {
  margin-top: 16rpx;
}

.custom-input {
  font-size: 28rpx;
  color: #333;
  border-bottom: 1px solid #eee;
  padding: 8rpx 0;
}

.record-amount {
  flex: 1;
}

.amount-input {
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.delete-btn {
  padding: 0 16rpx;
}

.delete-icon {
  font-size: 40rpx;
  color: #999;
  font-weight: bold;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(90deg, #a8e063 0%, #56ab2f 100%);
  color: #fff;
  font-size: 32rpx;
  border-radius: 44rpx;
  border: none;
}

.submit-btn:active {
  opacity: 0.9;
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

.type-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16rpx 24rpx;
  margin-bottom: 16rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 16rpx 0 16rpx;
}
.type-grid-item {
  width: 28%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16rpx;
  cursor: pointer;
}
.type-grid-icon {
  width: 44rpx;
  height: 44rpx;
  margin-bottom: 4rpx;
}
.type-grid-text {
  font-size: 22rpx;
  color: #333;
}
</style> 