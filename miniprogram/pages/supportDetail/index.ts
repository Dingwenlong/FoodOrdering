import { request } from '../../utils/request';
import type { PageResult, SupportTicketDetail, SupportTicketMessage } from '../../types/index';

Page({
  data: {
    ticketId: '',
    detail: null as SupportTicketDetail | null,
    messages: [] as SupportTicketMessage[],
    loading: false,
    sending: false,
    errorMsg: '',
    input: '',
  },

  onLoad(options: Record<string, string>) {
    const ticketId = String(options.id || '').trim();
    if (!ticketId) {
      this.setData({ errorMsg: '缺少工单ID' });
      return;
    }
    this.setData({ ticketId });
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh().finally(() => wx.stopPullDownRefresh());
  },

  async refresh() {
    if (!this.data.ticketId) return;
    this.setData({ loading: true, errorMsg: '' });
    try {
      const [detailRes, messageRes] = await Promise.all([
        request<SupportTicketDetail>({ url: `/support/tickets/${this.data.ticketId}`, method: 'GET' }),
        request<PageResult<SupportTicketMessage>>({
          url: `/support/tickets/${this.data.ticketId}/messages?page=1&pageSize=50`,
          method: 'GET',
        }),
      ]);
      this.setData({
        detail: detailRes.data,
        messages: (messageRes.data.list || []).reverse(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '消息加载失败';
      this.setData({ errorMsg: msg });
    } finally {
      this.setData({ loading: false });
    }
  },

  handleInput(e: WechatMiniprogram.BaseEvent) {
    this.setData({ input: String((e as any).detail?.value || '') });
  },

  async sendMessage() {
    const content = this.data.input.trim();
    if (!content || this.data.sending || !this.data.ticketId) return;
    if (this.data.detail?.status === 'CLOSED') {
      wx.showToast({ title: '工单已关闭', icon: 'none' });
      return;
    }
    this.setData({ sending: true, errorMsg: '' });
    try {
      const res = await request<SupportTicketMessage>({
        url: `/support/tickets/${this.data.ticketId}/messages`,
        method: 'POST',
        data: { content },
      });
      this.setData({
        input: '',
        messages: [...this.data.messages, res.data],
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '发送失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ sending: false });
    }
  },
});
