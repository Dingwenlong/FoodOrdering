Page({
  data: {},
  
  onLoad() {},

  handleScan() {
    wx.scanCode({
      success: (res) => {
        console.log(res);
        // 解析二维码参数，例如 storeId=123&tableId=456
        // 这里模拟解析成功
        this.bindTable('s1', 't1');
      },
      fail: (err) => {
        wx.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  },

  handleManual() {
    // 模拟扫码直接进入
    this.bindTable('s1', 't1');
  },

  bindTable(storeId: string, tableId: string) {
    wx.showLoading({ title: '绑定中...' });
    
    // 模拟绑定请求
    setTimeout(() => {
      wx.hideLoading();
      // 存储会话信息
      wx.setStorageSync('storeId', storeId);
      wx.setStorageSync('tableId', tableId);
      
      wx.navigateTo({
        url: `/pages/menu/index?storeId=${storeId}&tableId=${tableId}`
      });
    }, 500);
  }
});
