"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = exports.STORAGE_KEYS = void 0;
const API_BASE_URL_KEY = 'MP_API_BASE_URL';
const API_PREFIX = '/api/v1';
exports.STORAGE_KEYS = {
    session: 'storeSession',
    cart: 'cart',
    cartRemark: 'cartRemark',
    lastOrderId: 'lastOrderId',
    clientToken: 'clientToken',
    clientUser: 'clientUser',
};
const successEnvelope = (data) => ({
    code: 0,
    message: 'OK',
    data,
    timestamp: new Date().toISOString(),
});
const unwrapEnvelope = (payload) => {
    if (payload && typeof payload === 'object' && typeof payload.code === 'number' && 'data' in payload) {
        if (payload.code !== 0) {
            throw new Error(payload.message || '请求失败');
        }
        return { data: payload.data, message: payload.message || 'OK' };
    }
    return { data: payload, message: 'OK' };
};
function parseUrl(rawUrl) {
    const [rawPath, rawQuery = ''] = rawUrl.split('?');
    const path = rawPath || '/';
    const query = {};
    if (!rawQuery) {
        return { path, query };
    }
    rawQuery.split('&').forEach((kv) => {
        if (!kv)
            return;
        const [k, v = ''] = kv.split('=');
        if (!k)
            return;
        query[decodeURIComponent(k)] = decodeURIComponent(v);
    });
    return { path, query };
}
function normalizeApiPath(path) {
    if (path.startsWith(API_PREFIX)) {
        const normalized = path.slice(API_PREFIX.length);
        return normalized || '/';
    }
    if (path.startsWith('/api/v1')) {
        const normalized = path.slice('/api/v1'.length);
        return normalized || '/';
    }
    return path;
}
function resolveUrl(rawUrl) {
    const baseUrl = String(wx.getStorageSync(API_BASE_URL_KEY) || 'http://localhost:8080').replace(/\/+$/, '');
    if (/^https?:\/\//i.test(rawUrl)) {
        return rawUrl;
    }
    if (rawUrl.startsWith('/api/')) {
        return `${baseUrl}${rawUrl}`;
    }
    if (rawUrl.startsWith('/')) {
        return `${baseUrl}${API_PREFIX}${rawUrl}`;
    }
    return `${baseUrl}${API_PREFIX}/${rawUrl}`;
}
function wxLogin() {
    return new Promise((resolve, reject) => {
        wx.login({
            success: (res) => {
                if (res.code) {
                    resolve(res.code);
                    return;
                }
                reject(new Error('微信登录未返回 code'));
            },
            fail: (err) => reject(new Error(err.errMsg || '微信登录失败')),
        });
    });
}
function ensureClientToken() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const cached = wx.getStorageSync(exports.STORAGE_KEYS.clientToken);
        if (cached && typeof cached === 'string') {
            return cached;
        }
        const code = yield wxLogin();
        const result = yield rawRequest({
            url: '/auth/wechat-login',
            method: 'POST',
            data: { code },
        });
        if (!((_a = result.data) === null || _a === void 0 ? void 0 : _a.token)) {
            throw new Error('登录态获取失败');
        }
        wx.setStorageSync(exports.STORAGE_KEYS.clientToken, result.data.token);
        wx.setStorageSync(exports.STORAGE_KEYS.clientUser, result.data.user);
        return result.data.token;
    });
}
function getMethod(options) {
    return (options.method || 'GET').toUpperCase();
}
function normalizeMenu(payload) {
    if (Array.isArray(payload)) {
        return {
            storeId: '',
            storeName: '',
            categories: payload,
        };
    }
    if (payload && typeof payload === 'object' && Array.isArray(payload.categories)) {
        return {
            storeId: String(payload.storeId || ''),
            storeName: String(payload.storeName || ''),
            categories: payload.categories,
        };
    }
    return {
        storeId: '',
        storeName: '',
        categories: [],
    };
}
function normalizeOrder(rawOrder) {
    var _a, _b, _c;
    const rawItems = Array.isArray(rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.items) ? rawOrder.items : [];
    const items = rawItems.map((item) => {
        var _a, _b, _c;
        const unitPriceFen = (_c = (_a = item === null || item === void 0 ? void 0 : item.unitPriceFen) !== null && _a !== void 0 ? _a : (_b = item === null || item === void 0 ? void 0 : item.unitPrice) === null || _b === void 0 ? void 0 : _b.amountFen) !== null && _c !== void 0 ? _c : 0;
        return {
            cartKey: `${String((item === null || item === void 0 ? void 0 : item.dishId) || '')}::${String((item === null || item === void 0 ? void 0 : item.skuName) || '')}`,
            dishId: String((item === null || item === void 0 ? void 0 : item.dishId) || ''),
            dishName: String((item === null || item === void 0 ? void 0 : item.dishName) || ''),
            skuName: (item === null || item === void 0 ? void 0 : item.skuName) ? String(item.skuName) : '',
            unitPriceFen: Number(unitPriceFen) || 0,
            qty: Number(item === null || item === void 0 ? void 0 : item.qty) || 0,
        };
    });
    const totalPriceFen = Number((_c = (_a = rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.totalPriceFen) !== null && _a !== void 0 ? _a : (_b = rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.totalPrice) === null || _b === void 0 ? void 0 : _b.amountFen) !== null && _c !== void 0 ? _c : 0) || 0;
    return {
        id: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.id) || ''),
        storeId: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.storeId) || ''),
        tableId: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.tableId) || ''),
        tableName: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.tableName) || ''),
        status: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.status) || 'PENDING_PAY'),
        items,
        totalPriceFen,
        remark: (rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.remark) ? String(rawOrder.remark) : '',
        createdAt: String((rawOrder === null || rawOrder === void 0 ? void 0 : rawOrder.createdAt) || new Date().toISOString()),
    };
}
function resolveErrorMessage(payload, fallback) {
    if (payload && typeof payload === 'object') {
        if (typeof payload.message === 'string' && payload.message.trim()) {
            return payload.message;
        }
        if (typeof payload.error === 'string' && payload.error.trim()) {
            return payload.error;
        }
    }
    return fallback;
}
const request = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return rawRequest(options, true);
});
exports.request = request;
function rawRequest(options, withAuth = false, retried = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = resolveUrl(String(options.url || '/'));
        const method = getMethod(options);
        const path = normalizeApiPath(parseUrl(String(options.url || '/')).path);
        const token = withAuth && path !== '/auth/wechat-login' ? yield ensureClientToken() : '';
        return new Promise((resolve, reject) => {
            const header = Object.assign(Object.assign({}, (options.header || {})), (token ? { Authorization: `Bearer ${token}` } : {}));
            wx.request(Object.assign(Object.assign({}, options), { method: method, url,
                header, success: (res) => {
                    const statusCode = res.statusCode || 500;
                    if (statusCode < 200 || statusCode >= 300) {
                        if (statusCode === 401 && withAuth && !retried) {
                            wx.removeStorageSync(exports.STORAGE_KEYS.clientToken);
                            wx.removeStorageSync(exports.STORAGE_KEYS.clientUser);
                            rawRequest(options, withAuth, true).then(resolve).catch(reject);
                            return;
                        }
                        reject(new Error(resolveErrorMessage(res.data, `HTTP ${statusCode}`)));
                        return;
                    }
                    try {
                        const unwrapped = unwrapEnvelope(res.data);
                        let data = unwrapped.data;
                        if (path === '/menu') {
                            data = normalizeMenu(data);
                        }
                        if (path === '/orders' && method === 'POST') {
                            data = normalizeOrder(data);
                        }
                        if (path === '/orders' && method === 'GET' && Array.isArray(data)) {
                            data = data.map((item) => normalizeOrder(item));
                        }
                        if (/^\/orders\/.+/.test(path) && method === 'GET') {
                            data = normalizeOrder(data);
                        }
                        resolve({ data: data, statusCode, message: unwrapped.message });
                    }
                    catch (err) {
                        reject(err);
                    }
                }, fail: (err) => reject(err) }));
        });
    });
}
