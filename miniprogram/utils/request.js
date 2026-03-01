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
exports.request = void 0;
const data_1 = require("../mock/data");
const USE_MOCK = true;
const BASE_URL = 'http://localhost:3000/api/v1'; // 真实接口地址占位
const request = (options) => __awaiter(void 0, void 0, void 0, function* () {
    if (USE_MOCK) {
        console.log('Mock Request:', options.url, options.method, options.data);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simple Mock Routing
                if (options.url.includes('/menu')) {
                    resolve({ data: data_1.mockCategories, statusCode: 200 });
                }
                else if (options.url.includes('/orders') && options.method === 'POST') {
                    const orderData = options.data;
                    resolve({ data: Object.assign({ id: 'o_' + Date.now() }, orderData), statusCode: 200 });
                }
                else if (options.url.includes('/orders') && options.method === 'GET') {
                    // Detail or List
                    if (options.url.match(/\/orders\/.+/)) {
                        resolve({ data: data_1.mockOrders[0], statusCode: 200 });
                    }
                    else {
                        resolve({ data: data_1.mockOrders, statusCode: 200 });
                    }
                }
                else if (options.url.includes('/pay')) {
                    resolve({ data: { nonceStr: 'mock_nonce', package: 'prepay_id=mock' }, statusCode: 200 });
                }
                else {
                    resolve({ data: {}, statusCode: 200 });
                }
            }, 500);
        });
    }
    return new Promise((resolve, reject) => {
        wx.request(Object.assign(Object.assign({}, options), { url: BASE_URL + options.url, success: (res) => resolve(res), fail: (err) => reject(err) }));
    });
});
exports.request = request;
