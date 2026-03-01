// miniprogram/types/index.ts

export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

export type ID = string;

export type OrderStatus = 'PENDING_PAY'|'PAID'|'COOKING'|'DONE'|'CANCELED';

export interface Dish {
  id: ID;
  categoryId: ID;
  name: string;
  priceFen: number;
  onSale: boolean;
  image?: string;
  description?: string;
}

export interface Category {
  id: ID;
  name: string;
  sort: number;
  dishes: Dish[];
}

export interface CartItem {
  dishId: ID;
  dishName: string;
  unitPriceFen: number;
  qty: number;
}

export interface Order {
  id: ID;
  storeId: ID;
  tableId: ID;
  tableName: string;
  status: OrderStatus;
  items: CartItem[];
  totalPriceFen: number;
  remark?: string;
  createdAt: string;
}
