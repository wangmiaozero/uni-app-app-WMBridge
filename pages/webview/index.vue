<template>
	<view>
		<web-view id="lk-webview" v-if="webViewUrl" :src="webViewUrl" @message="handlePostMessage"></web-view>
	</view>
</template>
<script>

import { createBridge, createHooks, dispatchBridgeCall } from '@/common/wm-app-bridge-handler.js'

export default {
	data() {
		return {
			webViewUrl: '/hybrid/html/local.html',
			wb: null,
			bridge: null
		}
	},
	onReady() {
		// #ifdef APP
		this.wb = this.$mp.page.$getAppWebview().children()[0]
		this.bridge = createBridge(this.wb)
		this.hooks = createHooks(this.wb)
		this.hooks.install()
		// #endif
	},
	methods: {
		// 接收 H5 的 postMessage（wm-bridge.js 内 invoke 发出的 WM_BRIDGE_CALL）
		handlePostMessage(e) {
			const msgArr = (e && e.detail && e.detail.data) || [];
			console.log('msgArr is:', msgArr)
			const last = msgArr[msgArr.length - 1]
			if (!last || !last.type) {
				console.log('postMessage:', e)
				return
			}
			if (last.type === 'WM_BRIDGE_CALL') {
				const method = last.method
				const payload = last.payload || {}
				const callId = last.callId
				dispatchBridgeCall(method, payload, callId, this.bridge)
			} else {
				console.log('unknown message type:', last)
			}
		},
	}
}
</script>

<style scoped></style>
