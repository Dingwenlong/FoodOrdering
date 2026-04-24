-- 初始化菜品分类数据
INSERT INTO categories (id, name, sort_order) VALUES
(1, '热菜', 1),
(2, '凉菜', 2),
(3, '汤品', 3),
(4, '主食', 4),
(5, '饮品', 5),
(6, '甜品', 6)
ON DUPLICATE KEY UPDATE id = id;

-- 初始化桌台数据
INSERT INTO tables (id, table_no, capacity, location, area) VALUES
(1, 'A01', 2, '大厅1号桌', '一楼大厅'),
(2, 'A02', 4, '大厅2号桌', '一楼大厅'),
(3, 'A03', 6, '大厅3号桌', '一楼大厅'),
(4, 'B01', 8, '包间1号', '二楼包间'),
(5, 'B02', 10, '包间2号', '二楼包间')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化菜品数据
-- 这里为了避免外键错误，假设 categories 表已经生成了 ID 1-6
INSERT INTO dishes (id, category_id, name, description, price, image, sort_order) VALUES
(1, 1, '宫保鸡丁', '经典川菜，鸡肉嫩滑，花生香脆', 38.00, '/images/gongbao_jiding.jpg', 1),
(2, 1, '麻婆豆腐', '四川传统名菜，麻辣鲜香', 28.00, '/images/mapo_doufu.jpg', 2),
(3, 2, '凉拌黄瓜', '清爽开胃，夏日必备', 18.00, '/images/liangban_huanggu.jpg', 1),
(4, 3, '西红柿鸡蛋汤', '家常汤品，营养丰富', 22.00, '/images/xihongshi_jidan_tang.jpg', 1),
(5, 4, '蛋炒饭', '粒粒分明，香气扑鼻', 15.00, '/images/dan_chaofan.jpg', 1),
(6, 5, '可乐', '可口可乐，冰镇更佳', 8.00, '/images/kele.jpg', 1)
ON DUPLICATE KEY UPDATE id = id;

-- 初始化管理员账号（用于 admin 登录）
INSERT INTO admin_users (id, username, password, display_name, role_name, status) VALUES
(1, 'admin', '$2a$10$8PjmGfLG88RWT1oshg9cn.swC9FcTKDUL5AM4C9PUav0z2EBAyq3W', '店长', '超级管理员', 1),
(2, 'manager', '$2a$10$atw.5Dr6lo62R2Z/lxPqmu40gqcnQxkUKDMKcHHrZEcelJlnC9v/y', '值班店长', '店长', 1),
(3, 'support', '$2a$10$D5nNPz/Bay0spsZNHs/cJeYB4sy3haBeP5.iC9kD5NjEXuOCosRWa', '客服专员', '客服', 1)
ON DUPLICATE KEY UPDATE id = id;

-- 初始化系统设置
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('storeId', 'store_1', '门店ID'),
('storeName', 'FoodOrdering 示例门店', '门店名称'),
('openTime', '09:00', '营业开始时间'),
('closeTime', '22:00', '营业结束时间'),
('autoAccept', 'true', '是否自动接单'),
('printerEnabled', 'false', '是否启用打印')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化用户数据
INSERT INTO users (id, username, password, email, phone, avatar, status, create_time, update_time) VALUES
(1, 'xiaozhang', '123456', 'xiaozhang@example.com', '13800000001', NULL, 1, '2026-01-12 12:10:00', '2026-03-01 15:40:00'),
(2, 'xiaoli', '123456', 'xiaoli@example.com', '13800000002', NULL, 1, '2026-02-03 17:22:00', '2026-03-01 14:20:00'),
(3, 'xiaowang', '123456', 'xiaowang@example.com', NULL, NULL, 1, '2026-02-28 10:00:00', '2026-03-01 13:10:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化订单数据（状态：0待支付，1已支付，2制作中，3已完成，4已取消）
INSERT INTO orders (id, user_id, table_id, order_no, total_amount, status, order_time, complete_time, remark, create_time, update_time) VALUES
(10001, 1, 1, 'OD202603010001', 54.00, 1, '2026-03-01 15:30:00', NULL, '少辣', '2026-03-01 15:30:00', '2026-03-01 15:31:00'),
(10002, 2, 2, 'OD202603010002', 28.00, 2, '2026-03-01 14:05:00', NULL, NULL, '2026-03-01 14:05:00', '2026-03-01 14:10:00'),
(10003, 3, 3, 'OD202603010003', 24.00, 3, '2026-03-01 12:20:00', '2026-03-01 12:55:00', NULL, '2026-03-01 12:20:00', '2026-03-01 12:55:00'),
(10004, 1, 1, 'OD202603010004', 18.00, 4, '2026-03-01 11:15:00', NULL, '用户取消', '2026-03-01 11:15:00', '2026-03-01 11:20:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化订单明细
INSERT INTO order_items (id, order_id, dish_id, sku_name, quantity, unit_price, subtotal, create_time) VALUES
(20001, 10001, 1, NULL, 1, 38.00, 38.00, '2026-03-01 15:30:00'),
(20002, 10001, 6, '中杯 / 正常冰 / 全糖', 2, 8.00, 16.00, '2026-03-01 15:30:00'),
(20003, 10002, 2, NULL, 1, 28.00, 28.00, '2026-03-01 14:05:00'),
(20004, 10003, 6, '大杯 / 去冰 / 五分糖', 3, 8.00, 24.00, '2026-03-01 12:20:00'),
(20005, 10004, 3, NULL, 1, 18.00, 18.00, '2026-03-01 11:15:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化支付记录
INSERT INTO payments (id, order_id, payment_no, amount, payment_method, status, payment_time, transaction_id, create_time, update_time) VALUES
(30001, 10001, 'PAY202603010001', 54.00, 2, 1, '2026-03-01 15:31:00', 'wx_tx_10001', '2026-03-01 15:30:30', '2026-03-01 15:31:00'),
(30002, 10002, 'PAY202603010002', 28.00, 2, 1, '2026-03-01 14:06:00', 'wx_tx_10002', '2026-03-01 14:05:30', '2026-03-01 14:06:00'),
(30003, 10003, 'PAY202603010003', 24.00, 2, 1, '2026-03-01 12:21:00', 'wx_tx_10003', '2026-03-01 12:20:30', '2026-03-01 12:21:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化公告
INSERT INTO notices (id, title, content, is_pinned, create_time, update_time) VALUES
(1, '今日特惠', '宫保鸡丁 8 折优惠，欢迎品尝！', 1, '2026-04-20 16:00:00', '2026-04-20 16:00:00'),
(2, '营业时间调整', '由于设备维护，明天营业时间调整为 10:00 - 20:00', 0, '2026-04-19 14:00:00', '2026-04-19 14:00:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化评论
INSERT INTO comments (id, order_id, dish_name, nickname, rating, content, create_time) VALUES
(1, 10001, '宫保鸡丁', '张三', 5, '味道不错，推荐！', '2026-04-20 13:00:00'),
(2, 10002, '麻婆豆腐', '李四', 4, '豆腐稍微有点咸，整体还可以。', '2026-04-19 16:10:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化留言建议
INSERT INTO feedbacks (id, nickname, content, status, create_time, update_time) VALUES
(1, 'xiaozhang', '希望增加不辣选项提示。', 'OPEN', '2026-03-01 15:10:00', '2026-03-01 15:10:00'),
(2, 'xiaowang', '建议增加儿童餐套餐。', 'IN_PROGRESS', '2026-03-01 12:35:00', '2026-03-01 13:00:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化客服工单
INSERT INTO support_tickets (id, user_id, nickname, topic, last_message_at, status, create_time, update_time) VALUES
(1, 3, 'xiaowang', '支付失败如何处理？', '2026-03-01 15:40:00', 'OPEN', '2026-03-01 15:30:00', '2026-03-01 15:40:00'),
(2, 2, 'xiaoli', '订单已完成但未收到小票', '2026-03-01 13:20:00', 'CLOSED', '2026-03-01 13:00:00', '2026-03-01 13:20:00')
ON DUPLICATE KEY UPDATE id = id;

-- 初始化客服消息
INSERT INTO support_ticket_messages (id, ticket_id, sender_type, sender_id, sender_name, content, is_read, create_time) VALUES
(1, 1, 'USER', '3', 'xiaowang', '我支付时提示失败，但订单还在待支付。', 0, '2026-03-01 15:30:00'),
(2, 1, 'ADMIN', '1', '店长', '您好，请重新发起支付；如果仍失败，我们会帮您人工核查。', 0, '2026-03-01 15:40:00'),
(3, 2, 'USER', '2', 'xiaoli', '订单完成后没有收到小票。', 1, '2026-03-01 13:00:00'),
(4, 2, 'ADMIN', '1', '店长', '已为您重新发送电子小票。', 1, '2026-03-01 13:20:00')
ON DUPLICATE KEY UPDATE id = id;
