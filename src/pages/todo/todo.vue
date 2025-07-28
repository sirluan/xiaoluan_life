<template>
	<view class="todo-group-list">
		<view v-for="(group, gIdx) in groups" :key="group.key" class="todo-group">
			<view class="group-header" :style="{background: group.color}" @click="toggleGroup(gIdx)">
				<text class="group-title">{{ group.title }}</text>
				<image class="arrow" :class="{ open: group.open }" src="/static/back.png" />
			</view>
			<view v-if="group.open" class="group-tasks">
				<view v-for="(task, tIdx) in group.tasks" :key="task.id" class="todo-item">
					<image v-if="task.status === 'done'" class="checkmark-icon" src="/static/currect.png" @click.stop="toggleTaskStatus(task, gIdx, tIdx)" />
					<view v-else class="checkbox" :class="{ checked: task.status === 'done' }" @click.stop="toggleTaskStatus(task, gIdx, tIdx)"></view>
					<view class="todo-text-wrap">
						<view class="text-container">
							<text class="todo-text" :class="{ done: task.status === 'done' }">{{ task.content }}</text>
							<view class="strike-line" :class="{ show: task.status === 'done' }"></view>
						</view>
					</view>
					<view v-if="isDeleteMode" class="delete-icon" @click.stop="deleteTask(task, gIdx, tIdx)">×</view>
					<view v-if="isEditMode" class="edit-controls">
						<view class="arrow-up" @click.stop="moveTaskUp(task, gIdx, tIdx)" v-if="gIdx > 0">↑</view>
						<view class="arrow-down" @click.stop="moveTaskDown(task, gIdx, tIdx)" v-if="gIdx < 3">↓</view>
					</view>
				</view>
				<view v-if="group.tasks.length === 0" class="empty-tips">暂无任务</view>
			</view>
		</view>
		
		<!-- 悬浮按钮组 -->
		<view class="floating-buttons">
			<!-- 功能按钮 -->
			<view class="action-btn add-btn" :class="{ show: isExpanded }" @click="handleAdd">
				<text>添加</text>
			</view>
			<view class="action-btn edit-btn" :class="{ show: isExpanded }" @click="handleEdit">
				<text>修改</text>
			</view>
			<view class="action-btn delete-btn" :class="{ show: isExpanded }" @click="handleDelete">
				<text>删除</text>
			</view>
			
			<!-- 主按钮 -->
			<view class="main-btn" :class="{ expanded: isExpanded }" @click="toggleExpanded">
				<text class="plus-icon">+</text>
			</view>
		</view>

		<!-- 添加任务弹窗 -->
		<view v-if="showAddDialog" class="modal-overlay" @click="cancelAdd">
			<view class="add-dialog" @click.stop>
				<view class="dialog-title">添加任务</view>
				<input v-model="newTaskContent" class="add-input" placeholder="请输入任务内容" />
				<picker mode="selector" :range="groupDefs" range-key="title" :value="newTaskClassIndex" @change="onClassChange" class="add-class-picker">
					<view class="picker-view">
						{{ groupDefs[newTaskClassIndex] ? groupDefs[newTaskClassIndex].title : '选择优先级' }}
					</view>
				</picker>
				<view class="add-dialog-btns">
					<button @click="cancelAdd">取消</button>
					<button type="primary" @click="confirmAdd">添加</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick } from 'vue';
import { onPullDownRefresh } from '@dcloudio/uni-app';
import request from '@/utils/request';

const isExpanded = ref(false);
const isDeleteMode = ref(false);
const isEditMode = ref(false);
const showAddDialog = ref(false);
const newTaskContent = ref('');
const newTaskClassIndex = ref(0);

const groupDefs = [
	{ key: 'p0', title: '重要且紧急', color: '#ff4d4f' },
	{ key: 'p1', title: '重要不紧急', color: '#ffd666' },
	{ key: 'p2', title: '不重要但紧急', color: '#40a9ff' },
	{ key: 'p3', title: '不重要不紧急', color: '#52c41a' }
];
const groups = reactive(groupDefs.map(g => ({ ...g, open: true, tasks: [] })));

function toggleExpanded() {
	isExpanded.value = !isExpanded.value;
}

function handleAdd() {
	showAddDialog.value = true;
	isExpanded.value = false; // 关闭悬浮按钮组
}

function handleEdit() {
	// 切换编辑模式
	isEditMode.value = !isEditMode.value;
	// 与删除模式互斥
	if (isEditMode.value) {
		isDeleteMode.value = false;
	}
	isExpanded.value = false; // 关闭悬浮按钮组
}

function handleDelete() {
	// 切换删除模式
	isDeleteMode.value = !isDeleteMode.value;
	// 与编辑模式互斥
	if (isDeleteMode.value) {
		isEditMode.value = false;
	}
	isExpanded.value = false; // 关闭悬浮按钮组
}

function onClassChange(e) {
	newTaskClassIndex.value = Number(e.detail.value);
}

function cancelAdd() {
	showAddDialog.value = false;
	newTaskContent.value = '';
	newTaskClassIndex.value = 0;
}

async function confirmAdd() {
	if (!newTaskContent.value.trim()) {
		uni.showToast({
			title: '请输入任务内容',
			icon: 'none'
		});
		return;
	}

	try {
		const selectedClass = groupDefs[newTaskClassIndex.value].key;
		await request({
			url: '/api/todo/todo',
			method: 'POST',
			data: { 
				content: newTaskContent.value.trim(), 
				class_priority: selectedClass 
			}
		});

		uni.showToast({
			title: '添加成功',
			icon: 'success'
		});

		// 重置表单并关闭弹窗
		cancelAdd();
		// 刷新任务列表
		fetchTodos();
	} catch (error) {
		uni.showToast({
			title: '添加失败',
			icon: 'error'
		});
		console.error('添加任务失败:', error);
	}
}

async function fetchTodos() {
	// 分别请求四个优先级
	await Promise.all(groups.map(async (group) => {
		const res = await request({
			url: `/api/todo/todos/class/${group.key}`,
			method: 'GET'
		});
		if (res.data && res.data.code === 0) {
			group.tasks = res.data.data.todos || [];
		} else {
			group.tasks = [];
		}
	}));
}

async function toggleTaskStatus(task, gIdx, tIdx) {
	const newStatus = task.status === 'todo' ? 'done' : 'todo';
	
	// 立即更新UI状态，提供即时反馈
	task.status = newStatus;
	
	try {
		const requestData = { 
			status: newStatus, 
			class_priority: task.class
		};
		
		const response = await request({
			url: `/api/todo/todo/${task.id}?user_id=${uni.getStorageSync('userId')}`,
			method: 'PUT',
			data: requestData
		});
		
		if (response.statusCode === 200 && response.data && response.data.code === 0) {
			uni.showToast({
				title: newStatus === 'done' ? '任务已完成' : '任务已取消',
				icon: 'success',
				duration: 1000
			});
		} else {
			// 如果请求失败，恢复原状态
			task.status = task.status === 'todo' ? 'done' : 'todo';
			uni.showToast({
				title: '状态更新失败',
				icon: 'error'
			});
		}
	} catch (error) {
		// 如果请求失败，恢复原状态
		task.status = task.status === 'todo' ? 'done' : 'todo';
		uni.showToast({
			title: '网络错误',
			icon: 'error'
		});
	}
}

async function deleteTask(task, gIdx, tIdx) {
	// 显示确认删除弹窗
	uni.showModal({
		title: '确认删除',
		content: `确定要删除任务"${task.content}"吗？`,
		confirmText: '删除',
		cancelText: '取消',
		confirmColor: '#ff4d4f',
		success: async (res) => {
			if (res.confirm) {
				try {
					await request({
						url: `/api/todo/todo/${task.id}?user_id=${uni.getStorageSync('userId')}`,
						method: 'DELETE'
					});
					
					uni.showToast({
						title: '删除成功',
						icon: 'success',
						duration: 1000
					});
					
					// 从本地数组中移除任务，提供即时反馈
					groups[gIdx].tasks.splice(tIdx, 1);
					
				} catch (error) {
					uni.showToast({
						title: '删除失败',
						icon: 'error'
					});
				}
			}
		}
	});
}

async function moveTaskUp(task, gIdx, tIdx) {
	if (gIdx > 0) {
		const newClass = groupDefs[gIdx - 1].key;
		try {
			await request({
				url: `/api/todo/todo/${task.id}?user_id=${uni.getStorageSync('userId')}`,
				method: 'PUT',
				data: { 
					status: task.status, 
					class_priority: newClass
				}
			});
			
			// 从当前组移除任务
			groups[gIdx].tasks.splice(tIdx, 1);
			// 添加到上一个组
			groups[gIdx - 1].tasks.push(task);
			// 更新任务的class
			task.class = newClass;
			
			uni.showToast({
				title: '优先级已提升',
				icon: 'success',
				duration: 1000
			});
		} catch (error) {
			uni.showToast({
				title: '更新失败',
				icon: 'error'
			});
		}
	}
}

async function moveTaskDown(task, gIdx, tIdx) {
	if (gIdx < 3) {
		const newClass = groupDefs[gIdx + 1].key;
		try {
			await request({
				url: `/api/todo/todo/${task.id}?user_id=${uni.getStorageSync('userId')}`,
				method: 'PUT',
				data: { 
					status: task.status, 
					class_priority: newClass
				}
			});
			
			// 从当前组移除任务
			groups[gIdx].tasks.splice(tIdx, 1);
			// 添加到下一个组
			groups[gIdx + 1].tasks.push(task);
			// 更新任务的class
			task.class = newClass;
			
			uni.showToast({
				title: '优先级已降低',
				icon: 'success',
				duration: 1000
			});
		} catch (error) {
			uni.showToast({
				title: '更新失败',
				icon: 'error'
			});
		}
	}
}

function toggleGroup(idx) {
	groups[idx].open = !groups[idx].open;
}

onMounted(fetchTodos);
onPullDownRefresh(fetchTodos);

// 微信小程序分享功能
const onShareAppMessage = () => {
  return {
    title: '待办事项 - 高效任务管理',
    path: '/pages/todo/todo',
    imageUrl: '/static/todo.png'
  };
};

const onShareTimeline = () => {
  return {
    title: '待办事项 - 高效任务管理',
    query: '',
    imageUrl: '/static/todo.png'
  };
};
</script>

<style lang="scss" scoped>
.todo-group-list {
	width: 100%;
	max-width: 600px;
	margin: 0 auto;
	padding: 20px 0;
	position: relative;
}
.todo-group {
	margin-bottom: 24px;
	border-radius: 14px;
	overflow: hidden;
	box-shadow: 0 4px 16px rgba(60,60,60,0.06);
	background: #fff;
}
.group-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 24px;
	font-size: 20px;
	font-weight: bold;
	color: #fff;
	cursor: pointer;
	user-select: none;
	transition: background 0.2s;
}
.group-title {
	letter-spacing: 2px;
}
.arrow {
	width: 18px;
	height: 18px;
	margin-left: 10px;
	transition: transform 0.3s;
	display: inline-block;
	vertical-align: middle;
	transform: rotate(-180deg); // 默认向右
}
.arrow.open {
	transform: rotate(-90deg);   // 展开时向下
}
.group-tasks {
	padding: 12px 24px 18px 24px;
	background: #fafbfc;
}
.todo-item {
	display: flex;
	align-items: flex-start;
	font-size: 18px;
	margin: 18px 0 0 0;
	cursor: pointer;
	position: relative;
	gap: 14px;
}
.checkbox {
	width: 24px;
	height: 24px;
	border: 2px solid #bbb;
	border-radius: 6px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
	flex-shrink: 0;
}
.checkbox.checked {
	border-color: #4caf50;
	background: #4caf50;
	transform: scale(1.1);
}
.checkmark-icon {
	width: 24px;
	height: 24px;
	margin-right: 10px;
	vertical-align: middle;
	cursor: pointer;
	transition: transform 0.2s ease;
	flex-shrink: 0;
}
.checkmark-icon:hover {
	transform: scale(1.1);
}
.todo-text-wrap {
	display: flex;
	flex: 1;
	min-width: 0;
	margin-right: 10px;
}

.text-container {
	position: relative;
	display: inline-block;
}
.todo-text {
	color: #222;
	transition: color 0.3s;
	word-wrap: break-word;
	word-break: break-all;
	line-height: 1.4;
	flex: 1;
	min-width: 0;
}
.todo-text.done {
	color: #bbb;
}
.strike-line {
	position: absolute;
	left: 0;
	top: 50%;
	height: 2px;
	width: 0;
	background: #bbb;
	transform: translateY(-50%);
	transition: width 0.4s cubic-bezier(.4,2,.6,1);
	pointer-events: none;
}
.strike-line.show {
	width: 100%;
}
.delete-btn {
	margin-left: 10px;
	color: #bbb;
	font-size: 18px;
	cursor: pointer;
	transition: color 0.2s;
}
.delete-btn:hover {
	color: #ff4d4f;
}

.delete-icon {
	color: #ff4d4f;
	font-size: 24px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.3s ease;
	width: 30px;
	height: 30px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 77, 79, 0.1);
}

.delete-icon:hover {
	background: rgba(255, 77, 79, 0.2);
	transform: scale(1.1);
}

.delete-icon:active {
	transform: scale(0.9);
}

.edit-controls {
	display: flex;
	flex-direction: row;
	gap: 4px;
	flex-shrink: 0;
}

.arrow-up, .arrow-down {
	color: #ff9800;
	font-size: 20px;
	font-weight: bold;
	cursor: pointer;
	transition: all 0.3s ease;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255, 152, 0, 0.1);
}

.arrow-up:hover, .arrow-down:hover {
	background: rgba(255, 152, 0, 0.2);
	transform: scale(1.1);
}

.arrow-up:active, .arrow-down:active {
	transform: scale(0.9);
}
.empty-tips {
	color: #bbb;
	font-size: 15px;
	margin: 18px 0 0 10px;
}

/* 悬浮按钮组样式 */
.floating-buttons {
	position: fixed;
	right: 36px;
	bottom: 60px;
	z-index: 999;
}

.main-btn {
	width: 60px;
	height: 60px;
	background: #4caf50;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8px 32px rgba(76,175,80,0.18);
	cursor: pointer;
	transition: all 0.3s ease;
}

.main-btn.expanded {
	transform: rotate(45deg);
	background: #ff6b6b;
}

.plus-icon {
	font-size: 38px;
	font-weight: bold;
	transition: transform 0.3s ease;
}

.action-btn {
	position: absolute;
	width: 50px;
	height: 50px;
	background: #fff;
	color: #333;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4px 16px rgba(0,0,0,0.1);
	cursor: pointer;
	opacity: 0;
	transform: scale(0);
	transition: all 0.3s ease;
	font-size: 14px;
	font-weight: bold;
}

.action-btn.show {
	opacity: 1;
	transform: scale(1);
}

.add-btn {
	top: -80px;
	left: 5px;
	background: #4caf50;
	color: #fff;
}

.edit-btn {
	top: -50px;
	left: -50px;
	background: #ff9800;
	color: #fff;
}

.delete-btn {
	top: 5px;
	left: -80px;
	background: #f44336;
	color: #fff;
}

/* 模态框样式 */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.add-dialog {
	padding: 30px 24px 18px 24px;
	background: #fff;
	border-radius: 16px;
	min-width: 280px;
	max-width: 90%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	animation: dialogFadeIn 0.3s ease;
}

@keyframes dialogFadeIn {
	from {
		opacity: 0;
		transform: scale(0.8) translateY(-20px);
	}
	to {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.dialog-title {
	font-size: 20px;
	font-weight: bold;
	color: #333;
	margin-bottom: 20px;
	text-align: center;
}

.add-input {
	border: 1.5px solid #e0e6ed;
	border-radius: 8px;
	padding: 12px 14px;
	font-size: 17px;
	margin-bottom: 18px;
	outline: none;
	transition: border-color 0.2s;
}

.add-input:focus {
	border-color: #4caf50;
}

.add-class-picker {
	margin-bottom: 20px;
	width: 90%;
	background: #f5f5f5;
	border-radius: 8px;
	padding: 12px 14px;
	font-size: 16px;
	color: #333;
	border: 1.5px solid transparent;
	transition: border-color 0.2s;
}

.add-class-picker:focus {
	border-color: #4caf50;
}

.picker-view {
	color: #333;
}

.add-dialog-btns {
	display: flex;
	justify-content: flex-end;
	gap: 16px;
}

.add-dialog-btns button {
	width: 200rpx;
	padding: 8px 20px;
	border-radius: 6px;
	font-size: 16px;
	border: none;
	cursor: pointer;
	transition: background 0.2s;
}

.add-dialog-btns button:first-child {
	background: #f5f5f5;
	color: #666;
}

.add-dialog-btns button:first-child:hover {
	background: #e0e0e0;
}

.add-dialog-btns button:last-child {
	background: #4caf50;
	color: #fff;
}

.add-dialog-btns button:last-child:hover {
	background: #388e3c;
}
</style>
