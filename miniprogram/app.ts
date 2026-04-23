import { IAppOption } from './types/index'
import { shouldUseMock, STORAGE_KEYS } from './utils/request'

// app.ts
App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (shouldUseMock()) {
      wx.setStorageSync(STORAGE_KEYS.clientToken, 'mock_client_token')
    }
  },
})
