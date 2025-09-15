/**
 * WebView 桥接业务分发与钩子封装
 * 页面中只需要：
 *   import { createHooks, dispatchBridgeCall } from '@/common/wm-app-bridge-handler.js'
 *   this.hooks = createHooks(this.wb)
 *   在 @message 调用 dispatchBridgeCall(method, payload, callId, bridge)
 */
import WMAppBridge from '@/common/wm-app-bridge.js'

export function createBridge(webviewInstance) {
	return new WMAppBridge(webviewInstance)
}

export function createHooks(webviewInstance) {
	const wv = webviewInstance
	return {
		install() {
			uni.showNavigationBarLoading()
			const isOpenVconsole = true
			if (isOpenVconsole) {
				wv.setJsFile('../../static/js/console.js')
			}
			wv.onloaded = () => {
				if (isOpenVconsole) {
					wv.evalJS('new VConsole()')
				}
				uni.hideNavigationBarLoading()
			}
			wv.addEventListener('titleUpdate', (e) => {
				document.title = `titleUpdate: ${e.detail.title}`
			}, false)
			wv.addEventListener('loading', () => {}, false)
			setTimeout(() => { uni.hideNavigationBarLoading() }, 15000)
		}
	}
}

export function dispatchBridgeCall(method, payload, callId, bridge) {
	switch (method) {
		case 'share':
			return handleShare(payload, callId, bridge)
		case 'getEnv': {
			let ua = ''
			try {
				if (typeof navigator !== 'undefined' && navigator && navigator.userAgent) {
					ua = navigator.userAgent
				} else if (typeof plus !== 'undefined' && plus.navigator && typeof plus.navigator.getUserAgent === 'function') {
					ua = plus.navigator.getUserAgent()
				}
			} catch (e) {}
			let sys = undefined
			try { sys = uni.getSystemInfoSync && uni.getSystemInfoSync() } catch (e) {}
			return bridge.respond(callId, { ua, app: 'uni-app', system: sys, plus: typeof plus !== 'undefined' })
		}
		default:
			return bridge.respond(callId, { code: 404, msg: 'method not found' })
	}
}

function handleShare(payload, callId, bridge) {
	const result = { code: 0, msg: 'ok', echo: payload }
	bridge.respond(callId, result)
}


