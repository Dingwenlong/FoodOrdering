import { request, STORAGE_KEYS } from '../../utils/request';
import type { Category, Dish } from '../../types/index';

type Notice = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

type CommentItem = {
  id: string;
  userName: string;
  content: string;
  rating: number;
  createdAt: string;
};

Page({
  data: {
    storeId: '',
    tableId: '',
    storeName: '未来餐厅',
    tableName: '',
    notices: [] as Notice[],
    dishes: [] as Dish[],
    comments: [] as CommentItem[],
    loading: false,
  },

  onLoad() {
    const session = wx.getStorageSync(STORAGE_KEYS.session);
    if (session) {
      this.setData({
        storeId: session.storeId || '',
        storeName: session.storeName || '未来餐厅',
        tableId: session.tableId || '',
        tableName: session.tableName || '',
      });
    } else {
      wx.reLaunch({ url: '/pages/scan/index' });
      return;
    }

    this.fetchHomeData();
  },

  onPullDownRefresh() {
    this.fetchHomeData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async fetchHomeData() {
    this.setData({ loading: true });
    try {
      const [noticeRes, menuRes, commentRes] = await Promise.all([
        request<Notice[]>({ url: '/notices', method: 'GET' }),
        request<{ categories: Category[] }>({ url: '/menu', method: 'GET' }),
        request<CommentItem[]>({ url: '/comments', method: 'GET' }),
      ]);

      const allDishes = menuRes.data.categories.flatMap((cat) => cat.dishes);

      this.setData({
        notices: noticeRes.data || [],
        dishes: allDishes,
        comments: commentRes.data || [],
      });
    } catch (err) {
      console.error('Fetch home data failed:', err);
      wx.showToast({ title: '加载数据失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goMenu() {
    wx.navigateTo({
      url: `/pages/menu/index?storeId=${this.data.storeId}&tableId=${this.data.tableId}`,
    });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/orders/index' });
  },

  goSupport() {
    wx.navigateTo({ url: '/pages/support/index' });
  },
});
