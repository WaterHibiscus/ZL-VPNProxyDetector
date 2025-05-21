<template>
	<view class="container">
		<button type="primary" @click="checkProxy" class="proxy-btn">检测网络设置</button>
	</view>
</template>

<script>
	import {
		checkProxyAndVPN
	} from '@/networkUtils.js'; // 路径根据你的项目结构调整

	export default {
		methods: {
			checkProxy() {
				checkProxyAndVPN();
			}
		}
	}
</script>

<style>
	.container {
		padding: 20px;
		font-size: 14px;
		line-height: 24px;
	}

	.proxy-btn {
		margin-bottom: 20px;
	}
</style>