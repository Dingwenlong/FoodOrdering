"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("./utils/request");
// app.ts
App({
    globalData: {},
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);
        if ((0, request_1.shouldUseMock)()) {
            wx.setStorageSync(request_1.STORAGE_KEYS.clientToken, 'mock_client_token');
        }
    },
});
