[[中文 README](README-CN.md)] · [Start](#start)

If this project helps you, please consider giving it a star on GitHub: [Star this repo](https://github.com/wangmiaozero/uni-app-app-WMBridge) ⭐️

Uni-app Hybrid WebView Bridge Demo
=================================

A minimal uni-app demo showcasing a robust, bi-directional bridge between an embedded H5 page (web-view) and the native app container. It ships with a clean separation of concerns, reusable JS modules, and sample methods for quick end-to-end verification.

Features
--------
- Bi-directional messaging between H5 and App
- Promise-based H5 invoke API with timeout
- App-side handler and hook separation for maintainability
- Safe environment detection for iOS/Android (UA and system info)
- Optional vConsole injection for debugging

Structure
---------
```
common/
  wm-app-bridge.js            # App -> H5 callback wrapper
  wm-app-bridge-handler.js    # App-side hooks and method dispatch
hybrid/html/
  local.html                  # H5 demo page loaded by web-view
  js/
    wm-bridge.js              # H5 -> App invoke bridge
    uni.webview.1.5.6.js      # UniApp webview SDK
pages/webview/index.vue       # Minimal page that initializes, forwards, and logs
```

H5 → App (Call) API
-------------------
In `hybrid/html/local.html` (H5 page), call App methods via a promise-based API:
```html
<script src="./js/uni.webview.1.5.6.js"></script>
<script src="./js/wm-bridge.js"></script>
<script>
  // Call App 'share' and handle response
  wmappsdk.invoke('share', { title: 'Hello', url: location.href }, { timeout: 6000 })
    .then(resp => console.log('share resp:', resp))
    .catch(err => console.log('share error:', err && err.message))
</script>
```

App Side: Receiving and Responding
----------------------------------
In `pages/webview/index.vue` the page receives messages and forwards them to the handler:
```js
import { createBridge, createHooks, dispatchBridgeCall } from '@/common/wm-app-bridge-handler.js'

// onReady: init webview, bridge and hooks
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

The actual business logic and hooks live in `common/wm-app-bridge-handler.js`:
```js
export function dispatchBridgeCall(method, payload, callId, bridge) {
  switch (method) {
    case 'share':
      return bridge.respond(callId, { code: 0, msg: 'ok', echo: payload })
    case 'getEnv': {
      // safe env detection
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

H5 ↔ App Message Format
-----------------------
- H5 → App request: `{ type: 'WM_BRIDGE_CALL', method, payload, callId }`
- App → H5 response (via evalJS): `wmappsdk.appCallBackNew({ cbId: callId, value })`

Debugging
---------
- Set `window.__WM_BRIDGE_DEBUG__ = true` in H5 console to see bridge logs
- vConsole can be injected automatically in the App webview hooks

Start
-----
1. Open project in HBuilderX or your preferred uni-app setup
2. Run to App (iOS/Android); open the WebView page and click demo buttons
3. Observe console logs on both sides (H5 and App logs)

Extending
--------
Add a new method end-to-end:
- H5: `wmappsdk.invoke('openPage', { url: '/pages/xxx' })`
- App: Add a `case 'openPage'` in `dispatchBridgeCall` and call `bridge.respond(callId, result)` when done

License
-------
[MIT](./LICENSE) — Free for learning and commercial use.


