"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        storeId: '',
        storeName: '',
        tableId: '',
        tableName: '',
        categories: [],
        viewCategories: [],
        currentCategory: '',
        toView: '',
        keyword: '',
        cart: {},
        cartCount: 0,
        cartTotal: 0,
        loading: false,
        errorMsg: '',
        specVisible: false,
        specDish: null,
        specQty: 1,
        specTasteOptions: ['标准口味', '少辣', '中辣', '重辣'],
        specTasteIndex: 0,
    },
    onLoad(options) {
        this.resolveSession(options || {});
        this.restoreCart();
        if (this.data.storeId) {
            this.fetchMenu(this.data.storeId);
        }
    },
    onShow() {
        this.restoreCart();
        this.calcTotal(this.data.cart, this.data.categories);
    },
    onPullDownRefresh() {
        if (!this.data.storeId) {
            wx.stopPullDownRefresh();
            return;
        }
        this.fetchMenu(this.data.storeId).finally(() => wx.stopPullDownRefresh());
    },
    resolveSession(options) {
        const cachedSession = wx.getStorageSync(request_1.STORAGE_KEYS.session) || {};
        const storeId = (options.storeId || cachedSession.storeId || '').trim();
        const tableId = (options.tableId || cachedSession.tableId || '').trim();
        if (!storeId || !tableId) {
            this.setData({ errorMsg: '未检测到桌台信息，请先扫码绑定桌台' });
            wx.showToast({ title: '请先绑定桌台', icon: 'none' });
            setTimeout(() => {
                wx.redirectTo({ url: '/pages/scan/index' });
            }, 240);
            return;
        }
        const storeName = options.storeName || cachedSession.storeName || '未来餐厅';
        const tableName = options.tableName || cachedSession.tableName || `桌号${tableId}`;
        const session = { storeId, storeName, tableId, tableName };
        wx.setStorageSync(request_1.STORAGE_KEYS.session, session);
        wx.setStorageSync('storeId', storeId);
        wx.setStorageSync('tableId', tableId);
        this.setData(session);
    },
    restoreCart() {
        const cart = wx.getStorageSync(request_1.STORAGE_KEYS.cart) || {};
        this.setData({ cart });
    },
    async fetchMenu(storeId) {
        var _a, _b;
        this.setData({ loading: true, errorMsg: '' });
        try {
            const res = await (0, request_1.request)({
                url: `/menu?storeId=${encodeURIComponent(storeId)}`,
                method: 'GET',
            });
            const payload = res.data;
            const categories = (payload.categories || []).map((category) => (Object.assign(Object.assign({}, category), { dishes: (category.dishes || []).slice().sort((a, b) => Number(a.id) - Number(b.id)) })));
            const viewCategories = this.buildViewCategories(categories, this.data.keyword);
            const fallbackCurrent = this.data.currentCategory || ((_a = viewCategories[0]) === null || _a === void 0 ? void 0 : _a.id) || '';
            const nextCurrent = viewCategories.some((item) => item.id === fallbackCurrent)
                ? fallbackCurrent
                : (((_b = viewCategories[0]) === null || _b === void 0 ? void 0 : _b.id) || '');
            this.setData({
                storeName: payload.storeName || this.data.storeName,
                categories,
                viewCategories,
                currentCategory: nextCurrent,
            });
            wx.setStorageSync('menuCache', {
                storeId,
                categories,
                updatedAt: Date.now(),
            });
            this.calcTotal(this.data.cart, categories);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '加载菜单失败';
            this.setData({ errorMsg: msg });
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ loading: false });
        }
    },
    buildViewCategories(categories, keyword) {
        const normalizedKeyword = (keyword || '').trim().toLowerCase();
        if (!normalizedKeyword) {
            return categories;
        }
        return categories
            .map((category) => (Object.assign(Object.assign({}, category), { dishes: category.dishes.filter((dish) => {
                const name = dish.name.toLowerCase();
                const desc = (dish.description || '').toLowerCase();
                return name.includes(normalizedKeyword) || desc.includes(normalizedKeyword);
            }) })))
            .filter((category) => category.dishes.length > 0);
    },
    switchCategory(e) {
        const id = String(e.currentTarget.dataset.id || '');
        if (!id)
            return;
        this.setData({
            currentCategory: id,
            toView: `cat-${id}`,
        });
    },
    handleKeywordInput(e) {
        var _a;
        const keyword = e.detail.value || '';
        const viewCategories = this.buildViewCategories(this.data.categories, keyword);
        const currentCategory = viewCategories.some((item) => item.id === this.data.currentCategory)
            ? this.data.currentCategory
            : (((_a = viewCategories[0]) === null || _a === void 0 ? void 0 : _a.id) || '');
        this.setData({
            keyword,
            viewCategories,
            currentCategory,
        });
    },
    clearKeyword() {
        var _a;
        const viewCategories = this.buildViewCategories(this.data.categories, '');
        this.setData({
            keyword: '',
            viewCategories,
            currentCategory: ((_a = viewCategories[0]) === null || _a === void 0 ? void 0 : _a.id) || '',
        });
    },
    findDish(dishId) {
        for (const category of this.data.categories) {
            const found = category.dishes.find((dish) => dish.id === dishId);
            if (found)
                return found;
        }
        return null;
    },
    updateCart(e) {
        const id = String(e.currentTarget.dataset.id || '');
        const delta = Number(e.currentTarget.dataset.delta || 0);
        if (!id || !delta)
            return;
        const dish = this.findDish(id);
        if (!dish) {
            wx.showToast({ title: '菜品不存在', icon: 'none' });
            return;
        }
        if (dish.onSale === false || dish.soldOut) {
            wx.showToast({ title: '该菜品暂不可下单', icon: 'none' });
            return;
        }
        const cart = Object.assign({}, this.data.cart);
        const nextQty = (cart[id] || 0) + delta;
        if (nextQty < 0)
            return;
        if (nextQty === 0) {
            delete cart[id];
        }
        else {
            cart[id] = nextQty;
        }
        this.setData({ cart });
        this.saveCart(cart);
        this.calcTotal(cart, this.data.categories);
    },
    noopTap() { },
    openSpec(e) {
        const id = String(e.currentTarget.dataset.id || '');
        if (!id)
            return;
        const dish = this.findDish(id);
        if (!dish) {
            wx.showToast({ title: '菜品不存在', icon: 'none' });
            return;
        }
        if (dish.onSale === false || dish.soldOut) {
            wx.showToast({ title: '该菜品暂不可下单', icon: 'none' });
            return;
        }
        this.setData({
            specVisible: true,
            specDish: dish,
            specQty: 1,
            specTasteIndex: 0,
        });
    },
    closeSpec() {
        this.setData({
            specVisible: false,
            specDish: null,
            specQty: 1,
            specTasteIndex: 0,
        });
    },
    selectSpecTaste(e) {
        const index = Number(e.currentTarget.dataset.index || 0);
        if (!Number.isFinite(index) || index < 0 || index >= this.data.specTasteOptions.length)
            return;
        this.setData({ specTasteIndex: index });
    },
    updateSpecQty(e) {
        const delta = Number(e.currentTarget.dataset.delta || 0);
        if (!delta)
            return;
        const next = Math.max(1, Math.min(99, this.data.specQty + delta));
        this.setData({ specQty: next });
    },
    confirmSpecAdd() {
        const dish = this.data.specDish;
        if (!dish)
            return;
        const qty = this.data.specQty;
        const taste = this.data.specTasteOptions[this.data.specTasteIndex] || '标准口味';
        const cart = Object.assign({}, this.data.cart);
        cart[dish.id] = (cart[dish.id] || 0) + qty;
        this.setData({ cart });
        this.saveCart(cart);
        this.calcTotal(cart, this.data.categories);
        this.closeSpec();
        wx.showToast({ title: `已加入${qty}份(${taste})`, icon: 'none' });
    },
    saveCart(cart) {
        wx.setStorageSync(request_1.STORAGE_KEYS.cart, cart);
    },
    calcTotal(cart, categories) {
        let cartCount = 0;
        let cartTotal = 0;
        const dishMap = {};
        categories.forEach((category) => {
            category.dishes.forEach((dish) => {
                dishMap[dish.id] = dish;
            });
        });
        Object.keys(cart).forEach((dishId) => {
            const qty = Number(cart[dishId] || 0);
            if (qty <= 0)
                return;
            const dish = dishMap[dishId];
            if (!dish)
                return;
            cartCount += qty;
            cartTotal += dish.priceFen * qty;
        });
        this.setData({ cartCount, cartTotal });
    },
    goToCart() {
        if (this.data.cartCount <= 0) {
            wx.showToast({ title: '请先选择菜品', icon: 'none' });
            return;
        }
        wx.navigateTo({
            url: `/pages/cart/index?storeId=${this.data.storeId}&tableId=${this.data.tableId}`,
        });
    },
    goScan() {
        wx.redirectTo({ url: '/pages/scan/index' });
    },
});
