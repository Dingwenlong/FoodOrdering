import { request, STORAGE_KEYS } from '../../utils/request';
import type { Order } from '../../types/index';

Page({
  data: {
    loading: false,
    orders: [] as Order[],
    errorMsg: '',
  },

  onLoad() {
    const session = wx.getStorageSync(STORAGE_KEYS.session);
    if (!session || !session.storeId || !session.tableId) {
      wx.reLaunch({ url: '/pages/scan/index' });
      return;
    }
    this.fetchOrders();
  },

  onShow() {
    this.fetchOrders();
  },

  onPullDownRefresh() {
    this.fetchOrders().finally(() => wx.stopPullDownRefresh());
  },

  async fetchOrders() {
    this.setData({ loading: true, errorMsg: '' });
    try {
      const res = await request<Order[]>({ url: '/orders', method: 'GET' });
      this.setData({ orders: res.data || [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '订单加载失败';
      this.setData({ errorMsg: msg });
    } finally {
      this.setData({ loading: false });
    }
  },

  goOrderDetail(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '').trim();
    if (!id) return;
    wx.navigateTo({ url: `/pages/orderDetail/index?id=${id}` });
  },

  goMenu() {
    const session = wx.getStorageSync(STORAGE_KEYS.session) || {};
    if (!session.storeId || !session.tableId) {
      wx.reLaunch({ url: '/pages/scan/index' });
      return;
    }
    wx.redirectTo({
      url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
    });
  },
});
