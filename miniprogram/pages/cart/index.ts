import { request, STORAGE_KEYS } from '../../utils/request';
import type { CartItem, Category, CreateOrderPayload, Dish, MenuResult, Order } from '../../types/index';

Page({
  data: {
    storeId: '',
    tableId: '',
    tableName: '',
    items: [] as CartItem[],
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

  onLoad(options: Record<string, string>) {
    this.resolveSession(options);

    (this as any)._keyboardHandler = (res: { height?: number }) => {
      const height = Math.max(0, Math.floor(Number(res?.height || 0)));
      if (height === this.data.keyboardHeightPx) return;
      this.setData({ keyboardHeightPx: height }, () => this.recalcLayout());
    };
  },

  onReady() {
    this.recalcLayout();
  },

  onShow() {
    this.attachKeyboard();
    const remark = String(wx.getStorageSync(STORAGE_KEYS.cartRemark) || '');
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
    const self = this as any;
    if (self._kbdAttached) return;
    wx.onKeyboardHeightChange(self._keyboardHandler);
    self._kbdAttached = true;
  },

  detachKeyboard() {
    const self = this as any;
    if (!self._kbdAttached) return;
    wx.offKeyboardHeightChange(self._keyboardHandler);
    self._kbdAttached = false;
  },

  rpxToPx(rpx: number) {
    const sys = wx.getSystemInfoSync();
    return (sys.windowWidth * rpx) / 750;
  },

  safeBottomInsetPx() {
    const sys = wx.getSystemInfoSync();
    const safeArea = (sys as any).safeArea as { bottom: number } | undefined;
    if (!safeArea || !Number.isFinite(safeArea.bottom)) return 0;
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

  resolveSession(options: Record<string, string>) {
    const session = wx.getStorageSync(STORAGE_KEYS.session) || {};
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

  async loadCart() {
    const rawCart = wx.getStorageSync(STORAGE_KEYS.cart);

    if (this.isCartEmpty(rawCart)) {
      this.setData({ items: [], totalPrice: 0, payablePrice: 0, errorMsg: '' });
      setTimeout(() => this.recalcLayout(), 0);
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    try {
      const menuCache = wx.getStorageSync('menuCache') || {};
      let categories: Category[] = [];

      if (menuCache.storeId === this.data.storeId && Array.isArray(menuCache.categories)) {
        categories = menuCache.categories;
      } else {
        const res = await request<MenuResult>({
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

      const items = this.buildItems(categories, rawCart);
      const totals = this.calcTotals(items);
      this.setData({
        items,
        totalPrice: totals.totalPrice,
        payablePrice: totals.totalPrice + this.data.serviceFee,
      });

      this.syncCartStorage(items);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载购物车失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ loading: false });
      setTimeout(() => this.recalcLayout(), 0);
    }
  },

  isCartEmpty(rawCart: unknown): boolean {
    if (Array.isArray(rawCart)) {
      return rawCart.every((item: any) => Number(item?.qty || 0) <= 0);
    }
    if (rawCart && typeof rawCart === 'object') {
      return Object.keys(rawCart as Record<string, number>).every((id) => Number((rawCart as Record<string, number>)[id]) <= 0);
    }
    return true;
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

  buildItems(categories: Category[], rawCart: unknown): CartItem[] {
    const dishMap = this.buildDishMap(categories);

    if (Array.isArray(rawCart)) {
      return rawCart
        .map((item: any) => {
          const dishId = String(item?.dishId || '').trim();
          const skuName = String(item?.skuName || '').trim();
          const qty = Number(item?.qty || 0);
          const dish = dishMap[dishId];
          if (!dish || qty <= 0) return null;
          return {
            cartKey: this.makeCartKey(dishId, skuName),
            dishId,
            dishName: dish.name,
            unitPriceFen: dish.priceFen,
            qty,
            skuName,
          } as CartItem;
        })
        .filter(Boolean) as CartItem[];
    }

    if (!rawCart || typeof rawCart !== 'object') {
      return [];
    }

    return Object.keys(rawCart as Record<string, number>)
      .filter((dishId) => Number((rawCart as Record<string, number>)[dishId]) > 0 && Boolean(dishMap[dishId]))
      .map((dishId) => ({
        cartKey: this.makeCartKey(dishId),
        dishId,
        dishName: dishMap[dishId].name,
        unitPriceFen: dishMap[dishId].priceFen,
        qty: Number((rawCart as Record<string, number>)[dishId]),
        skuName: '',
      }));
  },

  calcTotals(items: CartItem[]) {
    const totalPrice = items.reduce((sum, item) => sum + item.unitPriceFen * item.qty, 0);
    return { totalPrice };
  },

  updateQty(e: WechatMiniprogram.BaseEvent) {
    const key = String(e.currentTarget.dataset.key || '');
    const delta = Number(e.currentTarget.dataset.delta || 0);
    if (!key || !delta) return;

    const items = this.data.items
      .map((item) => {
        if (item.cartKey !== key) return item;
        return { ...item, qty: item.qty + delta };
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

  syncCartStorage(items: CartItem[]) {
    wx.setStorageSync(STORAGE_KEYS.cart, items);
  },



  handleRemarkInput(e: WechatMiniprogram.BaseEvent) {
    const value = String((e as any).detail?.value || '').slice(0, this.data.remarkLimit);
    this.setData({
      remark: value,
      remarkLength: value.length,
    });
    wx.setStorageSync(STORAGE_KEYS.cartRemark, value);
  },

  goBack() {
    wx.navigateBack();
  },

  async submitOrder() {
    if (this.data.items.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, errorMsg: '' });
    try {
      const payload: CreateOrderPayload = {
        storeId: this.data.storeId,
        tableId: this.data.tableId,
        items: this.data.items.map((item) => ({
          dishId: item.dishId,
          qty: item.qty,
          skuName: item.skuName || undefined,
        })),
        remark: this.data.remark.trim(),
      };

      const res = await request<Order>({
        url: '/orders',
        method: 'POST',
        data: payload,
      });

      const orderId = String(res.data.id || '');
      if (!orderId) {
        throw new Error('订单创建失败');
      }

      wx.removeStorageSync(STORAGE_KEYS.cart);
      wx.removeStorageSync(STORAGE_KEYS.cartRemark);
      wx.setStorageSync(STORAGE_KEYS.lastOrderId, orderId);

      wx.showToast({ title: '下单成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/orderDetail/index?id=${orderId}`,
        });
      }, 260);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '下单失败';
      this.setData({ errorMsg: msg });
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
