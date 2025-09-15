/**
 * App 侧桥接类：负责从 App 宿主向 H5 执行回调
 * 使用：
 *   const bridge = new WMAppBridge(webview)
 *   bridge.respond(callId, value)
 */
export default class WMAppBridge {
	constructor(wv) {
		this.webview = wv
	}
	_evalCallback(value, cbId) {
		try {
			if (!this.webview) return
			if (cbId) return this.webview.evalJS(`wmappsdk.appCallBackNew(${JSON.stringify({ value, cbId })})`)
			this.webview.evalJS(`wmappsdk.appCallBack(${JSON.stringify(JSON.stringify(value))})`)
		} catch (e) {
			console.log(e, 'evalCallback')
		}
	}
	respond(callId, value) {
		this._evalCallback(value, callId)
	}
}


