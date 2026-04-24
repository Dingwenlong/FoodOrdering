"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        loading: true,
        errorMsg: '',
        tableName: '',
        orderCount: 0,
        notices: [],
        selectedNotice: null,
        comments: [],
    },
    onLoad() {
        console.log('首页加载');
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session);
        if (session) {
            this.setData({ tableName: session.tableName });
        }
        this.fetchData();
    },
    async fetchData() {
        try {
            this.setData({ loading: true, errorMsg: '' });
            const [noticeRes, commentsRes] = await Promise.all([
                (0, request_1.request)({ url: '/notices', method: 'GET' }),
                (0, request_1.request)({ url: '/comments?limit=3', method: 'GET' }),
            ]);
            console.log('公告数据:', noticeRes);
            console.log('评论数据:', commentsRes);
            this.setData({
                notices: noticeRes.data || [],
                comments: commentsRes.data || [],
                loading: false
            });
        }
        catch (err) {
            console.error('获取数据失败:', err);
            this.setData({
                errorMsg: '获取数据失败，请重试',
                loading: false
            });
        }
    },
    goMenu() {
        wx.navigateTo({ url: '/pages/menu/index' });
    },
    goOrders() {
        wx.navigateTo({ url: '/pages/orders/index' });
    },
    goSupport() {
        wx.navigateTo({ url: '/pages/support/index' });
    },
    openNotice(e) {
        const id = String(e.currentTarget.dataset.id || '');
        const notice = this.data.notices.find((item) => String(item.id) === id);
        if (notice) {
            this.setData({ selectedNotice: notice });
        }
    },
    closeNotice() {
        this.setData({ selectedNotice: null });
    },
    noop() { },
    goScan() {
        wx.navigateTo({ url: '/pages/scan/index' });
    }
});
