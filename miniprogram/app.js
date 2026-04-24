"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
App({
    globalData: {},
    onLaunch() {
        // 展示本地存储能力
        const logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now());
        wx.setStorageSync('logs', logs);
    },
});
