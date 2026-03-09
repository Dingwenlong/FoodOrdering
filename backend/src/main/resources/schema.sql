CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    avatar VARCHAR(255) COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态：1正常，0禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_username (username),
    INDEX idx_users_email (email)
) COMMENT='用户表';

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用，0禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_status (status)
) COMMENT='菜品分类表';

CREATE TABLE IF NOT EXISTS dishes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_id BIGINT NOT NULL COMMENT '分类ID',
    name VARCHAR(100) NOT NULL COMMENT '菜品名称',
    description TEXT COMMENT '菜品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '价格',
    image VARCHAR(255) COMMENT '图片URL',
    status TINYINT DEFAULT 1 COMMENT '状态：1上架，0下架',
    sold_out TINYINT DEFAULT 0 COMMENT '是否售罄：1是，0否',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dishes_category (category_id),
    INDEX idx_dishes_status (status),
    FOREIGN KEY (category_id) REFERENCES categories(id)
) COMMENT='菜品表';

CREATE TABLE IF NOT EXISTS tables (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_no VARCHAR(20) UNIQUE NOT NULL COMMENT '桌台编号',
    capacity INT NOT NULL COMMENT '容纳人数',
    status TINYINT DEFAULT 0 COMMENT '状态：0空闲，1占用，2预订',
    location VARCHAR(100) COMMENT '位置描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tables_status (status)
) COMMENT='桌台表';

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    table_id BIGINT COMMENT '桌台ID',
    order_no VARCHAR(32) UNIQUE NOT NULL COMMENT '订单编号',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    status TINYINT DEFAULT 0 COMMENT '状态：0待支付，1已支付，2制作中，3已完成，4已取消',
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '下单时间',
    complete_time DATETIME COMMENT '完成时间',
    remark TEXT COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orders_user_id (user_id),
    INDEX idx_orders_table_id (table_id),
    INDEX idx_orders_order_no (order_no),
    INDEX idx_orders_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (table_id) REFERENCES tables(id)
) COMMENT='订单表';

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    dish_id BIGINT NOT NULL COMMENT '菜品ID',
    quantity INT NOT NULL COMMENT '数量',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价',
    subtotal DECIMAL(10,2) NOT NULL COMMENT '小计',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order_items_order_id (order_id),
    INDEX idx_order_items_dish_id (dish_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (dish_id) REFERENCES dishes(id)
) COMMENT='订单明细表';

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    payment_no VARCHAR(32) UNIQUE NOT NULL COMMENT '支付编号',
    amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    payment_method TINYINT NOT NULL COMMENT '支付方式：1支付宝，2微信，3现金',
    status TINYINT DEFAULT 0 COMMENT '状态：0待支付，1支付成功，2支付失败',
    payment_time DATETIME COMMENT '支付时间',
    transaction_id VARCHAR(64) COMMENT '第三方交易号',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payments_order_id (order_id),
    INDEX idx_payments_payment_no (payment_no),
    INDEX idx_payments_status (status),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) COMMENT='支付表';

CREATE TABLE IF NOT EXISTS admin_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '管理员账号',
    password VARCHAR(255) NOT NULL COMMENT '管理员密码',
    display_name VARCHAR(100) NOT NULL COMMENT '显示名称',
    role_name VARCHAR(100) NOT NULL COMMENT '角色名称',
    status TINYINT DEFAULT 1 COMMENT '状态：1启用，0禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_users_username (username),
    INDEX idx_admin_users_status (status)
) COMMENT='管理员表';

CREATE TABLE IF NOT EXISTS notices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容',
    is_pinned TINYINT DEFAULT 0 COMMENT '是否置顶：1是，0否',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notices_is_pinned (is_pinned),
    INDEX idx_notices_create_time (create_time)
) COMMENT='公告表';

CREATE TABLE IF NOT EXISTS comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    dish_name VARCHAR(100) NOT NULL COMMENT '菜品名',
    nickname VARCHAR(100) NOT NULL COMMENT '昵称',
    rating TINYINT NOT NULL COMMENT '评分1-5',
    content TEXT NOT NULL COMMENT '评论内容',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comments_order_id (order_id),
    INDEX idx_comments_create_time (create_time),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) COMMENT='评论表';

CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nickname VARCHAR(100) NOT NULL COMMENT '昵称',
    content TEXT NOT NULL COMMENT '留言内容',
    status VARCHAR(20) NOT NULL COMMENT '状态：OPEN/IN_PROGRESS/RESOLVED',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_feedbacks_status (status),
    INDEX idx_feedbacks_create_time (create_time)
) COMMENT='留言建议表';

CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nickname VARCHAR(100) NOT NULL COMMENT '昵称',
    topic VARCHAR(200) NOT NULL COMMENT '问题主题',
    last_message_at DATETIME NOT NULL COMMENT '最后消息时间',
    status VARCHAR(20) NOT NULL COMMENT '状态：OPEN/CLOSED',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_support_tickets_status (status),
    INDEX idx_support_tickets_last_message_at (last_message_at)
) COMMENT='客服工单表';

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ticket_id BIGINT NOT NULL COMMENT '关联工单ID',
    sender_type VARCHAR(20) NOT NULL COMMENT '发送者类型：USER/ADMIN',
    sender_id VARCHAR(100) COMMENT '发送者ID（用户昵称或管理员ID）',
    sender_name VARCHAR(100) COMMENT '发送者显示名称',
    content TEXT NOT NULL COMMENT '消息内容',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读：1是，0否',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_messages_ticket_id (ticket_id),
    INDEX idx_messages_create_time (create_time),
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
) COMMENT='客服工单消息表';
