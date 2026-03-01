import { request } from '../../utils/request';
import { CartItem } from '../../types/index';

Page({
  data: {
    items: [] as CartItem[],
    totalPrice: 0,
    submitting: false
  },

  onShow() {
    this.loadCart();
  },

  loadCart() {
    // 从本地存储读取购物车 (dishId -> qty)
    // 实际项目中应该还需要读取菜品详情来展示名称和价格，这里简化假设已经有详情或再次请求
    // 为了简化，我们假设 menu 页面存入的是完整信息，或者我们这里重新 fetch menu
    // 这里做个简单处理：从 storage 读取 cart 映射，并结合 menu 数据（需要 menu 页面配合存完整信息或者重新拉取）
    
    // 重新拉取 Menu 来匹配信息 (模拟)
    const cartMap = wx.getStorageSync('cart') || {};
    this.fetchMenuAndMatch(cartMap);
  },

  async fetchMenuAndMatch(cartMap: Record<string, number>) {
    try {
      const storeId = wx.getStorageSync('storeId') || 's1';
      const res = await request({ url: `/menu?storeId=${storeId}`, method: 'GET' });
      const categories = res.data;
      
      const items: CartItem[] = [];
      let total = 0;

      categories.forEach((cat: any) => {
        cat.dishes.forEach((dish: any) => {
          if (cartMap[dish.id]) {
            items.push({
              dishId: dish.id,
              dishName: dish.name,
              unitPriceFen: dish.priceFen,
              qty: cartMap[dish.id]
            });
            total += dish.priceFen * cartMap[dish.id];
          }
        });
      });

      this.setData({ items, totalPrice: total });
    } catch (e) {
      console.error(e);
    }
  },

  updateQty(e: any) {
    const { id, delta } = e.currentTarget.dataset;
    const items = this.data.items.map(item => {
      if (item.dishId === id) {
        return { ...item, qty: item.qty + delta };
      }
      return item;
    }).filter(item => item.qty > 0);

    // Update Storage
    const newCartMap: Record<string, number> = {};
    let total = 0;
    items.forEach(item => {
      newCartMap[item.dishId] = item.qty;
      total += item.unitPriceFen * item.qty;
    });
    wx.setStorageSync('cart', newCartMap);

    this.setData({ items, totalPrice: total });
  },

  goBack() {
    wx.navigateBack();
  },

  async submitOrder() {
    if (this.data.items.length === 0) return;

    this.setData({ submitting: true });
    try {
      const orderData = {
        storeId: wx.getStorageSync('storeId'),
        tableId: wx.getStorageSync('tableId'),
        items: this.data.items,
        totalPriceFen: this.data.totalPrice
      };

      const res = await request({
        url: '/orders',
        method: 'POST',
        data: orderData
      });

      if (res.statusCode === 200) {
        // Clear Cart
        wx.removeStorageSync('cart');
        wx.showToast({ title: '下单成功', icon: 'success' });
        
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/orderDetail/index?id=${res.data.id}`
          });
        }, 1500);
      }
    } catch (e) {
      wx.showToast({ title: '下单失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
