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
const DRINK_CATEGORY_PATTERN = /(饮品|饮料|奶茶|茶饮|果汁|咖啡)/;
const DRINK_DISH_PATTERN = /(可乐|雪碧|苏打|气泡|果汁|奶茶|咖啡|拿铁|美式|冰茶|奶昔|柠檬)/;
const DRINK_SPEC_GROUPS = [
    {
        key: 'size',
        label: '杯型',
        options: ['中杯', '大杯', '超大杯'],
    },
    {
        key: 'temp',
        label: '温度',
        options: ['正常冰', '少冰', '去冰', '常温'],
    },
    {
        key: 'sugar',
        label: '甜度',
        options: ['全糖', '七分糖', '五分糖', '无糖'],
    },
];
Page({
    data: {
        storeId: '',
        storeName: '',
        tableId: '',
        tableName: '',
        categories: [],
        viewCategories: [],
        currentCategory: '',
        sidebarToView: '',
        toView: '',
        sectionAnchors: [],
        keyword: '',
        cart: {},
        cartCount: 0,
        cartTotal: 0,
        loading: false,
        errorMsg: '',
        specVisible: false,
        specDish: null,
        specQty: 1,
        specGroups: [],
        specSelections: [],
        specSummary: '',
    },
    onLoad(options) {
        this.scrollLockUntil = 0;
        this.sectionMeasureTimer = null;
        this.specDraftMap = {};
        this.resolveSession(options);
        this.restoreCart();
        if (this.data.storeId) {
            this.fetchMenu(this.data.storeId);
        }
    },
    onShow() {
        this.restoreCart();
        this.calcTotal(this.data.cart, this.data.categories);
        this.scheduleMeasureSectionAnchors(120);
    },
    onPullDownRefresh() {
        if (!this.data.storeId) {
            wx.stopPullDownRefresh();
            return;
        }
        this.fetchMenu(this.data.storeId).finally(() => wx.stopPullDownRefresh());
    },
    onUnload() {
        const timer = this.sectionMeasureTimer;
        if (timer) {
            clearTimeout(timer);
            this.sectionMeasureTimer = null;
        }
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
        const cart = (wx.getStorageSync(request_1.STORAGE_KEYS.cart) || {});
        this.setData({ cart });
    },
    fetchMenu(storeId) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({
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
                    sidebarToView: nextCurrent ? `menu-tab-${nextCurrent}` : '',
                    sectionAnchors: [],
                }, () => {
                    this.scheduleMeasureSectionAnchors();
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
        });
    },
    isDrinkDish(dish, categoryName) {
        return DRINK_CATEGORY_PATTERN.test(categoryName) || DRINK_DISH_PATTERN.test(dish.name);
    },
    buildDrinkSpecGroups() {
        return DRINK_SPEC_GROUPS.map((group) => (Object.assign(Object.assign({}, group), { options: group.options.slice() })));
    },
    getSpecGroupsByDish(dish, categoryName) {
        if (!this.isDrinkDish(dish, categoryName))
            return [];
        return this.buildDrinkSpecGroups();
    },
    buildViewCategories(categories, keyword) {
        const normalizedKeyword = (keyword || '').trim().toLowerCase();
        return categories
            .map((category) => (Object.assign(Object.assign({}, category), { dishes: category.dishes
                .filter((dish) => {
                if (!normalizedKeyword)
                    return true;
                const name = dish.name.toLowerCase();
                const desc = (dish.description || '').toLowerCase();
                return name.includes(normalizedKeyword) || desc.includes(normalizedKeyword);
            })
                .map((dish) => (Object.assign(Object.assign({}, dish), { needSpec: this.isDrinkDish(dish, category.name) }))) })))
            .filter((category) => category.dishes.length > 0);
    },
    switchCategory(e) {
        const id = String(e.currentTarget.dataset.id || '');
        if (!id)
            return;
        this.scrollLockUntil = Date.now() + 420;
        this.setData({
            currentCategory: id,
            sidebarToView: `menu-tab-${id}`,
            toView: `cat-${id}`,
        });
    },
    handleMenuScroll(e) {
        var _a;
        const scrollTop = Number(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0);
        if (!Number.isFinite(scrollTop))
            return;
        const scrollLockUntil = Number(this.scrollLockUntil || 0);
        if (Date.now() < scrollLockUntil)
            return;
        this.syncCategoryByScroll(scrollTop);
    },
    syncCategoryByScroll(scrollTop, force = false) {
        const anchors = this.data.sectionAnchors;
        if (!anchors.length)
            return;
        const targetTop = scrollTop + 40;
        let nextCategory = anchors[0].id;
        for (const anchor of anchors) {
            if (targetTop >= anchor.top) {
                nextCategory = anchor.id;
            }
            else {
                break;
            }
        }
        if (!nextCategory || (!force && nextCategory === this.data.currentCategory))
            return;
        this.setData({
            currentCategory: nextCategory,
            sidebarToView: `menu-tab-${nextCategory}`,
            toView: '',
        });
    },
    scheduleMeasureSectionAnchors(delay = 60) {
        const timer = this.sectionMeasureTimer;
        if (timer) {
            clearTimeout(timer);
        }
        this.sectionMeasureTimer = setTimeout(() => {
            this.measureSectionAnchors();
        }, delay);
    },
    measureSectionAnchors() {
        if (!this.data.viewCategories.length) {
            this.setData({ sectionAnchors: [] });
            return;
        }
        const query = wx.createSelectorQuery();
        query.select('.menu-list').boundingClientRect();
        query.select('.menu-list').scrollOffset();
        query.selectAll('.category-section').boundingClientRect();
        query.exec((res) => {
            const listRect = res === null || res === void 0 ? void 0 : res[0];
            const scrollInfo = ((res === null || res === void 0 ? void 0 : res[1]) || {});
            const sectionRects = ((res === null || res === void 0 ? void 0 : res[2]) || []);
            if (!listRect || !sectionRects.length) {
                this.setData({ sectionAnchors: [] });
                return;
            }
            const scrollTop = Number(scrollInfo.scrollTop || 0);
            const anchors = sectionRects
                .map((rect, index) => {
                var _a;
                return ({
                    id: ((_a = this.data.viewCategories[index]) === null || _a === void 0 ? void 0 : _a.id) || '',
                    top: rect.top - listRect.top + scrollTop,
                });
            })
                .filter((item) => item.id)
                .sort((a, b) => a.top - b.top);
            this.setData({ sectionAnchors: anchors });
            this.syncCategoryByScroll(scrollTop, true);
        });
    },
    handleKeywordInput(e) {
        var _a, _b;
        const keyword = ((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '';
        const viewCategories = this.buildViewCategories(this.data.categories, keyword);
        const currentCategory = viewCategories.some((item) => item.id === this.data.currentCategory)
            ? this.data.currentCategory
            : (((_b = viewCategories[0]) === null || _b === void 0 ? void 0 : _b.id) || '');
        this.setData({
            keyword,
            viewCategories,
            currentCategory,
            sidebarToView: currentCategory ? `menu-tab-${currentCategory}` : '',
            toView: '',
            sectionAnchors: [],
        }, () => {
            this.scheduleMeasureSectionAnchors();
        });
    },
    clearKeyword() {
        var _a;
        const viewCategories = this.buildViewCategories(this.data.categories, '');
        const currentCategory = ((_a = viewCategories[0]) === null || _a === void 0 ? void 0 : _a.id) || '';
        this.setData({
            keyword: '',
            viewCategories,
            currentCategory,
            sidebarToView: currentCategory ? `menu-tab-${currentCategory}` : '',
            toView: '',
            sectionAnchors: [],
        }, () => {
            this.scheduleMeasureSectionAnchors();
        });
    },
    findDishMeta(dishId) {
        for (const category of this.data.categories) {
            const found = category.dishes.find((dish) => dish.id === dishId);
            if (found) {
                return { dish: found, categoryName: category.name };
            }
        }
        return null;
    },
    applyCartDelta(dishId, delta) {
        if (!dishId || !delta)
            return;
        const cart = Object.assign({}, this.data.cart);
        const nextQty = (cart[dishId] || 0) + delta;
        if (nextQty < 0)
            return;
        if (nextQty === 0) {
            delete cart[dishId];
        }
        else {
            cart[dishId] = nextQty;
        }
        this.setData({ cart });
        this.saveCart(cart);
        this.calcTotal(cart, this.data.categories);
    },
    updateCart(e) {
        const id = String(e.currentTarget.dataset.id || '');
        const delta = Number(e.currentTarget.dataset.delta || 0);
        if (!id || !delta)
            return;
        const dishMeta = this.findDishMeta(id);
        if (!dishMeta) {
            wx.showToast({ title: '菜品不存在', icon: 'none' });
            return;
        }
        const { dish, categoryName } = dishMeta;
        if (dish.onSale === false || dish.soldOut) {
            wx.showToast({ title: '该菜品暂不可下单', icon: 'none' });
            return;
        }
        const needSpec = this.getSpecGroupsByDish(dish, categoryName).length > 0;
        if (needSpec && delta > 0) {
            this.openSpecByDish(dish, categoryName);
            return;
        }
        this.applyCartDelta(id, delta);
    },
    noopTap() { },
    openSpecByDish(dish, categoryName) {
        const specGroups = this.getSpecGroupsByDish(dish, categoryName);
        if (!specGroups.length) {
            this.applyCartDelta(dish.id, 1);
            return;
        }
        const draftMap = (this.specDraftMap || {});
        const draftSelections = draftMap[dish.id] || [];
        const specSelections = specGroups.map((group, index) => {
            const selected = Number(draftSelections[index]);
            if (!Number.isFinite(selected) || selected < 0 || selected >= group.options.length) {
                return 0;
            }
            return selected;
        });
        const specSummary = this.buildSpecSummary(specGroups, specSelections);
        this.setData({
            specVisible: true,
            specDish: dish,
            specQty: 1,
            specGroups,
            specSelections,
            specSummary,
        });
    },
    openSpec(e) {
        const id = String(e.currentTarget.dataset.id || '');
        if (!id)
            return;
        const dishMeta = this.findDishMeta(id);
        if (!dishMeta) {
            wx.showToast({ title: '菜品不存在', icon: 'none' });
            return;
        }
        const { dish, categoryName } = dishMeta;
        if (dish.onSale === false || dish.soldOut) {
            wx.showToast({ title: '该菜品暂不可下单', icon: 'none' });
            return;
        }
        this.openSpecByDish(dish, categoryName);
    },
    closeSpec() {
        this.setData({
            specVisible: false,
            specDish: null,
            specQty: 1,
            specGroups: [],
            specSelections: [],
            specSummary: '',
        });
    },
    buildSpecSummary(specGroups, specSelections) {
        return specGroups
            .map((group, index) => group.options[specSelections[index] || 0])
            .filter(Boolean)
            .join(' / ');
    },
    selectSpecOption(e) {
        var _a;
        const groupIndex = Number(e.currentTarget.dataset.groupIndex || 0);
        const optionIndex = Number(e.currentTarget.dataset.optionIndex || 0);
        const group = this.data.specGroups[groupIndex];
        if (!group)
            return;
        if (!Number.isFinite(optionIndex) || optionIndex < 0 || optionIndex >= group.options.length)
            return;
        const specSelections = this.data.specSelections.slice();
        specSelections[groupIndex] = optionIndex;
        const specSummary = this.buildSpecSummary(this.data.specGroups, specSelections);
        this.setData({
            specSelections,
            specSummary,
        });
        const dishId = (_a = this.data.specDish) === null || _a === void 0 ? void 0 : _a.id;
        if (dishId) {
            const draftMap = Object.assign({}, (this.specDraftMap || {}));
            draftMap[dishId] = specSelections;
            this.specDraftMap = draftMap;
        }
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
        const summary = this.data.specSummary;
        this.applyCartDelta(dish.id, qty);
        this.closeSpec();
        wx.showToast({
            title: summary ? `已加入${qty}份(${summary})` : `已加入${qty}份`,
            icon: 'none',
        });
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
