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
        storeId: '',
        tableId: '',
        tableName: '',
        items: [],
        totalPrice: 0,
        serviceFee: 0,
        payablePrice: 0,
        remark: '',
        remarkLimit: 80,
        remarkLength: 0,
        submitting: false,
        loading: false,
        errorMsg: '',
        contentMaxHeightPx: 9999,
        keyboardHeightPx: 0,
    },
    onLoad(options) {
        this.resolveSession(options);
        this._keyboardHandler = (res) => {
            const height = Math.max(0, Math.floor(Number((res === null || res === void 0 ? void 0 : res.height) || 0)));
            if (height === this.data.keyboardHeightPx)
                return;
            this.setData({ keyboardHeightPx: height }, () => this.recalcLayout());
        };
    },
    onReady() {
        this.recalcLayout();
    },
    onShow() {
        this.attachKeyboard();
        const remark = String(wx.getStorageSync(request_1.STORAGE_KEYS.cartRemark) || '');
        this.setData({ remark, remarkLength: remark.length });
        this.loadCart();
    },
    onHide() {
        this.detachKeyboard();
    },
    onUnload() {
        this.detachKeyboard();
    },
    onResize() {
        this.recalcLayout();
    },
    attachKeyboard() {
        const self = this;
        if (self._kbdAttached)
            return;
        wx.onKeyboardHeightChange(self._keyboardHandler);
        self._kbdAttached = true;
    },
    detachKeyboard() {
        const self = this;
        if (!self._kbdAttached)
            return;
        wx.offKeyboardHeightChange(self._keyboardHandler);
        self._kbdAttached = false;
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
        const keyboardHeightPx = Math.max(0, Math.floor(Number(this.data.keyboardHeightPx || 0)));
        wx.createSelectorQuery()
            .select('.footer')
            .boundingClientRect((rect) => {
            const footerHeightPx = rect && typeof rect.height === 'number' ? rect.height : 0;
            const maxHeight = sys.windowHeight - footerHeightPx - safeGapPx - safeBottomInsetPx - keyboardHeightPx;
            this.setData({ contentMaxHeightPx: Math.max(240, Math.floor(maxHeight)) });
        })
            .exec();
    },
    resolveSession(options) {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session) || {};
        const storeId = (options.storeId || session.storeId || '').trim();
        const tableId = (options.tableId || session.tableId || '').trim();
        const tableName = (options.tableName || session.tableName || `桌号${tableId}`).trim();
        if (!storeId || !tableId) {
            wx.showToast({ title: '请先绑定桌台', icon: 'none' });
            setTimeout(() => wx.redirectTo({ url: '/pages/scan/index' }), 240);
            return;
        }
        this.setData({ storeId, tableId, tableName });
    },
    loadCart() {
        return __awaiter(this, void 0, void 0, function* () {
            const cartMap = (wx.getStorageSync(request_1.STORAGE_KEYS.cart) || {});
            const dishIds = Object.keys(cartMap).filter((id) => Number(cartMap[id]) > 0);
            if (dishIds.length === 0) {
                this.setData({ items: [], totalPrice: 0, payablePrice: 0, errorMsg: '' });
                setTimeout(() => this.recalcLayout(), 0);
                return;
            }
            this.setData({ loading: true, errorMsg: '' });
            try {
                const menuCache = wx.getStorageSync('menuCache') || {};
                let categories = [];
                if (menuCache.storeId === this.data.storeId && Array.isArray(menuCache.categories)) {
                    categories = menuCache.categories;
                }
                else {
                    const res = yield (0, request_1.request)({
                        url: `/menu?storeId=${encodeURIComponent(this.data.storeId)}`,
                        method: 'GET',
                    });
                    categories = res.data.categories || [];
                    wx.setStorageSync('menuCache', {
                        storeId: this.data.storeId,
                        categories,
                        updatedAt: Date.now(),
                    });
                }
                const items = this.buildItems(categories, cartMap);
                const totals = this.calcTotals(items);
                this.setData({
                    items,
                    totalPrice: totals.totalPrice,
                    payablePrice: totals.totalPrice + this.data.serviceFee,
                });
                this.syncCartStorage(items);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '加载购物车失败';
                this.setData({ errorMsg: msg });
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ loading: false });
                setTimeout(() => this.recalcLayout(), 0);
            }
        });
    },
    buildItems(categories, cartMap) {
        const dishMap = {};
        categories.forEach((category) => {
            category.dishes.forEach((dish) => {
                dishMap[dish.id] = { name: dish.name, priceFen: dish.priceFen };
            });
        });
        return Object.keys(cartMap)
            .filter((dishId) => Number(cartMap[dishId]) > 0 && Boolean(dishMap[dishId]))
            .map((dishId) => ({
            dishId,
            dishName: dishMap[dishId].name,
            unitPriceFen: dishMap[dishId].priceFen,
            qty: Number(cartMap[dishId]),
        }));
    },
    calcTotals(items) {
        const totalPrice = items.reduce((sum, item) => sum + item.unitPriceFen * item.qty, 0);
        return { totalPrice };
    },
    updateQty(e) {
        const id = String(e.currentTarget.dataset.id || '');
        const delta = Number(e.currentTarget.dataset.delta || 0);
        if (!id || !delta)
            return;
        const items = this.data.items
            .map((item) => {
            if (item.dishId !== id)
                return item;
            return Object.assign(Object.assign({}, item), { qty: item.qty + delta });
        })
            .filter((item) => item.qty > 0);
        const totals = this.calcTotals(items);
        this.setData({
            items,
            totalPrice: totals.totalPrice,
            payablePrice: totals.totalPrice + this.data.serviceFee,
        });
        this.syncCartStorage(items);
    },
    syncCartStorage(items) {
        const cartMap = {};
        items.forEach((item) => {
            cartMap[item.dishId] = item.qty;
        });
        wx.setStorageSync(request_1.STORAGE_KEYS.cart, cartMap);
    },
    clearCart() {
        wx.showModal({
            title: '清空购物车',
            content: '确认清空当前已选菜品吗？',
            success: (res) => {
                if (!res.confirm)
                    return;
                wx.removeStorageSync(request_1.STORAGE_KEYS.cart);
                this.setData({
                    items: [],
                    totalPrice: 0,
                    payablePrice: 0,
                });
            },
        });
    },
    handleRemarkInput(e) {
        var _a;
        const value = String(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '').slice(0, this.data.remarkLimit);
        this.setData({
            remark: value,
            remarkLength: value.length,
        });
        wx.setStorageSync(request_1.STORAGE_KEYS.cartRemark, value);
    },
    goBack() {
        wx.navigateBack();
    },
    submitOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data.items.length === 0) {
                wx.showToast({ title: '购物车为空', icon: 'none' });
                return;
            }
            this.setData({ submitting: true, errorMsg: '' });
            try {
                const payload = {
                    storeId: this.data.storeId,
                    tableId: this.data.tableId,
                    items: this.data.items.map((item) => ({
                        dishId: item.dishId,
                        qty: item.qty,
                    })),
                    remark: this.data.remark.trim(),
                };
                const res = yield (0, request_1.request)({
                    url: '/orders',
                    method: 'POST',
                    data: payload,
                });
                const orderId = String(res.data.id || '');
                if (!orderId) {
                    throw new Error('订单创建失败');
                }
                wx.removeStorageSync(request_1.STORAGE_KEYS.cart);
                wx.removeStorageSync(request_1.STORAGE_KEYS.cartRemark);
                wx.setStorageSync(request_1.STORAGE_KEYS.lastOrderId, orderId);
                wx.showToast({ title: '下单成功', icon: 'success' });
                setTimeout(() => {
                    wx.redirectTo({
                        url: `/pages/orderDetail/index?id=${orderId}`,
                    });
                }, 260);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '下单失败';
                this.setData({ errorMsg: msg });
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ submitting: false });
            }
        });
    },
});
