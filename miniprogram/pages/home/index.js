"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        storeId: '',
        tableId: '',
        storeName: '未来餐厅',
        tableName: '',
        notices: [],
        dishes: [],
        comments: [],
        loading: false,
    },
    onLoad() {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session);
        if (session) {
            this.setData({
                storeId: session.storeId || '',
                storeName: session.storeName || '未来餐厅',
                tableId: session.tableId || '',
                tableName: session.tableName || '',
            });
        }
        else {
            wx.reLaunch({ url: '/pages/scan/index' });
            return;
        }
        this.fetchHomeData();
    },
    onPullDownRefresh() {
        this.fetchHomeData().then(() => {
            wx.stopPullDownRefresh();
        });
    },
    async fetchHomeData() {
        this.setData({ loading: true });
        try {
            const [noticeRes, menuRes, commentRes] = await Promise.all([
                (0, request_1.request)({ url: '/notices', method: 'GET' }),
                (0, request_1.request)({ url: '/menu', method: 'GET' }),
                (0, request_1.request)({ url: '/comments', method: 'GET' }),
            ]);
            const allDishes = menuRes.data.categories.flatMap((cat) => cat.dishes);
            this.setData({
                notices: noticeRes.data || [],
                dishes: allDishes,
                comments: commentRes.data || [],
            });
        }
        catch (err) {
            wx.showToast({ title: '加载数据失败', icon: 'none' });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    goMenu() {
        wx.navigateTo({
            url: `/pages/menu/index?storeId=${this.data.storeId}&tableId=${this.data.tableId}`,
        });
    },
});
