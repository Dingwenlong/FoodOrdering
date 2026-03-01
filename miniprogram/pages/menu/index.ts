import { request } from '../../utils/request';
import { Category, Dish } from '../../types/index';

Page({
  data: {
    categories: [] as Category[],
    currentCategory: '',
    toView: '',
    cart: {} as Record<string, number>, // dishId -> quantity
    cartCount: 0,
    cartTotal: 0,
  },

  onLoad(options: any) {
    console.log('Menu Page Loaded', options);
    this.fetchMenu(options.storeId || 's1');
  },

  async fetchMenu(storeId: string) {
    try {
      wx.showLoading({ title: '加载菜单...' });
      const res = await request({ url: `/menu?storeId=${storeId}`, method: 'GET' });
      const categories = res.data as Category[];
      
      this.setData({
        categories,
        currentCategory: categories[0]?.id || ''
      });
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  switchCategory(e: any) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      currentCategory: id,
      toView: `cat-${id}`
    });
  },

  updateCart(e: any) {
    const { id, delta } = e.currentTarget.dataset;
    const { cart, categories } = this.data;
    
    const newQty = (cart[id] || 0) + delta;
    if (newQty < 0) return;
    
    const newCart: Record<string, number> = { ...cart, [id]: newQty };
    if (newQty === 0) delete newCart[id];

    this.setData({ cart: newCart });
    this.calcTotal(newCart, categories);
  },

  calcTotal(cart: Record<string, number>, categories: Category[]) {
    let count = 0;
    let total = 0;
    
    // 平铺所有菜品方便查找
    const dishesMap: Record<string, Dish> = {};
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
