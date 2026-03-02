"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request_1 = require("../../utils/request");
Page({
    data: {
        storeId: '',
        tableId: '',
        storeName: '',
        tableName: '',
        manualStoreId: 'store_1',
        manualTableId: '1',
        loading: false,
        errorMsg: '',
    },
    onLoad(options) {
        const preset = this.parseBindingFromOptions(options || {});
        if (preset) {
            this.setData({
                manualStoreId: preset.storeId,
                manualTableId: preset.tableId,
            });
            this.bindTable(preset.storeId, preset.tableId);
        }
    },
    parseBindingFromOptions(options) {
        const candidates = [];
        if (options.q) {
            candidates.push(decodeURIComponent(options.q));
        }
        if (options.scene) {
            candidates.push(decodeURIComponent(options.scene));
        }
        if (options.storeId || options.tableId) {
            candidates.push(`storeId=${options.storeId || ''}&tableId=${options.tableId || ''}`);
        }
        for (const raw of candidates) {
            const parsed = this.parseScanResult(raw);
            if (parsed)
                return parsed;
        }
        return null;
    },
    parseScanResult(raw) {
        if (!raw)
            return null;
        const normalized = raw.trim();
        if (!normalized)
            return null;
        const query = this.extractQuery(normalized);
        const storeId = (query.storeId || query.store || query.s || this.data.manualStoreId || 'store_1').trim();
        const tableId = (query.tableId || query.table || query.t || '').trim();
        if (tableId) {
            return { storeId, tableId };
        }
        if (/^\d+$/.test(normalized)) {
            return { storeId, tableId: normalized };
        }
        return null;
    },
    extractQuery(input) {
        let queryText = input;
        const questionIndex = input.indexOf('?');
        if (questionIndex >= 0 && questionIndex < input.length - 1) {
            queryText = input.slice(questionIndex + 1);
        }
        if (queryText.includes('=') === false) {
            return {};
        }
        const result = {};
        queryText.split('&').forEach((part) => {
            if (!part)
                return;
            const [k, v = ''] = part.split('=');
            if (!k)
                return;
            result[decodeURIComponent(k)] = decodeURIComponent(v);
        });
        return result;
    },
    handleScan() {
        wx.scanCode({
            success: (res) => {
                const parsed = this.parseScanResult(res.result || '');
                if (!parsed) {
                    this.setData({ errorMsg: '二维码参数无效，请联系商家重新生成桌码' });
                    wx.showToast({ title: '无效桌码', icon: 'none' });
                    return;
                }
                this.setData({
                    manualStoreId: parsed.storeId,
                    manualTableId: parsed.tableId,
                });
                this.bindTable(parsed.storeId, parsed.tableId);
            },
            fail: () => {
                wx.showToast({ title: '扫码失败', icon: 'none' });
            },
        });
    },
    handleStoreInput(e) {
        this.setData({ manualStoreId: e.detail.value || '' });
    },
    handleTableInput(e) {
        this.setData({ manualTableId: e.detail.value || '' });
    },
    handleManual() {
        const storeId = (this.data.manualStoreId || 'store_1').trim();
        const tableId = (this.data.manualTableId || '').trim();
        if (!tableId) {
            wx.showToast({ title: '请输入桌号ID', icon: 'none' });
            return;
        }
        this.bindTable(storeId, tableId);
    },
    async bindTable(storeId, tableId) {
        this.setData({ loading: true, errorMsg: '' });
        wx.showLoading({ title: '绑定中...' });
        try {
            const res = await (0, request_1.request)({
                url: '/session/bind-table',
                method: 'POST',
                data: { storeId, tableId },
            });
            const session = {
                storeId: res.data.storeId,
                storeName: res.data.storeName,
                tableId: res.data.tableId,
                tableName: res.data.tableName,
            };
            wx.setStorageSync(request_1.STORAGE_KEYS.session, session);
            wx.setStorageSync('storeId', session.storeId);
            wx.setStorageSync('tableId', session.tableId);
            this.setData({
                storeId: session.storeId,
                storeName: session.storeName,
                tableId: session.tableId,
                tableName: session.tableName,
            });
            wx.showToast({ title: '桌台绑定成功', icon: 'success' });
            setTimeout(() => {
                wx.navigateTo({
                    url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
                });
            }, 240);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '绑定失败，请稍后重试';
            this.setData({ errorMsg: msg });
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            wx.hideLoading();
            this.setData({ loading: false });
        }
    },
    goMenu() {
        const session = wx.getStorageSync(request_1.STORAGE_KEYS.session);
        if (!session || !session.storeId || !session.tableId) {
            wx.showToast({ title: '请先绑定桌台', icon: 'none' });
            return;
        }
        wx.navigateTo({
            url: `/pages/menu/index?storeId=${session.storeId}&tableId=${session.tableId}`,
        });
    },
});
