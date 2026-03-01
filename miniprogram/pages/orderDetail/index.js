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
        statusIcon: 'waiting', // success, waiting, cancel, warn
        paying: false
    },
    onLoad(options) {
        if (options.id) {
            this.fetchOrder(options.id);
        }
    },
    fetchOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                wx.showLoading({ title: '加载订单...' });
                const res = yield (0, request_1.request)({ url: `/orders/${id}`, method: 'GET' });
                const order = res.data;
                this.setData({ order });
                this.updateStatusUI(order.status);
            }
            catch (e) {
                console.error(e);
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
            finally {
                wx.hideLoading();
            }
        });
    },
    updateStatusUI(status) {
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
    handlePay() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data.order)
                return;
            this.setData({ paying: true });
            try {
                // 1. Get Prepay Info
                const res = yield (0, request_1.request)({
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
            }
            catch (e) {
                wx.showToast({ title: '支付失败', icon: 'none' });
                this.setData({ paying: false });
            }
        });
    }
});
