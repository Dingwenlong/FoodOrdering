import { Category, Order, StoreSession } from '../types/index';

export const mockStoreSession: StoreSession = {
  storeId: 'store_1',
  storeName: '未来餐厅',
  tableId: '1',
  tableName: 'A01',
};

export const mockCategories: Category[] = [
  {
    id: '1',
    name: '热销推荐',
    sort: 1,
    dishes: [
      {
        id: '1',
        categoryId: '1',
        name: '宫保鸡丁',
        priceFen: 3800,
        onSale: true,
        soldOut: false,
        image: 'https://placehold.co/200x200?text=Kung+Pao',
        description: '经典川菜，鸡肉嫩滑，花生香脆',
      },
      {
        id: '2',
        categoryId: '1',
        name: '麻婆豆腐',
        priceFen: 2800,
        onSale: true,
        soldOut: false,
        image: 'https://placehold.co/200x200?text=Mapo+Tofu',
        description: '四川传统名菜，麻辣鲜香',
      }
    ]
  },
  {
    id: '2',
    name: '凉菜',
    sort: 2,
    dishes: [
      {
        id: '3',
        categoryId: '2',
        name: '凉拌黄瓜',
        priceFen: 1800,
        onSale: true,
        soldOut: false,
        image: 'https://placehold.co/200x200?text=Cucumber',
        description: '清爽开胃，夏日必备',
      }
    ]
  },
  {
    id: '5',
    name: '饮品',
    sort: 3,
    dishes: [
      {
        id: '6',
        categoryId: '5',
        name: '可乐',
        priceFen: 800,
        onSale: true,
        soldOut: false,
        image: 'https://placehold.co/200x200?text=Coke',
        description: '冰镇更佳',
      },
      {
        id: '7',
        categoryId: '5',
        name: '鲜榨橙汁',
        priceFen: 1200,
        onSale: true,
        soldOut: true,
        image: 'https://placehold.co/200x200?text=Orange+Juice',
        description: '今日售罄',
      }
    ]
  }
];

export const mockOrders: Order[] = [
  {
    id: '10001',
    storeId: mockStoreSession.storeId,
    tableId: mockStoreSession.tableId,
    tableName: 'A01',
    status: 'COOKING',
    items: [
      { dishId: '1', dishName: '宫保鸡丁', unitPriceFen: 3800, qty: 1 },
      { dishId: '6', dishName: '可乐', unitPriceFen: 800, qty: 2 }
    ],
    totalPriceFen: 5400,
    createdAt: new Date().toISOString(),
    remark: '不要香菜'
  }
];

export const mockNotices = [
  { id: '1', title: '今日特惠', content: '宫保鸡丁 8 折优惠，欢迎品尝！', createdAt: '2024-03-05' },
  { id: '2', title: '营业时间调整', content: '由于设备维护，明日营业时间调整为 10:00 - 20:00', createdAt: '2024-03-04' }
];

export const mockComments = [
  { id: '1', orderId: '10001', userName: '张三', content: '味道不错，推荐！', rating: 5, createdAt: '2024-03-05' },
  { id: '2', orderId: '10002', userName: '李四', content: '豆腐稍微有点咸，整体还可以。', rating: 4, createdAt: '2024-03-04' }
];
