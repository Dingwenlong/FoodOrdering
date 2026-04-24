"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        order: null,
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
    onLoad(options) {
        const orderId = (options.id || wx.getStorageSync(request_1.STORAGE_KEYS.lastOrderId) || '').trim();
        if (!orderId) {
            this.setData({ errorMsg: '缺少订单ID，请返回购物车重新下单' });
            return;
        }
        this.currentOrderId = orderId;
        this.allowSocketReconnect = true;
        this.fetchOrder(orderId);
        this.initWebSocket();
    },
    onReady() {
        this.recalcLayout();
    },
    onShow() {
        var _a;
        const orderId = (_a = this.data.order) === null || _a === void 0 ? void 0 : _a.id;
        if (orderId) {
            this.fetchOrder(orderId);
        }
    },
    onUnload() {
        this.allowSocketReconnect = false;
        this.closeWebSocket();
    },
    initWebSocket() {
        try {
            const BASE_URL = String(wx.getStorageSync('MP_API_BASE_URL') || 'http://localhost:8080').replace(/\/+$/, '');
            const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/api/ws/menu';
            console.log('连接 WebSocket (订单详情):', wsUrl);
            const socketTask = wx.connectSocket({
                url: wsUrl,
                protocols: [],
            });
            this.wsSocketTask = socketTask;
            socketTask.onOpen(() => {
                console.log('WebSocket 连接已打开 (订单详情)');
            });
            socketTask.onMessage((res) => {
                console.log('收到 WebSocket 消息 (订单详情):', res.data);
                try {
                    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    if (data.type === 'order_updated' && data.orderId === this.currentOrderId) {
                        console.log('订单已更新，正在刷新...');
                        if (this.currentOrderId) {
                            this.fetchOrder(this.currentOrderId);
                        }
                    }
                }
                catch (e) {
                    console.error('解析 WebSocket 消息失败:', e);
                }
            });
            socketTask.onError((err) => {
                console.error('WebSocket 连接错误 (订单详情):', err);
            });
            socketTask.onClose(() => {
                if (!this.allowSocketReconnect)
                    return;
                console.log('WebSocket 连接已关闭 (订单详情)，5秒后重连...');
                setTimeout(() => {
                    if (this.allowSocketReconnect) {
                        this.initWebSocket();
                    }
                }, 5000);
            });
        }
        catch (e) {
            console.error('初始化 WebSocket 失败 (订单详情):', e);
        }
    },
    closeWebSocket() {
        this.allowSocketReconnect = false;
        const socketTask = this.wsSocketTask;
        if (socketTask) {
            try {
                socketTask.close();
            }
            catch (e) {
                console.error('关闭 WebSocket 失败 (订单详情):', e);
            }
            this.wsSocketTask = null;
        }
    },
    onResize() {
        this.recalcLayout();
    },
    rpxToPx(rpx) {
        const sys = wx.getSystemInfoSync();
        return (sys.windowWidth * rpx) / 750;
    },
    safeBottomInsetPx() {
        const sys = wx.getSystemInfoSync();
        const safeArea = sys.safeArea;
        if (!safeArea || !Number.isFinite(safeArea.bottom))
            return 0;
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
    fetchOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({ url: `/orders/${id}`, method: 'GET' });
                const order = res.data;
                this.setData({ order });
                this.updateStatusUI(order.status);
                yield this.loadReviewState(order.id);
                setTimeout(() => this.recalcLayout(), 0);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '订单加载失败';
                this.setData({ errorMsg: msg });
            }
            finally {
                this.setData({ loading: false });
                setTimeout(() => this.recalcLayout(), 0);
            }
        });
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
    handlePay() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data.order || this.data.paying)
                return;
            this.setData({ paying: true, errorMsg: '' });
            try {
                const payload = { orderId: this.data.order.id };
                const prepayRes = yield (0, request_1.request)({
                    url: '/pay/wechat/prepay',
                    method: 'POST',
                    data: payload,
                });
                const payParams = prepayRes.data;
                if (String(payParams.paySign || '').startsWith('mock-sign-')) {
                    wx.showLoading({ title: '支付处理中...' });
                    const confirmRes = yield (0, request_1.request)({
                        url: '/pay/wechat/confirm',
                        method: 'POST',
                        data: payload,
                    });
                    wx.hideLoading();
                    this.setData({ order: confirmRes.data });
                    this.updateStatusUI(confirmRes.data.status);
                    wx.showToast({ title: '支付成功', icon: 'success' });
                    return;
                }
                yield new Promise((resolve, reject) => {
                    wx.requestPayment({
                        timeStamp: payParams.timeStamp,
                        nonceStr: payParams.nonceStr,
                        package: payParams.package || payParams.prepayPackage,
                        signType: payParams.signType,
                        paySign: payParams.paySign,
                        success: () => resolve(),
                        fail: (payErr) => reject(new Error(payErr.errMsg || '支付失败')),
                    });
                });
                wx.showToast({ title: '支付已提交', icon: 'success' });
                yield this.fetchOrder(this.data.order.id);
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
        });
    },
    handleUrge() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data.order || this.data.urgeLoading)
                return;
            if (this.data.order.status !== 'PAID' && this.data.order.status !== 'COOKING') {
                wx.showToast({ title: '当前状态不可催单', icon: 'none' });
                return;
            }
            this.setData({ urgeLoading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({
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
        });
    },
    handleCancel() {
        return __awaiter(this, void 0, void 0, function* () {
            const order = this.data.order;
            if (!order || order.status !== 'PENDING_PAY' || this.data.cancelLoading)
                return;
            this.setData({ cancelLoading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({
                    url: `/orders/${order.id}/cancel`,
                    method: 'POST',
                });
                this.setData({ order: res.data });
                this.updateStatusUI(res.data.status);
                wx.showToast({ title: '订单已取消', icon: 'success' });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '取消失败';
                this.setData({ errorMsg: msg });
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ cancelLoading: false });
            }
        });
    },
    loadReviewState(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!orderId)
                return;
            try {
                const res = yield (0, request_1.request)({
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
            }
            catch (_a) {
                this.setData({
                    reviewed: false,
                    reviewedAt: '',
                    reviewedContent: '',
                    reviewedRating: 0,
                });
            }
        });
    },
    handleRatingTap(e) {
        const score = Number(e.currentTarget.dataset.score || 0);
        if (!Number.isFinite(score) || score < 1 || score > 5)
            return;
        this.setData({ reviewRating: score });
    },
    handleReviewInput(e) {
        var _a;
        const value = String(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '');
        this.setData({ reviewContent: value });
    },
    submitReview() {
        return __awaiter(this, void 0, void 0, function* () {
            const order = this.data.order;
            if (!order || order.status !== 'DONE') {
                wx.showToast({ title: '订单完成后可评价', icon: 'none' });
                return;
            }
            if (this.data.reviewed) {
                wx.showToast({ title: '该订单已评价', icon: 'none' });
                return;
            }
            if (this.data.reviewSubmitting)
                return;
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
                const res = yield (0, request_1.request)({
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
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '评价失败';
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ reviewSubmitting: false });
            }
        });
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
    goSupport() {
        wx.navigateTo({ url: '/pages/support/index' });
    },
});
