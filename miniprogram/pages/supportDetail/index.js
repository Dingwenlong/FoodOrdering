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
const request_1 = require("../../utils/request");
Page({
    data: {
        ticketId: '',
        detail: null,
        messages: [],
        loading: false,
        sending: false,
        errorMsg: '',
        input: '',
    },
    onLoad(options) {
        const ticketId = decodeURIComponent(String(options.id || '')).trim();
        if (!ticketId) {
            this.setData({ errorMsg: '缺少工单ID' });
            return;
        }
        this.setData({ ticketId });
        this.refresh();
    },
    onPullDownRefresh() {
        this.refresh().finally(() => wx.stopPullDownRefresh());
    },
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data.ticketId)
                return;
            this.setData({ loading: true, errorMsg: '' });
            try {
                const [detailRes, messageRes] = yield Promise.all([
                    (0, request_1.request)({ url: `/support/tickets/${this.data.ticketId}`, method: 'GET' }),
                    (0, request_1.request)({
                        url: `/support/tickets/${this.data.ticketId}/messages?page=1&pageSize=50`,
                        method: 'GET',
                    }),
                ]);
                const messages = Array.isArray(messageRes.data && messageRes.data.list) ? messageRes.data.list : [];
                this.setData({
                    detail: detailRes.data,
                    messages: messages.slice().reverse(),
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '消息加载失败';
                this.setData({ errorMsg: msg });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    handleInput(e) {
        var _a;
        this.setData({ input: String(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '') });
    },
    sendMessage() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const content = this.data.input.trim();
            if (!content || this.data.sending || !this.data.ticketId)
                return;
            if (((_a = this.data.detail) === null || _a === void 0 ? void 0 : _a.status) === 'CLOSED') {
                wx.showToast({ title: '工单已关闭', icon: 'none' });
                return;
            }
            this.setData({ sending: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({
                    url: `/support/tickets/${this.data.ticketId}/messages`,
                    method: 'POST',
                    data: { content },
                });
                this.setData({
                    input: '',
                    messages: this.data.messages.concat(res.data),
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '发送失败';
                this.setData({ errorMsg: msg });
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ sending: false });
            }
        });
    },
    goBack() {
        wx.navigateBack({
            fail: () => wx.redirectTo({ url: '/pages/support/index' }),
        });
    },
});
