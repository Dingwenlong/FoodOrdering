import { request, STORAGE_KEYS } from '../../utils/request';
import type { CartItem, Category, CreateOrderPayload, MenuResult, Order } from '../../types/index';

type CartMap = Record<string, number>;

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
    const cartMap = (wx.getStorageSync(STORAGE_KEYS.cart) || {}) as CartMap;
    const dishIds = Object.keys(cartMap).filter((id) => Number(cartMap[id]) > 0);

    if (dishIds.length === 0) {
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

      const items = this.buildItems(categories, cartMap);
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

  buildItems(categories: Category[], cartMap: CartMap): CartItem[] {
    const dishMap: Record<string, { name: string; priceFen: number }> = {};
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

  calcTotals(items: CartItem[]) {
    const totalPrice = items.reduce((sum, item) => sum + item.unitPriceFen * item.qty, 0);
    return { totalPrice };
  },

  updateQty(e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '');
    const delta = Number(e.currentTarget.dataset.delta || 0);
    if (!id || !delta) return;

    const items = this.data.items
      .map((item) => {
        if (item.dishId !== id) return item;
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
    const cartMap: CartMap = {};
    items.forEach((item) => {
      cartMap[item.dishId] = item.qty;
    });
    wx.setStorageSync(STORAGE_KEYS.cart, cartMap);
  },

  clearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确认清空当前已选菜品吗？',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync(STORAGE_KEYS.cart);
        this.setData({
          items: [],
          totalPrice: 0,
          payablePrice: 0,
        });
      },
    });
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
