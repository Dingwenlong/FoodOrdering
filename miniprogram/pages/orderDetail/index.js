"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
Page({
    data: {
        order: null,
        statusText: '',
        statusIcon: 'waiting',
        statusColor: '#60a5fa',
        paying: false,
        urgeLoading: false,
        loading: false,
        errorMsg: '',
    },
    onLoad(options) {
        const orderId = (options.id || wx.getStorageSync(request_1.STORAGE_KEYS.lastOrderId) || '').trim();
        if (!orderId) {
            this.setData({ errorMsg: '缺少订单ID，请返回购物车重新下单' });
            return;
        }
        this.fetchOrder(orderId);
    },
    onShow() {
        var _a;
        const orderId = (_a = this.data.order) === null || _a === void 0 ? void 0 : _a.id;
        if (orderId) {
            this.fetchOrder(orderId);
        }
    },
    async fetchOrder(id) {
        this.setData({ loading: true, errorMsg: '' });
        try {
            const res = await (0, request_1.request)({ url: `/orders/${id}`, method: 'GET' });
            const order = res.data;
            this.setData({ order });
            this.updateStatusUI(order.status);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '订单加载失败';
            this.setData({ errorMsg: msg });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    updateStatusUI(status) {
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
        if (!this.data.order || this.data.paying)
            return;
        this.setData({ paying: true, errorMsg: '' });
        try {
            const payload = { orderId: this.data.order.id };
            await (0, request_1.request)({
                url: '/pay/wechat/prepay',
                method: 'POST',
                data: payload,
            });
            wx.showLoading({ title: '支付处理中...' });
            await wait(900);
            const confirmRes = await (0, request_1.request)({
                url: '/pay/wechat/confirm',
                method: 'POST',
                data: payload,
            });
            wx.hideLoading();
            this.setData({ order: confirmRes.data });
            this.updateStatusUI(confirmRes.data.status);
            wx.showToast({ title: '支付成功', icon: 'success' });
        }
        catch (err) {
            wx.hideLoading();
            const msg = err instanceof Error ? err.message : '支付失败';
            this.setData({ errorMsg: msg });
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ paying: false });
        }
    },
    async handleUrge() {
        if (!this.data.order || this.data.urgeLoading)
            return;
        if (this.data.order.status !== 'PAID' && this.data.order.status !== 'COOKING') {
            wx.showToast({ title: '当前状态不可催单', icon: 'none' });
            return;
        }
        this.setData({ urgeLoading: true, errorMsg: '' });
        try {
            const res = await (0, request_1.request)({
                url: `/orders/${this.data.order.id}/urge`,
                method: 'POST',
            });
            wx.showToast({ title: res.data.message || '催单成功', icon: 'none' });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '催单失败';
            this.setData({ errorMsg: msg });
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ urgeLoading: false });
        }
    },
    async refreshOrder() {
        var _a;
        const orderId = (_a = this.data.order) === null || _a === void 0 ? void 0 : _a.id;
        if (!orderId)
            return;
        await this.fetchOrder(orderId);
    },
    copyId(e) {
        const orderId = String(e.currentTarget.dataset.id || '');
        if (!orderId)
            return;
        wx.setClipboardData({
            data: orderId,
            success: () => wx.showToast({ title: '订单号已复制', icon: 'success' }),
        });
    },
    goMenu() {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session) || {};
        if (!session.storeId || !session.tableId) {
            wx.redirectTo({ url: '/pages/scan/index' });
            return;
        }
        wx.redirectTo({
            url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
        });
    },
});
