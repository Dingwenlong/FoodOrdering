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
        loading: false,
        submitting: false,
        tickets: [],
        errorMsg: '',
        topic: '',
        content: '',
    },
    onLoad() {
        this.fetchTickets();
    },
    onShow() {
        this.fetchTickets();
    },
    onPullDownRefresh() {
        this.fetchTickets().finally(() => wx.stopPullDownRefresh());
    },
    fetchTickets() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setData({ loading: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({ url: '/support/tickets', method: 'GET' });
                this.setData({ tickets: res.data || [] });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '客服工单加载失败';
                this.setData({ errorMsg: msg });
            }
            finally {
                this.setData({ loading: false });
            }
        });
    },
    handleTopicInput(e) {
        var _a;
        this.setData({ topic: String(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '') });
    },
    handleContentInput(e) {
        var _a;
        this.setData({ content: String(((_a = e.detail) === null || _a === void 0 ? void 0 : _a.value) || '') });
    },
    submitTicket() {
        return __awaiter(this, void 0, void 0, function* () {
            const topic = this.data.topic.trim();
            const content = this.data.content.trim();
            if (!topic) {
                wx.showToast({ title: '请填写问题主题', icon: 'none' });
                return;
            }
            if (!content) {
                wx.showToast({ title: '请填写问题描述', icon: 'none' });
                return;
            }
            if (this.data.submitting)
                return;
            this.setData({ submitting: true, errorMsg: '' });
            try {
                const res = yield (0, request_1.request)({
                    url: '/support/tickets',
                    method: 'POST',
                    data: { topic, content },
                });
                this.setData({ topic: '', content: '' });
                wx.showToast({ title: '已提交', icon: 'success' });
                wx.navigateTo({ url: `/pages/supportDetail/index?id=${res.data.id}` });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : '提交失败';
                this.setData({ errorMsg: msg });
                wx.showToast({ title: msg, icon: 'none' });
            }
            finally {
                this.setData({ submitting: false });
            }
        });
    },
    openTicket(e) {
        const id = String(e.currentTarget.dataset.id || '');
        if (!id)
            return;
        wx.navigateTo({ url: `/pages/supportDetail/index?id=${id}` });
    },
});
