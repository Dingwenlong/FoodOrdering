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
        items: [],
        totalPrice: 0,
        submitting: false
    },
    onShow() {
        this.loadCart();
    },
    loadCart() {
        // 从本地存储读取购物车 (dishId -> qty)
        // 实际项目中应该还需要读取菜品详情来展示名称和价格，这里简化假设已经有详情或再次请求
        // 为了简化，我们假设 menu 页面存入的是完整信息，或者我们这里重新 fetch menu
        // 这里做个简单处理：从 storage 读取 cart 映射，并结合 menu 数据（需要 menu 页面配合存完整信息或者重新拉取）
        // 重新拉取 Menu 来匹配信息 (模拟)
        const cartMap = wx.getStorageSync('cart') || {};
        this.fetchMenuAndMatch(cartMap);
    },
    fetchMenuAndMatch(cartMap) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const storeId = wx.getStorageSync('storeId') || 's1';
                const res = yield (0, request_1.request)({ url: `/menu?storeId=${storeId}`, method: 'GET' });
                const categories = res.data;
                const items = [];
                let total = 0;
                categories.forEach((cat) => {
                    cat.dishes.forEach((dish) => {
                        if (cartMap[dish.id]) {
                            items.push({
                                dishId: dish.id,
                                dishName: dish.name,
                                unitPriceFen: dish.priceFen,
                                qty: cartMap[dish.id]
                            });
                            total += dish.priceFen * cartMap[dish.id];
                        }
                    });
                });
                this.setData({ items, totalPrice: total });
            }
            catch (e) {
                console.error(e);
            }
        });
    },
    updateQty(e) {
        const { id, delta } = e.currentTarget.dataset;
        const items = this.data.items.map(item => {
            if (item.dishId === id) {
                return Object.assign(Object.assign({}, item), { qty: item.qty + delta });
            }
            return item;
        }).filter(item => item.qty > 0);
        // Update Storage
        const newCartMap = {};
        let total = 0;
        items.forEach(item => {
            newCartMap[item.dishId] = item.qty;
            total += item.unitPriceFen * item.qty;
        });
        wx.setStorageSync('cart', newCartMap);
        this.setData({ items, totalPrice: total });
    },
    goBack() {
        wx.navigateBack();
    },
    submitOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.items.length === 0)
                return;
            this.setData({ submitting: true });
            try {
                const orderData = {
                    storeId: wx.getStorageSync('storeId'),
                    tableId: wx.getStorageSync('tableId'),
                    items: this.data.items,
                    totalPriceFen: this.data.totalPrice
                };
                const res = yield (0, request_1.request)({
                    url: '/orders',
                    method: 'POST',
                    data: orderData
                });
                if (res.statusCode === 200) {
                    // Clear Cart
                    wx.removeStorageSync('cart');
                    wx.showToast({ title: '下单成功', icon: 'success' });
                    setTimeout(() => {
                        wx.redirectTo({
                            url: `/pages/orderDetail/index?id=${res.data.id}`
                        });
                    }, 1500);
                }
            }
            catch (e) {
                wx.showToast({ title: '下单失败', icon: 'none' });
            }
            finally {
                this.setData({ submitting: false });
            }
        });
    }
});
