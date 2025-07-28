<template>
  <view style="padding: 20px; display: flex; flex-direction: column; align-items: center;">
    <l-dialer :prizeList="prizeList" :style-opt="styleOpt" @click="onClick" @done="onDone" ref="dialer" />
    <view style="width: 100%; max-width: 500px; text-align: left; color: #888; font-size: 15px; margin-bottom: 4px;">每行代表一个选项</view>
    <textarea v-model="inputOptions" class="pretty-input" placeholder="每行一个选项" />
    <button @click="onClick" :disabled="prizeList.length === 0" style="width: 100%; max-width: 500px; margin-bottom: 10px; display: block;">开始</button>
  </view>
</template>

<script>
const colorList = ['#f39c12', '#27ae60', '#2980b9', '#8e44ad', '#e67e22', '#16a085', '#c0392b', '#2c3e50'];
export default {
    data() {
        return {
            inputOptions: '选项1\n选项2\n选项3',
            
            styleOpt: {
                sectorBorderColor: '#fff', // 扇区边框颜色
                sectorBgColor: '#f5f5f5',  // 默认扇区背景色
                prizeBgColors: colorList,
                fontSize: '36rpx', // 扇区文字大小
                fontColor: '#fff'   // 扇区文字颜色
            }
        };
    },
    computed: {
        prizeList() {
            // 可选：每个条目单独设置prizeColor
            const items = this.inputOptions.split('\n').map(v => v.trim()).filter(v => v);
            return items.map((name, idx) => ({
                id: 'item' + idx,
                name,
                prizeColor: colorList[idx % colorList.length]
            }));
        }
    },
    methods: {
        onDone(index) {
            const prize = this.prizeList[index];
            uni.showModal({
                title: '结果',
                content: prize ? prize.name : ''
            });
        },
        onClick() {
            if (this.prizeList.length === 0) return;
            // 随机抽取一个索引
            const idx = Math.floor(Math.random() * this.prizeList.length);
            this.$refs.dialer.run(idx);
        }
    },

    // 微信小程序分享功能
    onShareAppMessage() {
        return {
            title: '大转盘 - 随机选择工具',
            path: '/pages/lucky-wheel/lucky-wheel',
            imageUrl: '/static/lucky_wheel.png'
        }
    },

    onShareTimeline() {
        return {
            title: '大转盘 - 随机选择工具',
            query: '',
            imageUrl: '/static/lucky_wheel.png'
        }
    }
}
</script>

<style>
.pretty-input {
  width: 100%;
  max-width: 500px;
  height: 100px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 18px 20px;
  font-size: 18px;
  border: 1.5px solid #e0e6ed;
  box-shadow: 0 4px 16px rgba(60,60,60,0.06);
  margin: 20px 0;
  resize: none;
  outline: none;
  transition: border 0.2s;
}
.pretty-input:focus {
  border: 1.5px solid #4f8cff;
  background: #f0f6ff;
}
</style>
