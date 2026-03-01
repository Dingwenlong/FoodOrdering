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
        categories: [],
        currentCategory: '',
        toView: '',
        cart: {}, // dishId -> quantity
        cartCount: 0,
        cartTotal: 0,
    },
    onLoad(options) {
        console.log('Menu Page Loaded', options);
        this.fetchMenu(options.storeId || 's1');
    },
    fetchMenu(storeId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                wx.showLoading({ title: '加载菜单...' });
                const res = yield (0, request_1.request)({ url: `/menu?storeId=${storeId}`, method: 'GET' });
                const categories = res.data;
                this.setData({
                    categories,
                    currentCategory: ((_a = categories[0]) === null || _a === void 0 ? void 0 : _a.id) || ''
                });
            }
            catch (err) {
                console.error(err);
                wx.showToast({ title: '加载失败', icon: 'none' });
            }
            finally {
                wx.hideLoading();
            }
        });
    },
    switchCategory(e) {
        const id = e.currentTarget.dataset.id;
        this.setData({
            currentCategory: id,
            toView: `cat-${id}`
        });
    },
    updateCart(e) {
        const { id, delta } = e.currentTarget.dataset;
        const { cart, categories } = this.data;
        const newQty = (cart[id] || 0) + delta;
        if (newQty < 0)
            return;
        const newCart = Object.assign(Object.assign({}, cart), { [id]: newQty });
        if (newQty === 0)
            delete newCart[id];
        this.setData({ cart: newCart });
        this.calcTotal(newCart, categories);
    },
    calcTotal(cart, categories) {
        let count = 0;
        let total = 0;
        // 平铺所有菜品方便查找
        const dishesMap = {};
        categories.forEach(cat => {
            cat.dishes.forEach(dish => {
                dishesMap[dish.id] = dish;
            });
        });
        Object.keys(cart).forEach(id => {
            const qty = cart[id];
            const dish = dishesMap[id];
            if (dish) {
                count += qty;
                total += dish.priceFen * qty;
            }
        });
        this.setData({
            cartCount: count,
            cartTotal: total
        });
    },
    goToCart() {
        // 将购物车数据存入本地，传给购物车页面
        wx.setStorageSync('cart', this.data.cart);
        wx.navigateTo({ url: '/pages/cart/index' });
    }
});
