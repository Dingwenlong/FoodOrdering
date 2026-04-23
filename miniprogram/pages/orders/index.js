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
        loading: false,
        orders: [],
        errorMsg: '',
    },
    onLoad() {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session);
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
    fetchOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({ url: '/orders', method: 'GET' });
                this.setData({ orders: res.data || [] });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '订单加载失败';
                this.setData({ errorMsg: msg });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    goOrderDetail(e) {
        const id = String(e.currentTarget.dataset.id || '').trim();
        if (!id)
            return;
        wx.navigateTo({ url: `/pages/orderDetail/index?id=${id}` });
    },
    goMenu() {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session) || {};
        if (!session.storeId || !session.tableId) {
            wx.reLaunch({ url: '/pages/scan/index' });
            return;
        }
        wx.redirectTo({
            url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
        });
    },
});
