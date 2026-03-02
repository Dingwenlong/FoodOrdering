// miniprogram/types/index.ts

export interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

export type ID = string;

export type OrderStatus = 'PENDING_PAY'|'PAID'|'COOKING'|'DONE'|'CANCELED';

export interface Money {
  currency: 'CNY';
  amountFen: number;
}

export interface Dish {
  id: ID;
  categoryId: ID;
  name: string;
  priceFen: number;
  onSale: boolean;
  soldOut?: boolean;
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

export interface StoreSession {
  storeId: ID;
  storeName: string;
  tableId: ID;
  tableName: string;
}

export interface BindTablePayload {
  storeId: ID;
  tableId: ID;
}

export interface BindTableResult extends StoreSession {}

export interface MenuResult {
  storeId: ID;
  storeName: string;
  categories: Category[];
}

export interface CreateOrderItem {
  dishId: ID;
  qty: number;
}

export interface CreateOrderPayload {
  storeId: ID;
  tableId: ID;
  items: CreateOrderItem[];
  remark?: string;
}

export interface PrepayPayload {
  orderId: ID;
}

export interface PrepayResult {
  timeStamp: string;
  nonceStr: string;
  prepayPackage: string;
  signType: string;
  paySign: string;
}

export interface UrgeOrderResult {
  orderId: ID;
  status: OrderStatus;
  message: string;
  urgedAt: string;
}
