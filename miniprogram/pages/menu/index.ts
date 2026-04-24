import { request, STORAGE_KEYS } from '../../utils/request';
import type { CartItem, Category, Dish, MenuResult } from '../../types/index';

type DishCountMap = Record<string, number>;
type SpecGroup = {
  key: string;
  label: string;
  options: string[];
};
type ViewDish = Dish & { needSpec: boolean };
type ViewCategory = Omit<Category, 'dishes'> & { dishes: ViewDish[] };

const DRINK_CATEGORY_PATTERN = /(饮品|饮料|奶茶|茶饮|果汁|咖啡)/;
const DRINK_DISH_PATTERN = /(可乐|雪碧|苏打|气泡|果汁|奶茶|咖啡|拿铁|美式|冰茶|奶昔|柠檬)/;
const DRINK_SPEC_GROUPS: SpecGroup[] = [
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
    categories: [] as Category[],
    viewCategories: [] as ViewCategory[],
    currentCategory: '',
    sidebarToView: '',
    toView: '',
    sectionAnchors: [] as Array<{ id: string; top: number }>,
    keyword: '',
    cartItems: [] as CartItem[],
    dishCartCounts: {} as DishCountMap,
    cartCount: 0,
    cartTotal: 0,
    loading: false,
    errorMsg: '',
    specVisible: false,
    specDish: null as Dish | null,
    specQty: 1,
    specGroups: [] as SpecGroup[],
    specSelections: [] as number[],
    specSummary: '',
  },

  onLoad(options: Record<string, string>) {
    (this as any).scrollLockUntil = 0;
    (this as any).sectionMeasureTimer = null;
    (this as any).specDraftMap = {};
    (this as any).wsSocketTask = null;
    (this as any).allowSocketReconnect = true;

    this.resolveSession(options);
    this.restoreCart();
    if (this.data.storeId) {
      this.fetchMenu(this.data.storeId);
    }
    this.initWebSocket();
  },

  onUnload() {
    (this as any).allowSocketReconnect = false;
    const timer = (this as any).sectionMeasureTimer;
    if (timer) {
      clearTimeout(timer);
      (this as any).sectionMeasureTimer = null;
    }
    this.closeWebSocket();
  },

  initWebSocket() {
    try {
      const BASE_URL = String(wx.getStorageSync('MP_API_BASE_URL') || 'http://localhost:8080').replace(/\/+$/, '');
      const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/api/ws/menu';
      console.log('连接 WebSocket:', wsUrl);
      
      const socketTask = wx.connectSocket({
        url: wsUrl,
        protocols: [],
      });

      (this as any).wsSocketTask = socketTask;

      socketTask.onOpen(() => {
        console.log('WebSocket 连接已打开');
      });

      socketTask.onMessage((res) => {
        console.log('收到 WebSocket 消息:', res.data);
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (data.type === 'menu_updated') {
            console.log('菜单已更新，正在刷新...');
            if (this.data.storeId) {
              this.fetchMenu(this.data.storeId);
            }
          }
        } catch (e) {
          console.error('解析 WebSocket 消息失败:', e);
        }
      });

      socketTask.onError((err) => {
        console.error('WebSocket 连接错误:', err);
      });

      socketTask.onClose(() => {
        if (!(this as any).allowSocketReconnect) return;
        console.log('WebSocket 连接已关闭，5秒后重连...');
        setTimeout(() => {
          if ((this as any).allowSocketReconnect) {
            this.initWebSocket();
          }
        }, 5000);
      });
    } catch (e) {
      console.error('初始化 WebSocket 失败:', e);
    }
  },

  closeWebSocket() {
    (this as any).allowSocketReconnect = false;
    const socketTask = (this as any).wsSocketTask;
    if (socketTask) {
      try {
        socketTask.close();
      } catch (e) {
        console.error('关闭 WebSocket 失败:', e);
      }
      (this as any).wsSocketTask = null;
    }
  },

  onShow() {
    (this as any).allowSocketReconnect = true;
    this.restoreCart(this.data.categories);
    this.scheduleMeasureSectionAnchors(120);
  },

  onPullDownRefresh() {
    if (!this.data.storeId) {
      wx.stopPullDownRefresh();
      return;
    }
    this.fetchMenu(this.data.storeId).finally(() => wx.stopPullDownRefresh());
  },

  resolveSession(options: Record<string, string>) {
    const cachedSession = wx.getStorageSync(STORAGE_KEYS.session) || {};
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
    wx.setStorageSync(STORAGE_KEYS.session, session);
    wx.setStorageSync('storeId', storeId);
    wx.setStorageSync('tableId', tableId);

    this.setData(session);
  },

  makeCartKey(dishId: string, skuName = '') {
    return `${dishId}::${skuName.trim()}`;
  },

  buildDishMap(categories: Category[]) {
    const dishMap: Record<string, Dish> = {};
    categories.forEach((category) => {
      category.dishes.forEach((dish) => {
        dishMap[dish.id] = dish;
      });
    });
    return dishMap;
  },

  normalizeCartItems(raw: unknown, categories: Category[] = []): CartItem[] {
    const dishMap = this.buildDishMap(categories);

    if (Array.isArray(raw)) {
      return raw
        .map((item: any) => {
          const dishId = String(item?.dishId || '').trim();
          const skuName = String(item?.skuName || '').trim();
          const dish = dishMap[dishId];
          const qty = Number(item?.qty || 0);
          if (!dishId || qty <= 0) return null;
          return {
            cartKey: this.makeCartKey(dishId, skuName),
            dishId,
            dishName: String(dish?.name || item?.dishName || ''),
            unitPriceFen: Number(dish?.priceFen ?? item?.unitPriceFen ?? 0) || 0,
            qty,
            skuName,
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];
    }

    if (raw && typeof raw === 'object') {
      return Object.keys(raw as Record<string, number>)
        .map((dishId) => {
          const qty = Number((raw as Record<string, number>)[dishId] || 0);
          const dish = dishMap[dishId];
          if (!dishId || qty <= 0) return null;
          return {
            cartKey: this.makeCartKey(dishId),
            dishId,
            dishName: String(dish?.name || ''),
            unitPriceFen: Number(dish?.priceFen || 0),
            qty,
            skuName: '',
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];
    }

    return [];
  },

  restoreCart(categories: Category[] = []) {
    const cartItems = this.normalizeCartItems(wx.getStorageSync(STORAGE_KEYS.cart), categories);
    this.setData({ cartItems });
    this.saveCart(cartItems);
    this.calcTotal(cartItems);
  },

  async fetchMenu(storeId: string) {
    this.setData({ loading: true, errorMsg: '' });
    try {
      const res = await request<MenuResult>({
        url: `/menu?storeId=${encodeURIComponent(storeId)}`,
        method: 'GET',
      });

      const payload = res.data;
      const categories = (payload.categories || []).map((category) => ({
        ...category,
        dishes: (category.dishes || []).slice(),
      }));

      const viewCategories = this.buildViewCategories(categories, this.data.keyword);
      const fallbackCurrent = this.data.currentCategory || viewCategories[0]?.id || '';
      const nextCurrent = viewCategories.some((item) => item.id === fallbackCurrent)
        ? fallbackCurrent
        : (viewCategories[0]?.id || '');

      this.setData(
        {
          storeName: payload.storeName || this.data.storeName,
          categories,
          viewCategories,
          currentCategory: nextCurrent,
          sidebarToView: nextCurrent ? `menu-tab-${nextCurrent}` : '',
          sectionAnchors: [],
        },
        () => {
          this.scheduleMeasureSectionAnchors();
        },
      );

      wx.setStorageSync('menuCache', {
        storeId,
        categories,
        updatedAt: Date.now(),
      });

      this.restoreCart(categories);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载菜单失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  isDrinkDish(dish: Dish, categoryName: string): boolean {
    return DRINK_CATEGORY_PATTERN.test(categoryName) || DRINK_DISH_PATTERN.test(dish.name);
  },

  buildDrinkSpecGroups(): SpecGroup[] {
    return DRINK_SPEC_GROUPS.map((group) => ({
      ...group,
      options: group.options.slice(),
    }));
  },

  getSpecGroupsByDish(dish: Dish, categoryName: string): SpecGroup[] {
    if (!this.isDrinkDish(dish, categoryName)) return [];
    return this.buildDrinkSpecGroups();
  },

  buildViewCategories(categories: Category[], keyword: string): ViewCategory[] {
    const normalizedKeyword = (keyword || '').trim().toLowerCase();
    return categories
      .map((category) => ({
        ...category,
        dishes: category.dishes
          .filter((dish) => {
            if (!normalizedKeyword) return true;
            const name = dish.name.toLowerCase();
            const desc = (dish.description || '').toLowerCase();
            return name.includes(normalizedKeyword) || desc.includes(normalizedKeyword);
          })
          .map((dish) => ({
            ...dish,
            needSpec: this.isDrinkDish(dish, category.name),
          })),
      }))
      .filter((category) => category.dishes.length > 0);
  },

  switchCategory(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    if (!id) return;

    (this as any).scrollLockUntil = Date.now() + 420;
    this.setData({
      currentCategory: id,
      sidebarToView: `menu-tab-${id}`,
      toView: `cat-${id}`,
    });
  },

  handleMenuScroll(e: WechatMiniprogram.BaseEvent) {
    const scrollTop = Number((e as any).detail?.scrollTop || 0);
    if (!Number.isFinite(scrollTop)) return;

    const scrollLockUntil = Number((this as any).scrollLockUntil || 0);
    if (Date.now() < scrollLockUntil) return;

    this.syncCategoryByScroll(scrollTop);
  },

  syncCategoryByScroll(scrollTop: number, force = false) {
    const anchors = this.data.sectionAnchors;
    if (!anchors.length) return;

    const targetTop = scrollTop + 40;
    let nextCategory = anchors[0].id;
    for (const anchor of anchors) {
      if (targetTop >= anchor.top) {
        nextCategory = anchor.id;
      } else {
        break;
      }
    }

    if (!nextCategory || (!force && nextCategory === this.data.currentCategory)) return;

    this.setData({
      currentCategory: nextCategory,
      sidebarToView: `menu-tab-${nextCategory}`,
      toView: '',
    });
  },

  scheduleMeasureSectionAnchors(delay = 60) {
    const timer = (this as any).sectionMeasureTimer;
    if (timer) {
      clearTimeout(timer);
    }

    (this as any).sectionMeasureTimer = setTimeout(() => {
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

    query.exec((res: any[]) => {
      const listRect = res?.[0] as WechatMiniprogram.BoundingClientRectCallbackResult;
      const scrollInfo = (res?.[1] || {}) as { scrollTop?: number };
      const sectionRects = (res?.[2] || []) as Array<{ top: number }>;

      if (!listRect || !sectionRects.length) {
        this.setData({ sectionAnchors: [] });
        return;
      }

      const scrollTop = Number(scrollInfo.scrollTop || 0);
      const anchors = sectionRects
        .map((rect, index) => ({
          id: this.data.viewCategories[index]?.id || '',
          top: rect.top - listRect.top + scrollTop,
        }))
        .filter((item) => item.id)
        .sort((a, b) => a.top - b.top);

      this.setData({ sectionAnchors: anchors });
      this.syncCategoryByScroll(scrollTop, true);
    });
  },

  handleKeywordInput(e: WechatMiniprogram.BaseEvent) {
    const keyword = (e as any).detail?.value || '';
    const viewCategories = this.buildViewCategories(this.data.categories, keyword);
    const currentCategory = viewCategories.some((item) => item.id === this.data.currentCategory)
      ? this.data.currentCategory
      : (viewCategories[0]?.id || '');

    this.setData(
      {
        keyword,
        viewCategories,
        currentCategory,
        sidebarToView: currentCategory ? `menu-tab-${currentCategory}` : '',
        toView: '',
        sectionAnchors: [],
      },
      () => {
        this.scheduleMeasureSectionAnchors();
      },
    );
  },

  clearKeyword() {
    const viewCategories = this.buildViewCategories(this.data.categories, '');
    const currentCategory = viewCategories[0]?.id || '';
    this.setData(
      {
        keyword: '',
        viewCategories,
        currentCategory,
        sidebarToView: currentCategory ? `menu-tab-${currentCategory}` : '',
        toView: '',
        sectionAnchors: [],
      },
      () => {
        this.scheduleMeasureSectionAnchors();
      },
    );
  },

  findDishMeta(dishId: string): { dish: Dish; categoryName: string } | null {
    for (const category of this.data.categories) {
      const found = category.dishes.find((dish) => dish.id === dishId);
      if (found) {
        return { dish: found, categoryName: category.name };
      }
    }
    return null;
  },

  applyCartDelta(dish: Dish, delta: number, skuName = '') {
    if (!dish.id || !delta) return;

    const cartKey = this.makeCartKey(dish.id, skuName);
    const cartItems = this.data.cartItems.map((item) => ({ ...item }));
    const index = cartItems.findIndex((item) => item.cartKey === cartKey);
    const currentQty = index >= 0 ? Number(cartItems[index].qty || 0) : 0;
    const nextQty = currentQty + delta;
    if (nextQty < 0) return;

    if (index >= 0 && nextQty === 0) {
      cartItems.splice(index, 1);
    } else if (index >= 0) {
      cartItems[index] = { ...cartItems[index], qty: nextQty };
    } else if (nextQty > 0) {
      cartItems.push({
        cartKey,
        dishId: dish.id,
        dishName: dish.name,
        unitPriceFen: dish.priceFen,
        qty: nextQty,
        skuName: skuName.trim(),
      });
    } else {
      return;
    }

    this.setData({ cartItems });
    this.saveCart(cartItems);
    this.calcTotal(cartItems);
  },

  updateCart(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const delta = Number(e.currentTarget.dataset.delta || 0);
    if (!id || !delta) return;

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

    this.applyCartDelta(dish, delta);
  },

  noopTap() {},

  openSpecByDish(dish: Dish, categoryName: string) {
    const specGroups = this.getSpecGroupsByDish(dish, categoryName);
    if (!specGroups.length) {
      this.applyCartDelta(dish, 1);
      return;
    }

    const draftMap = ((this as any).specDraftMap || {}) as Record<string, number[]>;
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

  openSpec(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    if (!id) return;

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

  buildSpecSummary(specGroups: SpecGroup[], specSelections: number[]): string {
    return specGroups
      .map((group, index) => group.options[specSelections[index] || 0])
      .filter(Boolean)
      .join(' / ');
  },

  selectSpecOption(e: WechatMiniprogram.BaseEvent) {
    const groupIndex = Number(e.currentTarget.dataset.groupIndex || 0);
    const optionIndex = Number(e.currentTarget.dataset.optionIndex || 0);

    const group = this.data.specGroups[groupIndex];
    if (!group) return;
    if (!Number.isFinite(optionIndex) || optionIndex < 0 || optionIndex >= group.options.length) return;

    const specSelections = this.data.specSelections.slice();
    specSelections[groupIndex] = optionIndex;

    const specSummary = this.buildSpecSummary(this.data.specGroups, specSelections);
    this.setData({
      specSelections,
      specSummary,
    });

    const dishId = this.data.specDish?.id;
    if (dishId) {
      const draftMap = { ...(((this as any).specDraftMap || {}) as Record<string, number[]>) };
      draftMap[dishId] = specSelections;
      (this as any).specDraftMap = draftMap;
    }
  },

  updateSpecQty(e: WechatMiniprogram.BaseEvent) {
    const delta = Number(e.currentTarget.dataset.delta || 0);
    if (!delta) return;
    const next = Math.max(1, Math.min(99, this.data.specQty + delta));
    this.setData({ specQty: next });
  },

  confirmSpecAdd() {
    const dish = this.data.specDish;
    if (!dish) return;

    const qty = this.data.specQty;
    const summary = this.data.specSummary;
    this.applyCartDelta(dish, qty, summary);

    this.closeSpec();
    wx.showToast({
      title: summary ? `已加入${qty}份(${summary})` : `已加入${qty}份`,
      icon: 'none',
    });
  },

  saveCart(cartItems: CartItem[]) {
    wx.setStorageSync(STORAGE_KEYS.cart, cartItems);
  },

  calcTotal(cartItems: CartItem[]) {
    const dishCartCounts: DishCountMap = {};
    let cartCount = 0;
    let cartTotal = 0;

    cartItems.forEach((item) => {
      const qty = Number(item.qty || 0);
      if (qty <= 0) return;
      dishCartCounts[item.dishId] = (dishCartCounts[item.dishId] || 0) + qty;
      cartCount += qty;
      cartTotal += Number(item.unitPriceFen || 0) * qty;
    });

    this.setData({ dishCartCounts, cartCount, cartTotal });
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
