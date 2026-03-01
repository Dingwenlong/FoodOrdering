import { Category, Dish, Order } from '../types/index';

export const mockCategories: Category[] = [
  {
    id: 'c1',
    name: '热销推荐',
    sort: 1,
    dishes: [
      { id: 'd1', categoryId: 'c1', name: '招牌牛肉面', priceFen: 2800, onSale: true, image: 'https://placehold.co/200x200?text=Beef+Noodle', description: '采用上等牛腱肉，秘制汤底' },
      { id: 'd2', categoryId: 'c1', name: '鲜虾云吞', priceFen: 2200, onSale: true, image: 'https://placehold.co/200x200?text=Wonton', description: '整只鲜虾，皮薄馅大' }
    ]
  },
  {
    id: 'c2',
    name: '主食',
    sort: 2,
    dishes: [
      { id: 'd3', categoryId: 'c2', name: '扬州炒饭', priceFen: 1800, onSale: true, image: 'https://placehold.co/200x200?text=Fried+Rice' },
      { id: 'd4', categoryId: 'c2', name: '炸酱面', priceFen: 1600, onSale: true, image: 'https://placehold.co/200x200?text=Noodle' }
    ]
  },
  {
    id: 'c3',
    name: '饮料',
    sort: 3,
    dishes: [
      { id: 'd5', categoryId: 'c3', name: '冰可乐', priceFen: 300, onSale: true, image: 'https://placehold.co/200x200?text=Coke' },
      { id: 'd6', categoryId: 'c3', name: '鲜榨橙汁', priceFen: 1200, onSale: true, image: 'https://placehold.co/200x200?text=Orange+Juice' }
    ]
  }
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    storeId: 's1',
    tableId: 't1',
    tableName: 'A01',
    status: 'COOKING',
    items: [
      { dishId: 'd1', dishName: '招牌牛肉面', unitPriceFen: 2800, qty: 1 },
      { dishId: 'd5', dishName: '冰可乐', unitPriceFen: 300, qty: 1 }
    ],
    totalPriceFen: 3100,
    createdAt: new Date().toISOString(),
    remark: '不要香菜'
  }
];
