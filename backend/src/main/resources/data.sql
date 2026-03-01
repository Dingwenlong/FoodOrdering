-- 初始化菜品分类数据
INSERT INTO categories (name, sort_order) VALUES
('热菜', 1),
('凉菜', 2),
('汤品', 3),
('主食', 4),
('饮品', 5),
('甜品', 6);

-- 初始化桌台数据
INSERT INTO tables (table_no, capacity, location) VALUES
('A01', 2, '大厅1号桌'),
('A02', 4, '大厅2号桌'),
('A03', 6, '大厅3号桌'),
('B01', 8, '包间1号'),
('B02', 10, '包间2号');

-- 初始化菜品数据
-- 这里为了避免外键错误，假设 categories 表已经生成了 ID 1-6
INSERT INTO dishes (category_id, name, description, price, image, sort_order) VALUES
(1, '宫保鸡丁', '经典川菜，鸡肉嫩滑，花生香脆', 38.00, '/images/gongbao_jiding.jpg', 1),
(1, '麻婆豆腐', '四川传统名菜，麻辣鲜香', 28.00, '/images/mapo_doufu.jpg', 2),
(2, '凉拌黄瓜', '清爽开胃，夏日必备', 18.00, '/images/liangban_huanggu.jpg', 1),
(3, '西红柿鸡蛋汤', '家常汤品，营养丰富', 22.00, '/images/xihongshi_jidan_tang.jpg', 1),
(4, '蛋炒饭', '粒粒分明，香气扑鼻', 15.00, '/images/dan_chaofan.jpg', 1),
(5, '可乐', '可口可乐，冰镇更佳', 8.00, '/images/kele.jpg', 1);
