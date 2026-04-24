import { request } from '../../utils/request';
import type { SupportTicket } from '../../types/index';

Page({
  data: {
    loading: false,
    submitting: false,
    tickets: [] as SupportTicket[],
    errorMsg: '',
    topic: '',
    content: '',
  },

  onLoad() {
    this.fetchTickets();
  },

  onShow() {
    this.fetchTickets();
  },

  onPullDownRefresh() {
    this.fetchTickets().finally(() => wx.stopPullDownRefresh());
  },

  async fetchTickets() {
    this.setData({ loading: true, errorMsg: '' });
    try {
      const res = await request<SupportTicket[]>({ url: '/support/tickets', method: 'GET' });
      this.setData({ tickets: res.data || [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '客服工单加载失败';
      this.setData({ errorMsg: msg });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleTopicInput(e: WechatMiniprogram.BaseEvent) {
    this.setData({ topic: String((e as any).detail?.value || '') });
  },

  handleContentInput(e: WechatMiniprogram.BaseEvent) {
    this.setData({ content: String((e as any).detail?.value || '') });
  },

  async submitTicket() {
    const topic = this.data.topic.trim();
    const content = this.data.content.trim();
    if (!topic) {
      wx.showToast({ title: '请填写问题主题', icon: 'none' });
      return;
    }
    if (!content) {
      wx.showToast({ title: '请填写问题描述', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;

    this.setData({ submitting: true, errorMsg: '' });
    try {
      const res = await request<{ id: string }>({
        url: '/support/tickets',
        method: 'POST',
        data: { topic, content },
      });
      this.setData({ topic: '', content: '' });
      wx.showToast({ title: '已提交', icon: 'success' });
      const ticketId = String(res.data?.id || '').trim();
      if (!ticketId) {
        await this.fetchTickets();
        wx.showToast({ title: '已提交，请在我的工单中查看', icon: 'none' });
        return;
      }
      this.openSupportDetail(ticketId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  openTicket(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    if (!id) return;
    this.openSupportDetail(id);
  },

  openSupportDetail(id: string) {
    const ticketId = String(id || '').trim();
    if (!ticketId) return;
    const url = `/pages/supportDetail/index?id=${encodeURIComponent(ticketId)}`;
    wx.navigateTo({
      url,
      fail: () => {
        wx.redirectTo({
          url,
          fail: () => {
            this.fetchTickets();
            wx.showToast({ title: '工单已提交，请从列表进入', icon: 'none' });
          },
        });
      },
    });
  },
});
