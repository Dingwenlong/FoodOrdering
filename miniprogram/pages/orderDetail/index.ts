import { request } from '../../utils/request';
import { Order } from '../../types/index';

Page({
  data: {
    order: null as Order | null,
    statusText: '',
    statusIcon: 'waiting', // success, waiting, cancel, warn
    paying: false
  },

  onLoad(options: any) {
    if (options.id) {
      this.fetchOrder(options.id);
    }
  },

  async fetchOrder(id: string) {
    try {
      wx.showLoading({ title: '加载订单...' });
      const res = await request({ url: `/orders/${id}`, method: 'GET' });
      const order = res.data as Order;
      
      this.setData({ order });
      this.updateStatusUI(order.status);
    } catch (e) {
      console.error(e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  updateStatusUI(status: string) {
    let text = '';
    let icon = 'waiting';

    switch (status) {
      case 'PENDING_PAY':
        text = '待支付';
        icon = 'waiting';
        break;
      case 'PAID':
        text = '已支付';
        icon = 'success';
        break;
      case 'COOKING':
        text = '制作中';
        icon = 'info';
        break;
      case 'DONE':
        text = '已完成';
        icon = 'success';
        break;
      case 'CANCELED':
        text = '已取消';
        icon = 'warn';
        break;
      default:
        text = status;
    }
    this.setData({ statusText: text, statusIcon: icon });
  },

  async handlePay() {
    if (!this.data.order) return;
    
    this.setData({ paying: true });
    try {
      // 1. Get Prepay Info
      const res = await request({ 
        url: '/pay/wechat/prepay', 
        method: 'POST', 
        data: { orderId: this.data.order.id } 
      });

      // 2. Call WxPay (Mocked in request util, but here is standard API)
      // Since we are in mock mode, we simulate success directly or use the mock result
      
      wx.showLoading({ title: '支付中...' });
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({ title: '支付成功', icon: 'success' });
        
        // Refresh Order
        this.setData({ 
          'order.status': 'PAID',
          paying: false 
        });
        this.updateStatusUI('PAID');
      }, 1000);

    } catch (e) {
      wx.showToast({ title: '支付失败', icon: 'none' });
      this.setData({ paying: false });
    }
  }
});
