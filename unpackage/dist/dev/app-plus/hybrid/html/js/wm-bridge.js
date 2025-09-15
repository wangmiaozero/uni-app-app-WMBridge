/*
WMBridge（H5 ↔ App）使用说明
1) H5 调用 App
   - 在 web 页面（local.html）中：
     wmappsdk.invoke('share', { title: '标题' })
   - 内部通过 uni.postMessage 将 { type:'WM_BRIDGE_CALL', method, payload, callId } 发给 App 宿主。

2) App 接收消息
   - 在 pages/webview/index.vue 的 @message -> handlePostMessage 中接收，
     再分发到 dispatchBridgeCall(method, payload, callId)。

3) App 回调 H5
   - App 处理完成后，调用 this.bridge.respond(callId, value)，
     内部通过 webview.evalJS('wmappsdk.appCallBackNew({...})') 回传给 H5。

4) 超时与调试
   - invoke 默认 8000ms 超时，可在第三个参数传 { timeout } 自定义。
   - 设置 window.__WM_BRIDGE_DEBUG__ = true 可在控制台输出桥接调试日志。
*/
(function() {
  var PENDING = 0;
  var FULFILLED = 1;
  var REJECTED = 2;

  var callIdCounter = 1;
  var pendingCalls = {};

  function generateCallId() {
    return 'cb_' + Date.now() + '_' + (callIdCounter++);
  }

  function isAppUA() {
    try {
      return /wangmiaoApp/i.test(navigator.userAgent);
    } catch (e) {
      return false;
    }
  }

  function debugLog() {
    if (window.__WM_BRIDGE_DEBUG__) {
      try { console.log.apply(console, ['[WMBridge]'].concat([].slice.call(arguments))); } catch (e) {}
    }
  }

  function ensureUniReady(callback) {
    if (window.uni && typeof window.uni.postMessage === 'function') {
      return callback();
    }
    document.addEventListener('UniAppJSBridgeReady', function onReady() {
      document.removeEventListener('UniAppJSBridgeReady', onReady);
      callback();
    });
  }

  var WMBridge = {
    version: '1.0.0',
    isInApp: isAppUA(),

    /**
     * H5 调用 App 宿主方法
     * @param {string} method 方法名（例如 'share'、'getEnv'）
     * @param {object} payload 业务参数
     * @param {{timeout?: number}} options 可选项，超时时间毫秒
     * @returns {Promise<any>} App 回调的结果
     */
    invoke: function(method, payload, options) {
      options = options || {};
      var timeoutMs = typeof options.timeout === 'number' ? options.timeout : 8000;

      var callId = generateCallId();
      var message = {
        type: 'WM_BRIDGE_CALL',
        method: method,
        payload: payload || {},
        callId: callId
      };

      debugLog('invoke ->', message);

      var resolver;
      var rejecter;
      var state = PENDING;
      var result;

      var p = new Promise(function(resolve, reject) {
        resolver = resolve;
        rejecter = reject;
      });

      var timer = setTimeout(function() {
        if (state !== PENDING) return;
        state = REJECTED;
        delete pendingCalls[callId];
        rejecter(new Error('WMBridge timeout for method: ' + method));
      }, timeoutMs);

      pendingCalls[callId] = function(response) {
        if (state !== PENDING) return;
        clearTimeout(timer);
        state = FULFILLED;
        delete pendingCalls[callId];
        resolver(response);
      };

      ensureUniReady(function() {
        try {
          window.uni.postMessage({
            data: message
          });
        } catch (err) {
          clearTimeout(timer);
          state = REJECTED;
          delete pendingCalls[callId];
          rejecter(err);
        }
      });

      return p;
    },

    /**
     * App 调用：H5 回调入口（供 App 侧 evalJS 调用）
     * H5 侧勿直接调用。
     * @param {{cbId: string, value: any}} data 回调载荷
     */
    appCallBackNew: function(data) {
      try {
        debugLog('appCallBackNew <-', data);
        if (data && data.cbId && pendingCalls[data.cbId]) {
          pendingCalls[data.cbId](data.value);
          return;
        }
      } catch (e) {}
      // 兜底打印
      try { console.log('appCallBackNew', data); } catch (e) {}
    },

    // 兼容旧的字符串参数回调
    appCallBack: function(data) {
      try { console.log('appCallBack', data); } catch (e) {}
    }
  };

  // 暴露到全局
  window.wmappsdk = WMBridge;
})();


