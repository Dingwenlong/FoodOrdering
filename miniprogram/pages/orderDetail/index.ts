import { request, STORAGE_KEYS } from '../../utils/request';
import type { Order, PrepayPayload, PrepayResult, UrgeOrderResult } from '../../types/index';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

Page({
  data: {
    order: null as Order | null,
    statusText: '',
    statusIcon: 'waiting',
    statusColor: '#60a5fa',
    paying: false,
    cancelLoading: false,
    urgeLoading: false,
    loading: false,
    errorMsg: '',
    contentMaxHeightPx: 9999,
    reviewRating: 5,
    reviewContent: '',
    reviewSubmitting: false,
    reviewed: false,
    reviewedAt: '',
    reviewedContent: '',
    reviewedRating: 0,
  },

  onLoad(options: Record<string, string>) {
    const orderId = (options.id || wx.getStorageSync(STORAGE_KEYS.lastOrderId) || '').trim();
    if (!orderId) {
      this.setData({ errorMsg: '缺少订单ID，请返回购物车重新下单' });
      return;
    }
    this.fetchOrder(orderId);
  },

  onReady() {
    this.recalcLayout();
  },

  onShow() {
    const orderId = this.data.order?.id;
    if (orderId) {
      this.fetchOrder(orderId);
    }
  },

  onResize() {
    this.recalcLayout();
  },

  rpxToPx(rpx: number) {
    const sys = wx.getSystemInfoSync();
    return (sys.windowWidth * rpx) / 750;
  },

  safeBottomInsetPx() {
    const sys = wx.getSystemInfoSync();
    const safeArea = (sys as any).safeArea as { bottom: number } | undefined;
    if (!safeArea || !Number.isFinite(safeArea.bottom)) return 0;
    return Math.max(0, Math.floor(sys.windowHeight - safeArea.bottom));
  },

  recalcLayout() {
    const sys = wx.getSystemInfoSync();
    const safeGapPx = this.rpxToPx(68);
    const safeBottomInsetPx = this.safeBottomInsetPx();

    wx.createSelectorQuery()
      .select('.footer-action')
      .boundingClientRect((rect) => {
        const footerHeightPx = rect && typeof rect.height === 'number' ? rect.height : 0;
        const maxHeight = sys.windowHeight - footerHeightPx - safeGapPx - safeBottomInsetPx;
        this.setData({ contentMaxHeightPx: Math.max(240, Math.floor(maxHeight)) });
      })
      .exec();
  },

  async fetchOrder(id: string) {
    this.setData({ loading: true, errorMsg: '' });
    try {
      const res = await request<Order>({ url: `/orders/${id}`, method: 'GET' });
      const order = res.data;
      this.setData({ order });
      this.updateStatusUI(order.status);
      await this.loadReviewState(order.id);
      setTimeout(() => this.recalcLayout(), 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '订单加载失败';
      this.setData({ errorMsg: msg });
    } finally {
      this.setData({ loading: false });
      setTimeout(() => this.recalcLayout(), 0);
    }
  },

  updateStatusUI(status: string) {
    let text = '';
    let icon = 'waiting';
    let color = '#60a5fa';

    switch (status) {
      case 'PENDING_PAY':
        text = '待支付';
        icon = 'waiting';
        color = '#f59e0b';
        break;
      case 'PAID':
        text = '已支付';
        icon = 'success';
        color = '#22c55e';
        break;
      case 'COOKING':
        text = '制作中';
        icon = 'info';
        color = '#38bdf8';
        break;
      case 'DONE':
        text = '已完成';
        icon = 'success';
        color = '#14b8a6';
        break;
      case 'CANCELED':
        text = '已取消';
        icon = 'warn';
        color = '#f87171';
        break;
      default:
        text = status;
        icon = 'info';
        color = '#60a5fa';
    }

    this.setData({ statusText: text, statusIcon: icon, statusColor: color });
  },

  async handlePay() {
    if (!this.data.order || this.data.paying) return;

    this.setData({ paying: true, errorMsg: '' });
    try {
      const payload: PrepayPayload = { orderId: this.data.order.id };
      await request<PrepayResult>({
        url: '/pay/wechat/prepay',
        method: 'POST',
        data: payload,
      });

      wx.showLoading({ title: '支付处理中...' });
      await wait(900);

      const confirmRes = await request<Order>({
        url: '/pay/wechat/confirm',
        method: 'POST',
        data: payload,
      });
      wx.hideLoading();

      this.setData({ order: confirmRes.data });
      this.updateStatusUI(confirmRes.data.status);
      wx.showToast({ title: '支付成功', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      const msg = err instanceof Error ? err.message : '支付失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ paying: false });
    }
  },

  async handleUrge() {
    if (!this.data.order || this.data.urgeLoading) return;
    if (this.data.order.status !== 'PAID' && this.data.order.status !== 'COOKING') {
      wx.showToast({ title: '当前状态不可催单', icon: 'none' });
      return;
    }

    this.setData({ urgeLoading: true, errorMsg: '' });
    try {
      const res = await request<UrgeOrderResult>({
        url: `/orders/${this.data.order.id}/urge`,
        method: 'POST',
      });
      wx.showToast({ title: res.data.message || '催单成功', icon: 'none' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '催单失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ urgeLoading: false });
    }
  },

  async handleCancel() {
    const order = this.data.order;
    if (!order || order.status !== 'PENDING_PAY' || this.data.cancelLoading) return;
    this.setData({ cancelLoading: true, errorMsg: '' });
    try {
      const res = await request<Order>({
        url: `/orders/${order.id}/cancel`,
        method: 'POST',
      });
      this.setData({ order: res.data });
      this.updateStatusUI(res.data.status);
      wx.showToast({ title: '订单已取消', icon: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '取消失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ cancelLoading: false });
    }
  },

  async refreshOrder() {
    const orderId = this.data.order?.id;
    if (!orderId) return;
    await this.fetchOrder(orderId);
  },

  async loadReviewState(orderId: string) {
    if (!orderId) return;
    try {
      const res = await request<Array<{ orderId?: string; rating?: number; content?: string; createdAt?: string }>>({
        url: '/comments',
        method: 'GET',
      });
      const current = (res.data || []).find((item) => String(item.orderId || '') === String(orderId));
      if (current) {
        this.setData({
          reviewed: true,
          reviewedAt: String(current.createdAt || ''),
          reviewedContent: String(current.content || ''),
          reviewedRating: Number(current.rating || 0),
        });
        return;
      }
      this.setData({
        reviewed: false,
        reviewedAt: '',
        reviewedContent: '',
        reviewedRating: 0,
      });
    } catch {
      this.setData({
        reviewed: false,
        reviewedAt: '',
        reviewedContent: '',
        reviewedRating: 0,
      });
    }
  },

  handleRatingTap(e: WechatMiniprogram.BaseEvent) {
    const score = Number(e.currentTarget.dataset.score || 0);
    if (!Number.isFinite(score) || score < 1 || score > 5) return;
    this.setData({ reviewRating: score });
  },

  handleReviewInput(e: WechatMiniprogram.BaseEvent) {
    const value = String((e as any).detail?.value || '');
    this.setData({ reviewContent: value });
  },

  async submitReview() {
    const order = this.data.order;
    if (!order || order.status !== 'DONE') {
      wx.showToast({ title: '订单完成后可评价', icon: 'none' });
      return;
    }
    if (this.data.reviewed) {
      wx.showToast({ title: '该订单已评价', icon: 'none' });
      return;
    }
    if (this.data.reviewSubmitting) return;

    const content = this.data.reviewContent.trim();
    if (!content) {
      wx.showToast({ title: '请填写评价内容', icon: 'none' });
      return;
    }

    this.setData({ reviewSubmitting: true });
    try {
      const payload = {
        orderId: order.id,
        rating: this.data.reviewRating,
        content,
      };
      const res = await request<{ rating: number; content: string; createdAt: string }>({
        url: '/comments',
        method: 'POST',
        data: payload,
      });
      this.setData({
        reviewed: true,
        reviewedRating: Number(res.data.rating || this.data.reviewRating),
        reviewedContent: String(res.data.content || content),
        reviewedAt: String(res.data.createdAt || ''),
      });
      wx.showToast({ title: '评价成功', icon: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '评价失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ reviewSubmitting: false });
    }
  },

  copyId(e: WechatMiniprogram.BaseEvent) {
    const orderId = String(e.currentTarget.dataset.id || '');
    if (!orderId) return;
    wx.setClipboardData({
      data: orderId,
      success: () => wx.showToast({ title: '订单号已复制', icon: 'success' }),
    });
  },

  goMenu() {
    const session = wx.getStorageSync(STORAGE_KEYS.session) || {};
    if (!session.storeId || !session.tableId) {
      wx.redirectTo({ url: '/pages/scan/index' });
      return;
    }
    wx.redirectTo({
      url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
    });
  },
});
