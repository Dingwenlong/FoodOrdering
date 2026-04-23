import { request, STORAGE_KEYS } from '../../utils/request';

interface Comment {
  id: number;
  userName: string;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}

Page({
  data: {
    loading: true,
    errorMsg: '',
    tableName: '',
    orderCount: 0,
    comments: [] as Comment[],
  },

  onLoad() {
    console.log('首页加载');
    const session = wx.getStorageSync(STORAGE_KEYS.session);
    if (session) {
      this.setData({ tableName: session.tableName });
      this.fetchData();
    } else {
      this.setData({ loading: false });
    }
  },

  async fetchData() {
    try {
      this.setData({ loading: true, errorMsg: '' });
      
      // 获取顾客评论
      const commentsRes = await request.get('/v1/comments?limit=3');
      
      console.log('评论数据:', commentsRes);
      
      this.setData({
        comments: commentsRes.data || [],
        loading: false
      });
    } catch (err) {
      console.error('获取数据失败:', err);
      this.setData({
        errorMsg: '获取数据失败，请重试',
        loading: false
      });
    }
  },

  goMenu() {
    wx.navigateTo({ url: '/pages/menu/index' });
  },

  goOrders() {
    wx.switchTab({ url: '/pages/orders/index' });
  },

  goScan() {
    wx.navigateTo({ url: '/pages/scan/index' });
  }
});
