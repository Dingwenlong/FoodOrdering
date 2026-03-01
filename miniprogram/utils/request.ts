import { mockCategories, mockOrders } from '../mock/data';

const USE_MOCK = true;
const BASE_URL = 'http://localhost:3000/api/v1'; // 真实接口地址占位

export const request = async (options: WechatMiniprogram.RequestOption): Promise<any> => {
  if (USE_MOCK) {
    console.log('Mock Request:', options.url, options.method, options.data);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple Mock Routing
        if (options.url.includes('/menu')) {
          resolve({ data: mockCategories, statusCode: 200 });
        } else if (options.url.includes('/orders') && options.method === 'POST') {
          const orderData = options.data as object;
          resolve({ data: { id: 'o_' + Date.now(), ...orderData }, statusCode: 200 });
        } else if (options.url.includes('/orders') && options.method === 'GET') {
           // Detail or List
           if (options.url.match(/\/orders\/.+/)) {
             resolve({ data: mockOrders[0], statusCode: 200 });
           } else {
             resolve({ data: mockOrders, statusCode: 200 });
           }
        } else if (options.url.includes('/pay')) {
           resolve({ data: { nonceStr: 'mock_nonce', package: 'prepay_id=mock' }, statusCode: 200 });
        } else {
          resolve({ data: {}, statusCode: 200 });
        }
      }, 500);
    });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url: BASE_URL + options.url,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
};
