[English README](README.md) · [Start](#start)

如果这个项目对你有帮助，欢迎到 GitHub 点个 Star 支持一下：[给仓库点 Star](https://github.com/wangmiaozero/uni-app-app-WMBridge) ⭐️

Uni-app 混合 WebView 桥接示例
==============================

一个最小可用的 uni-app 示例，演示 App 宿主与内嵌 H5（web-view）之间的双向通信桥接。项目已按职责拆分，提供可复用的 JS 模块与示例方法，便于端到端验证与扩展。

特性
----
- H5 与 App 双向通信
- H5 侧 Promise 化的调用接口，支持超时
- App 侧业务分发与钩子独立封装，便于维护
- iOS/Android 环境安全检测（UA、系统信息）
- 可选注入 vConsole 方便调试

目录结构
--------
```
common/
  wm-app-bridge.js            # App -> H5 回调封装类
  wm-app-bridge-handler.js    # App 侧钩子与方法分发
hybrid/html/
  local.html                  # web-view 加载的 H5 示例页
  js/
    wm-bridge.js              # H5 -> App 调用桥
    uni.webview.1.5.6.js      # UniApp webview SDK
pages/webview/index.vue       # 仅做初始化、转发与日志的最简页面
```

H5 调用 App（请求）
-------------------
在 `hybrid/html/local.html` 中使用 Promise 化 API 调用 App 方法：
```html
<script src="./js/uni.webview.1.5.6.js"></script>
<script src="./js/wm-bridge.js"></script>
<script>
  // 调用 App 的 share，并处理响应
  wmappsdk.invoke('share', { title: 'Hello', url: location.href }, { timeout: 6000 })
    .then(resp => console.log('share resp:', resp))
    .catch(err => console.log('share error:', err && err.message))
</script>
```

App 接收并回调 H5（响应）
--------------------------
在 `pages/webview/index.vue` 接收消息并委托给分发模块：
```js
import { createBridge, createHooks, dispatchBridgeCall } from '@/common/wm-app-bridge-handler.js'

// onReady：初始化 webview、bridge 与 hooks
this.wb = this.$mp.page.$getAppWebview().children()[0]
this.bridge = createBridge(this.wb)
this.hooks = createHooks(this.wb)
this.hooks.install()

// on message
handlePostMessage(e) {
  const msgArr = (e && e.detail && e.detail.data) || []
  const last = msgArr[msgArr.length - 1]
  if (last && last.type === 'WM_BRIDGE_CALL') {
    const { method, payload = {}, callId } = last
    dispatchBridgeCall(method, payload, callId, this.bridge)
  }
}
```

实际的业务分发与钩子位于 `common/wm-app-bridge-handler.js`：
```js
export function dispatchBridgeCall(method, payload, callId, bridge) {
  switch (method) {
    case 'share':
      return bridge.respond(callId, { code: 0, msg: 'ok', echo: payload })
    case 'getEnv': {
      // 安全环境检测
      let ua = ''
      try {
        if (typeof navigator !== 'undefined' && navigator && navigator.userAgent) ua = navigator.userAgent
        else if (typeof plus !== 'undefined' && plus.navigator && typeof plus.navigator.getUserAgent === 'function') ua = plus.navigator.getUserAgent()
      } catch {}
      let sys
      try { sys = uni.getSystemInfoSync && uni.getSystemInfoSync() } catch {}
      return bridge.respond(callId, { ua, app: 'uni-app', system: sys, plus: typeof plus !== 'undefined' })
    }
    default:
      return bridge.respond(callId, { code: 404, msg: 'method not found' })
  }
}
```

消息格式
--------
- H5 → App 请求：`{ type: 'WM_BRIDGE_CALL', method, payload, callId }`
- App → H5 响应（通过 evalJS）：`wmappsdk.appCallBackNew({ cbId: callId, value })`

调试建议
--------
- 在 H5 控制台设置 `window.__WM_BRIDGE_DEBUG__ = true` 以打印桥接日志
- App 侧可在 hooks 中自动注入 vConsole

Start
-----
1. 在 HBuilderX 或其它 uni-app 环境打开本项目
2. 运行到 App（iOS/Android），进入 WebView 页面，点击示例按钮
3. 分别查看 H5 和 App 控制台输出

扩展指引
--------
新增一个方法的最小步骤：
- H5：`wmappsdk.invoke('openPage', { url: '/pages/xxx' })`
- App：在 `dispatchBridgeCall` 新增 `case 'openPage'`，完成后 `bridge.respond(callId, result)`

License
-------
MIT


