package com.foodordering.service.client;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.foodordering.auth.ClientUserContext;
import com.foodordering.dto.client.ClientDtos;
import com.foodordering.entity.AdminNotice;
import com.foodordering.entity.Category;
import com.foodordering.entity.Dish;
import com.foodordering.entity.Order;
import com.foodordering.entity.OrderItem;
import com.foodordering.entity.Payment;
import com.foodordering.entity.SupportTicketMessage;
import com.foodordering.entity.SupportTicketRecord;
import com.foodordering.entity.SystemSetting;
import com.foodordering.entity.Table;
import com.foodordering.entity.UserComment;
import com.foodordering.entity.User;
import com.foodordering.mapper.AdminNoticeMapper;
import com.foodordering.mapper.CategoryMapper;
import com.foodordering.mapper.DishMapper;
import com.foodordering.mapper.OrderItemMapper;
import com.foodordering.mapper.OrderMapper;
import com.foodordering.mapper.PaymentMapper;
import com.foodordering.mapper.SupportTicketMessageMapper;
import com.foodordering.mapper.SupportTicketRecordMapper;
import com.foodordering.mapper.SystemSettingMapper;
import com.foodordering.mapper.TableMapper;
import com.foodordering.mapper.UserCommentMapper;
import com.foodordering.mapper.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private static final String DEFAULT_STORE_ID = "store_1";
    private static final String DEFAULT_STORE_NAME = "未来餐厅";
    private static final String DEFAULT_OPEN_TIME = "09:00";
    private static final String DEFAULT_CLOSE_TIME = "22:00";
    private static final String CURRENCY_CNY = "CNY";
    private static final int MAX_UNPAGED_LIST_SIZE = 200;
    private static final int ORDER_STATUS_PENDING_PAY = 0;
    private static final int ORDER_STATUS_PAID = 1;
    private static final int ORDER_STATUS_COOKING = 2;
    private static final int ORDER_STATUS_DONE = 3;
    private static final int ORDER_STATUS_CANCELED = 4;
    private static final int PAYMENT_METHOD_WECHAT = 2;
    private static final int PAYMENT_STATUS_PENDING = 0;
    private static final int PAYMENT_STATUS_SUCCESS = 1;
    private static final String SETTING_STORE_ID = "storeId";
    private static final String SETTING_STORE_NAME = "storeName";
    private static final String SETTING_OPEN_TIME = "openTime";
    private static final String SETTING_CLOSE_TIME = "closeTime";
    private static final String SETTING_AUTO_ACCEPT = "autoAccept";

    private final CategoryMapper categoryMapper;
    private final DishMapper dishMapper;
    private final TableMapper tableMapper;
    private final UserMapper userMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final PaymentMapper paymentMapper;
    private final AdminNoticeMapper adminNoticeMapper;
    private final UserCommentMapper userCommentMapper;
    private final SupportTicketRecordMapper supportTicketRecordMapper;
    private final SupportTicketMessageMapper supportTicketMessageMapper;
    private final SystemSettingMapper systemSettingMapper;
    private final ClientUserContext clientUserContext;
    private final WechatAuthService wechatAuthService;
    private final WechatPayService wechatPayService;

    @Autowired
    public ClientService(
            CategoryMapper categoryMapper,
            DishMapper dishMapper,
            TableMapper tableMapper,
            UserMapper userMapper,
            OrderMapper orderMapper,
            OrderItemMapper orderItemMapper,
            PaymentMapper paymentMapper,
            AdminNoticeMapper adminNoticeMapper,
            UserCommentMapper userCommentMapper,
            SupportTicketRecordMapper supportTicketRecordMapper,
            SupportTicketMessageMapper supportTicketMessageMapper,
            SystemSettingMapper systemSettingMapper,
            ClientUserContext clientUserContext,
            WechatAuthService wechatAuthService,
            WechatPayService wechatPayService
    ) {
        this.categoryMapper = categoryMapper;
        this.dishMapper = dishMapper;
        this.tableMapper = tableMapper;
        this.userMapper = userMapper;
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.paymentMapper = paymentMapper;
        this.adminNoticeMapper = adminNoticeMapper;
        this.userCommentMapper = userCommentMapper;
        this.supportTicketRecordMapper = supportTicketRecordMapper;
        this.supportTicketMessageMapper = supportTicketMessageMapper;
        this.systemSettingMapper = systemSettingMapper;
        this.clientUserContext = clientUserContext;
        this.wechatAuthService = wechatAuthService;
        this.wechatPayService = wechatPayService;
    }

    public ClientService(
            CategoryMapper categoryMapper,
            DishMapper dishMapper,
            TableMapper tableMapper,
            UserMapper userMapper,
            OrderMapper orderMapper,
            OrderItemMapper orderItemMapper,
            PaymentMapper paymentMapper,
            AdminNoticeMapper adminNoticeMapper,
            UserCommentMapper userCommentMapper
    ) {
        this(categoryMapper, dishMapper, tableMapper, userMapper, orderMapper, orderItemMapper, paymentMapper,
                adminNoticeMapper, userCommentMapper, null, null, null, null, null, null);
    }

    public ClientDtos.WechatLoginResponse wechatLogin(ClientDtos.WechatLoginRequest request) {
        if (wechatAuthService == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信登录服务不可用");
        }
        return wechatAuthService.login(request);
    }

    public ClientDtos.BindTableResponse bindTable(ClientDtos.BindTableRequest request) {
        if (request == null || !StringUtils.hasText(request.tableId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tableId 不能为空");
        }
        ensureStoreSupported(request.storeId());
        Long tableId = parseLongId(request.tableId(), "tableId");
        Table table = tableMapper.selectById(tableId);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌台不存在");
        }
        StoreSettings settings = getStoreSettings();
        return new ClientDtos.BindTableResponse(
                settings.storeId(),
                settings.storeName(),
                String.valueOf(table.getId()),
                table.getTableNo()
        );
    }

    public ClientDtos.MenuView getMenu(String storeId) {
        ensureStoreSupported(storeId);
        StoreSettings settings = getStoreSettings();
        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .eq(Category::getStatus, 1)
                        .orderByAsc(Category::getSortOrder)
                        .orderByAsc(Category::getId)
        );
        List<Dish> dishes = dishMapper.selectList(
                new LambdaQueryWrapper<Dish>()
                        .eq(Dish::getStatus, 1)
                        .orderByAsc(Dish::getSortOrder)
                        .orderByAsc(Dish::getId)
        );
        Map<Long, List<Dish>> dishesByCategory = dishes.stream()
                .collect(Collectors.groupingBy(Dish::getCategoryId));

        List<ClientDtos.CategoryView> categoryViews = categories.stream()
                .map(category -> new ClientDtos.CategoryView(
                        String.valueOf(category.getId()),
                        category.getName(),
                        category.getSortOrder() == null ? 0 : category.getSortOrder(),
                        dishesByCategory.getOrDefault(category.getId(), List.of()).stream()
                                .map(this::toDishView)
                                .toList()
                ))
                .toList();

        return new ClientDtos.MenuView(settings.storeId(), settings.storeName(), categoryViews);
    }

    public List<ClientDtos.NoticeView> listNotices() {
        List<AdminNotice> notices = adminNoticeMapper.selectList(
                new LambdaQueryWrapper<AdminNotice>()
                        .orderByDesc(AdminNotice::getIsPinned)
                        .orderByDesc(AdminNotice::getCreateTime)
                        .last("LIMIT " + MAX_UNPAGED_LIST_SIZE)
        );
        return notices.stream()
                .map(n -> new ClientDtos.NoticeView(
                        String.valueOf(n.getId()),
                        n.getTitle(),
                        n.getContent(),
                        toIso(n.getCreateTime())
                ))
                .toList();
    }

    public List<ClientDtos.CommentView> listComments() {
        List<UserComment> comments = userCommentMapper.selectList(
                new LambdaQueryWrapper<UserComment>()
                        .orderByDesc(UserComment::getCreateTime)
                        .last("LIMIT " + MAX_UNPAGED_LIST_SIZE)
        );
        return comments.stream()
                .map(this::toCommentView)
                .toList();
    }

    @Transactional
    public ClientDtos.CommentView createComment(ClientDtos.CreateCommentRequest request) {
        Long orderId = extractOrderIdForComment(request);
        int rating = parseRating(request == null ? null : request.rating());
        String content = trimToNull(request == null ? null : request.content());
        if (content == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "评价内容不能为空");
        }

        Order order = findOwnedOrder(orderId);
        if (order.getStatus() == null || order.getStatus() != ORDER_STATUS_DONE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "订单完成后才可评价");
        }

        UserComment existing = userCommentMapper.selectOne(
                new LambdaQueryWrapper<UserComment>()
                        .eq(UserComment::getOrderId, orderId)
                        .last("LIMIT 1")
        );
        if (existing != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "该订单已评价");
        }

        List<OrderItem> orderItems = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>()
                        .eq(OrderItem::getOrderId, orderId)
                        .orderByAsc(OrderItem::getId)
        );
        String dishName = resolveCommentDishName(orderItems);

        String nickname = "匿名用户";
        if (order.getUserId() != null) {
            User user = userMapper.selectById(order.getUserId());
            if (user != null && StringUtils.hasText(user.getUsername())) {
                nickname = user.getUsername().trim();
            }
        }

        LocalDateTime now = LocalDateTime.now();
        UserComment comment = new UserComment();
        comment.setOrderId(orderId);
        comment.setDishName(dishName);
        comment.setNickname(nickname);
        comment.setRating(rating);
        comment.setContent(content);
        comment.setCreateTime(now);
        userCommentMapper.insert(comment);

        return toCommentView(comment);
    }

    @Transactional
    public ClientDtos.OrderView createOrder(ClientDtos.CreateOrderRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        ensureStoreSupported(request.storeId());
        ensureStoreOpen();

        Long tableId = parseLongId(request.tableId(), "tableId");
        Table table = tableMapper.selectById(tableId);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌台不存在");
        }

        List<ClientDtos.CreateOrderItemRequest> items = request.items();
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "订单明细不能为空");
        }

        Set<Long> dishIds = new HashSet<>();
        Map<OrderLineKey, Integer> qtyByLineKey = new HashMap<>();
        for (ClientDtos.CreateOrderItemRequest item : items) {
            if (item == null || !StringUtils.hasText(item.dishId()) || item.qty() == null || item.qty() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "订单明细不合法");
            }
            Long dishId = parseLongId(item.dishId(), "dishId");
            dishIds.add(dishId);
            qtyByLineKey.merge(new OrderLineKey(dishId, trimToNull(item.skuName())), item.qty(), Integer::sum);
        }

        Map<Long, Dish> dishMap = dishMapper.selectBatchIds(dishIds).stream()
                .collect(Collectors.toMap(Dish::getId, dish -> dish));
        if (dishMap.size() != dishIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "存在无效菜品");
        }
        for (Dish dish : dishMap.values()) {
            boolean onSale = dish.getStatus() != null && dish.getStatus() == 1;
            boolean soldOut = dish.getSoldOut() != null && dish.getSoldOut() == 1;
            if (!onSale || soldOut) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "菜品不可下单: " + dish.getName());
            }
        }

        User user = resolveCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        Order order = new Order();
        order.setUserId(user.getId());
        order.setTableId(table.getId());
        order.setOrderNo(generateOrderNo(now));
        order.setStatus(ORDER_STATUS_PENDING_PAY);
        order.setOrderTime(now);
        order.setCreateTime(now);
        order.setUpdateTime(now);
        order.setRemark(trimToNull(request.remark()));
        order.setTotalAmount(BigDecimal.ZERO);
        orderMapper.insert(order);

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (Map.Entry<OrderLineKey, Integer> entry : qtyByLineKey.entrySet()) {
            OrderLineKey lineKey = entry.getKey();
            Dish dish = dishMap.get(lineKey.dishId());
            BigDecimal unitPrice = dish.getPrice() == null ? BigDecimal.ZERO : dish.getPrice();
            int qty = entry.getValue();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
            totalAmount = totalAmount.add(subtotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setDishId(dish.getId());
            orderItem.setSkuName(lineKey.skuName());
            orderItem.setQuantity(qty);
            orderItem.setUnitPrice(unitPrice);
            orderItem.setSubtotal(subtotal);
            orderItem.setCreateTime(now);
            orderItemMapper.insert(orderItem);
        }

        order.setTotalAmount(totalAmount);
        order.setUpdateTime(LocalDateTime.now());
        orderMapper.updateById(order);

        return getOrder(String.valueOf(order.getId()));
    }

    public List<ClientDtos.OrderView> listOrders() {
        User currentUser = resolveCurrentUser();
        List<Order> orders = orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getUserId, currentUser.getId())
                        .orderByDesc(Order::getCreateTime)
                        .orderByDesc(Order::getId)
        );
        return toOrderViews(orders);
    }

    public ClientDtos.OrderView getOrder(String orderId) {
        Long id = parseLongId(orderId, "orderId");
        Order order = findOwnedOrder(id);
        return toOrderView(order);
    }

    @Transactional
    public ClientDtos.OrderView cancelOrder(String orderId) {
        Long id = parseLongId(orderId, "orderId");
        Order order = findOwnedOrder(id);
        int status = order.getStatus() == null ? ORDER_STATUS_PENDING_PAY : order.getStatus();
        if (status != ORDER_STATUS_PENDING_PAY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前订单状态不支持取消");
        }
        LocalDateTime now = LocalDateTime.now();
        order.setStatus(ORDER_STATUS_CANCELED);
        order.setUpdateTime(now);
        order.setCompleteTime(now);
        orderMapper.updateById(order);
        return getOrder(orderId);
    }

    public ClientDtos.PrepayResponse createWechatPrepay(ClientDtos.PrepayRequest request) {
        Long orderId = extractOrderIdFromPrepay(request);
        Order order = findOwnedOrder(orderId);
        if (order.getStatus() != null && order.getStatus() != ORDER_STATUS_PENDING_PAY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前订单状态不支持发起支付");
        }
        Payment payment = ensurePendingPayment(order);
        if (wechatPayService != null) {
            return wechatPayService.createPrepay(order, resolveCurrentUser(), payment);
        }
        String nonce = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String pkg = "prepay_id=mock_" + order.getId();
        return new ClientDtos.PrepayResponse(
                String.valueOf(System.currentTimeMillis() / 1000),
                nonce,
                pkg,
                pkg,
                "MD5",
                "mock-sign-" + nonce
        );
    }

    @Transactional
    public ClientDtos.OrderView confirmWechatPay(ClientDtos.PrepayRequest request) {
        if (wechatPayService != null && !wechatPayService.isMockMode()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "真实支付模式不支持手动确认支付，请等待微信支付回调");
        }
        Long orderId = extractOrderIdFromPrepay(request);
        Order order = findOwnedOrder(orderId);
        if (order.getStatus() != null && order.getStatus() == ORDER_STATUS_PAID) {
            return getOrder(String.valueOf(orderId));
        }
        if (order.getStatus() != null && order.getStatus() != ORDER_STATUS_PENDING_PAY) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前订单状态不支持确认支付");
        }

        LocalDateTime now = LocalDateTime.now();
        order.setStatus(getStoreSettings().autoAccept() ? ORDER_STATUS_COOKING : ORDER_STATUS_PAID);
        order.setUpdateTime(now);
        orderMapper.updateById(order);

        Payment payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setPaymentNo(generatePaymentNo(now));
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(PAYMENT_METHOD_WECHAT);
        payment.setStatus(PAYMENT_STATUS_SUCCESS);
        payment.setPaymentTime(now);
        payment.setTransactionId("MOCK_TXN_" + UUID.randomUUID().toString().replace("-", ""));
        payment.setCreateTime(now);
        payment.setUpdateTime(now);
        paymentMapper.insert(payment);

        return getOrder(String.valueOf(orderId));
    }

    @Transactional
    public void handleWechatPayNotify(Map<String, String> headers, String body) {
        if (wechatPayService == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付服务不可用");
        }
        WechatPayService.NotifyResult notify = wechatPayService.parseAndVerifyNotify(headers, body);
        Order order = orderMapper.selectOne(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getOrderNo, notify.outTradeNo())
                        .last("LIMIT 1")
        );
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        int expectedFen = toFen(order.getTotalAmount());
        if (notify.totalAmountFen() > 0 && notify.totalAmountFen() != expectedFen) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "支付通知金额不匹配");
        }
        LocalDateTime now = LocalDateTime.now();
        Payment payment = paymentMapper.selectOne(
                new LambdaQueryWrapper<Payment>()
                        .eq(Payment::getPaymentNo, order.getOrderNo())
                        .last("LIMIT 1")
        );
        if (payment == null) {
            payment = new Payment();
            payment.setOrderId(order.getId());
            payment.setPaymentNo(order.getOrderNo());
            payment.setAmount(order.getTotalAmount());
            payment.setPaymentMethod(PAYMENT_METHOD_WECHAT);
            payment.setCreateTime(now);
        }
        payment.setStatus(PAYMENT_STATUS_SUCCESS);
        payment.setTransactionId(notify.transactionId());
        payment.setPaymentTime(now);
        payment.setUpdateTime(now);
        if (payment.getId() == null) {
            paymentMapper.insert(payment);
        } else {
            paymentMapper.updateById(payment);
        }
        if (order.getStatus() == null || order.getStatus() == ORDER_STATUS_PENDING_PAY) {
            order.setStatus(getStoreSettings().autoAccept() ? ORDER_STATUS_COOKING : ORDER_STATUS_PAID);
            order.setUpdateTime(now);
            orderMapper.updateById(order);
        }
    }

    @Transactional
    public ClientDtos.UrgeOrderResponse urgeOrder(String orderId) {
        Long id = parseLongId(orderId, "orderId");
        Order order = findOwnedOrder(id);

        int status = order.getStatus() == null ? ORDER_STATUS_PENDING_PAY : order.getStatus();
        if (status != ORDER_STATUS_PAID && status != ORDER_STATUS_COOKING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前订单状态不支持催单");
        }

        LocalDateTime now = LocalDateTime.now();
        order.setUpdateTime(now);
        orderMapper.updateById(order);
        return new ClientDtos.UrgeOrderResponse(
                String.valueOf(order.getId()),
                mapDbStatus(status),
                "催单成功，商家将尽快处理",
                toIso(now)
        );
    }

    @Transactional
    public ClientDtos.SupportTicketDetailView createSupportTicket(ClientDtos.CreateSupportTicketRequest request) {
        if (supportTicketRecordMapper == null || supportTicketMessageMapper == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "客服服务不可用");
        }
        String topic = trimToNull(request == null ? null : request.topic());
        String content = trimToNull(request == null ? null : request.content());
        if (topic == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "问题主题不能为空");
        }
        if (content == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息内容不能为空");
        }

        User user = resolveCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        SupportTicketRecord ticket = new SupportTicketRecord();
        ticket.setUserId(user.getId());
        ticket.setNickname(resolveUserName(user));
        ticket.setTopic(topic);
        ticket.setLastMessageAt(now);
        ticket.setStatus("OPEN");
        ticket.setCreateTime(now);
        ticket.setUpdateTime(now);
        supportTicketRecordMapper.insert(ticket);

        SupportTicketMessage message = new SupportTicketMessage();
        message.setTicketId(ticket.getId());
        message.setSenderType("USER");
        message.setSenderId(String.valueOf(user.getId()));
        message.setSenderName(resolveUserName(user));
        message.setContent(content);
        message.setIsRead(0);
        message.setCreateTime(now);
        supportTicketMessageMapper.insert(message);

        return toSupportTicketDetailView(ticket);
    }

    public List<ClientDtos.SupportTicketView> listSupportTickets() {
        ensureSupportAvailable();
        User user = resolveCurrentUser();
        return supportTicketRecordMapper.selectList(
                        new LambdaQueryWrapper<SupportTicketRecord>()
                                .eq(SupportTicketRecord::getUserId, user.getId())
                                .orderByDesc(SupportTicketRecord::getLastMessageAt)
                                .orderByDesc(SupportTicketRecord::getId)
                                .last("LIMIT " + MAX_UNPAGED_LIST_SIZE)
                )
                .stream()
                .map(this::toSupportTicketView)
                .toList();
    }

    public ClientDtos.SupportTicketDetailView getSupportTicket(String ticketId) {
        SupportTicketRecord ticket = findOwnedTicket(ticketId);
        return toSupportTicketDetailView(ticket);
    }

    public ClientDtos.PageResult<ClientDtos.SupportTicketMessageView> listSupportMessages(String ticketId, Integer page, Integer pageSize) {
        SupportTicketRecord ticket = findOwnedTicket(ticketId);
        int resolvedPage = page == null ? 1 : Math.max(1, page);
        int resolvedPageSize = pageSize == null || pageSize <= 0 ? 20 : Math.min(100, pageSize);
        Page<SupportTicketMessage> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<SupportTicketMessage> pageRes = supportTicketMessageMapper.selectPage(
                pageReq,
                new LambdaQueryWrapper<SupportTicketMessage>()
                        .eq(SupportTicketMessage::getTicketId, ticket.getId())
                        .orderByDesc(SupportTicketMessage::getCreateTime)
                        .orderByDesc(SupportTicketMessage::getId)
        );
        return new ClientDtos.PageResult<>(
                pageRes.getRecords().stream().map(this::toSupportTicketMessageView).toList(),
                pageRes.getTotal(),
                resolvedPage,
                resolvedPageSize
        );
    }

    @Transactional
    public ClientDtos.SupportTicketMessageView sendSupportMessage(String ticketId, ClientDtos.SendSupportMessageRequest request) {
        SupportTicketRecord ticket = findOwnedTicket(ticketId);
        if (!"OPEN".equals(ticket.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "工单已关闭，无法继续发送消息");
        }
        String content = trimToNull(request == null ? null : request.content());
        if (content == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息内容不能为空");
        }

        User user = resolveCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        SupportTicketMessage message = new SupportTicketMessage();
        message.setTicketId(ticket.getId());
        message.setSenderType("USER");
        message.setSenderId(String.valueOf(user.getId()));
        message.setSenderName(resolveUserName(user));
        message.setContent(content);
        message.setIsRead(0);
        message.setCreateTime(now);
        supportTicketMessageMapper.insert(message);

        ticket.setLastMessageAt(now);
        ticket.setUpdateTime(now);
        supportTicketRecordMapper.updateById(ticket);
        return toSupportTicketMessageView(message);
    }

    private List<ClientDtos.OrderView> toOrderViews(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return List.of();
        }
        StoreSettings settings = getStoreSettings();

        Set<Long> tableIds = orders.stream()
                .map(Order::getTableId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, Table> tableMap = tableIds.isEmpty()
                ? Map.of()
                : nullToEmpty(tableMapper.selectBatchIds(tableIds)).stream()
                        .collect(Collectors.toMap(Table::getId, table -> table));

        Set<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toSet());
        List<OrderItem> allOrderItems = orderIds.isEmpty()
                ? List.of()
                : nullToEmpty(orderItemMapper.selectList(
                        new LambdaQueryWrapper<OrderItem>()
                                .in(OrderItem::getOrderId, orderIds)
                                .orderByAsc(OrderItem::getOrderId)
                                .orderByAsc(OrderItem::getId)
                ));
        Map<Long, List<OrderItem>> orderItemsByOrderId = allOrderItems.stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId));

        Set<Long> dishIds = allOrderItems.stream()
                .map(OrderItem::getDishId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, Dish> dishMap = dishIds.isEmpty()
                ? Map.of()
                : nullToEmpty(dishMapper.selectBatchIds(dishIds)).stream()
                        .collect(Collectors.toMap(Dish::getId, dish -> dish));

        return orders.stream()
                .map(order -> toOrderView(
                        order,
                        settings,
                        tableMap.get(order.getTableId()),
                        orderItemsByOrderId.getOrDefault(order.getId(), List.of()),
                        dishMap
                ))
                .toList();
    }

    private ClientDtos.OrderView toOrderView(Order order) {
        return toOrderViews(List.of(order)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "获取订单失败"));
    }

    private ClientDtos.OrderView toOrderView(
            Order order,
            StoreSettings settings,
            Table table,
            List<OrderItem> orderItems,
            Map<Long, Dish> dishMap
    ) {
        List<ClientDtos.OrderItemView> itemViews = orderItems.stream()
                .map(item -> {
                    Dish dish = dishMap.get(item.getDishId());
                    String dishName = dish == null ? ("菜品#" + item.getDishId()) : dish.getName();
                    return new ClientDtos.OrderItemView(
                            String.valueOf(item.getDishId()),
                            dishName,
                            item.getSkuName(),
                            new ClientDtos.MoneyView(CURRENCY_CNY, toFen(item.getUnitPrice())),
                            item.getQuantity() == null ? 0 : item.getQuantity()
                    );
                })
                .toList();

        String tableName = table == null ? "未知桌台" : table.getTableNo();
        LocalDateTime createdAt = order.getOrderTime() != null ? order.getOrderTime() : order.getCreateTime();
        return new ClientDtos.OrderView(
                String.valueOf(order.getId()),
                settings.storeId(),
                order.getTableId() == null ? "" : String.valueOf(order.getTableId()),
                tableName,
                mapDbStatus(order.getStatus()),
                itemViews,
                new ClientDtos.MoneyView(CURRENCY_CNY, toFen(order.getTotalAmount())),
                order.getRemark(),
                toIso(createdAt)
        );
    }

    private <T> List<T> nullToEmpty(List<T> value) {
        return value == null ? List.of() : value;
    }

    private ClientDtos.DishView toDishView(Dish dish) {
        return new ClientDtos.DishView(
                String.valueOf(dish.getId()),
                String.valueOf(dish.getCategoryId()),
                dish.getName(),
                toFen(dish.getPrice()),
                dish.getStatus() != null && dish.getStatus() == 1,
                dish.getSoldOut() != null && dish.getSoldOut() == 1,
                dish.getImage(),
                dish.getDescription()
        );
    }

    private ClientDtos.CommentView toCommentView(UserComment comment) {
        return new ClientDtos.CommentView(
                String.valueOf(comment.getId()),
                String.valueOf(comment.getOrderId()),
                comment.getNickname(),
                comment.getContent(),
                comment.getRating() == null ? 5 : comment.getRating(),
                toIso(comment.getCreateTime())
        );
    }

    private ClientDtos.SupportTicketView toSupportTicketView(SupportTicketRecord ticket) {
        return new ClientDtos.SupportTicketView(
                String.valueOf(ticket.getId()),
                ticket.getNickname(),
                ticket.getTopic(),
                toIso(ticket.getLastMessageAt()),
                ticket.getStatus()
        );
    }

    private ClientDtos.SupportTicketDetailView toSupportTicketDetailView(SupportTicketRecord ticket) {
        return new ClientDtos.SupportTicketDetailView(
                String.valueOf(ticket.getId()),
                ticket.getNickname(),
                ticket.getTopic(),
                toIso(ticket.getLastMessageAt()),
                ticket.getStatus(),
                toIso(ticket.getCreateTime()),
                toIso(ticket.getUpdateTime())
        );
    }

    private ClientDtos.SupportTicketMessageView toSupportTicketMessageView(SupportTicketMessage message) {
        return new ClientDtos.SupportTicketMessageView(
                String.valueOf(message.getId()),
                String.valueOf(message.getTicketId()),
                message.getSenderType(),
                message.getSenderId(),
                message.getSenderName(),
                message.getContent(),
                message.getIsRead() != null && message.getIsRead() == 1,
                toIso(message.getCreateTime())
        );
    }

    private User resolveCurrentUser() {
        if (clientUserContext != null) {
            return clientUserContext.requireCurrentUser();
        }
        List<User> users = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                        .eq(User::getStatus, 1)
                        .orderByAsc(User::getId)
        );
        if (users.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "系统未配置可用用户");
        }
        return users.get(0);
    }

    private Payment ensurePendingPayment(Order order) {
        Payment payment = paymentMapper.selectOne(
                new LambdaQueryWrapper<Payment>()
                        .eq(Payment::getPaymentNo, order.getOrderNo())
                        .last("LIMIT 1")
        );
        if (payment != null) {
            if (payment.getStatus() != null && payment.getStatus() == PAYMENT_STATUS_SUCCESS) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "订单已支付");
            }
            return payment;
        }

        LocalDateTime now = LocalDateTime.now();
        payment = new Payment();
        payment.setOrderId(order.getId());
        payment.setPaymentNo(order.getOrderNo());
        payment.setAmount(order.getTotalAmount());
        payment.setPaymentMethod(PAYMENT_METHOD_WECHAT);
        payment.setStatus(PAYMENT_STATUS_PENDING);
        payment.setCreateTime(now);
        payment.setUpdateTime(now);
        paymentMapper.insert(payment);
        return payment;
    }

    private void ensureSupportAvailable() {
        if (supportTicketRecordMapper == null || supportTicketMessageMapper == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "客服服务不可用");
        }
    }

    private SupportTicketRecord findOwnedTicket(String ticketId) {
        ensureSupportAvailable();
        Long id = parseLongId(ticketId, "ticketId");
        SupportTicketRecord ticket = supportTicketRecordMapper.selectById(id);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }
        User currentUser = resolveCurrentUser();
        if (!Objects.equals(ticket.getUserId(), currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }
        return ticket;
    }

    private String resolveUserName(User user) {
        String username = trimToNull(user.getUsername());
        if (username != null) {
            return username;
        }
        return "用户" + user.getId();
    }

    private Order findOwnedOrder(Long orderId) {
        Order order = orderMapper.selectById(orderId);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        User currentUser = resolveCurrentUser();
        if (!Objects.equals(order.getUserId(), currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        return order;
    }

    private Long extractOrderIdFromPrepay(ClientDtos.PrepayRequest request) {
        if (request == null || !StringUtils.hasText(request.orderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId 不能为空");
        }
        return parseLongId(request.orderId(), "orderId");
    }

    private Long extractOrderIdForComment(ClientDtos.CreateCommentRequest request) {
        if (request == null || !StringUtils.hasText(request.orderId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId 不能为空");
        }
        return parseLongId(request.orderId(), "orderId");
    }

    private void ensureStoreSupported(String storeId) {
        StoreSettings settings = getStoreSettings();
        if (StringUtils.hasText(storeId) && !settings.storeId().equals(storeId.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前仅支持 " + settings.storeId());
        }
    }

    private void ensureStoreOpen() {
        if (systemSettingMapper == null) {
            return;
        }
        StoreSettings settings = getStoreSettings();
        LocalTime now = LocalTime.now();
        LocalTime openTime = parseTime(settings.openTime(), DEFAULT_OPEN_TIME);
        LocalTime closeTime = parseTime(settings.closeTime(), DEFAULT_CLOSE_TIME);
        boolean open = closeTime.isAfter(openTime)
                ? !now.isBefore(openTime) && now.isBefore(closeTime)
                : !now.isBefore(openTime) || now.isBefore(closeTime);
        if (!open) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "当前不在营业时间内");
        }
    }

    private StoreSettings getStoreSettings() {
        if (systemSettingMapper == null) {
            return StoreSettings.defaults();
        }
        Map<String, String> settings = nullToEmpty(systemSettingMapper.selectList(new LambdaQueryWrapper<SystemSetting>()))
                .stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, SystemSetting::getSettingValue, (a, b) -> a));
        return new StoreSettings(
                trimToDefault(settings.get(SETTING_STORE_ID), DEFAULT_STORE_ID),
                trimToDefault(settings.get(SETTING_STORE_NAME), DEFAULT_STORE_NAME),
                trimToDefault(settings.get(SETTING_OPEN_TIME), DEFAULT_OPEN_TIME),
                trimToDefault(settings.get(SETTING_CLOSE_TIME), DEFAULT_CLOSE_TIME),
                Boolean.parseBoolean(settings.getOrDefault(SETTING_AUTO_ACCEPT, "true"))
        );
    }

    private String trimToDefault(String value, String defaultValue) {
        String trimmed = trimToNull(value);
        return trimmed == null ? defaultValue : trimmed;
    }

    private LocalTime parseTime(String value, String defaultValue) {
        try {
            return LocalTime.parse(value);
        } catch (RuntimeException ignored) {
            return LocalTime.parse(defaultValue);
        }
    }

    private Long parseLongId(String raw, String fieldName) {
        if (!StringUtils.hasText(raw)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 不能为空");
        }
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 非法");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int parseRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "rating 必须在 1 到 5 之间");
        }
        return rating;
    }

    private String resolveCommentDishName(List<OrderItem> orderItems) {
        if (orderItems == null || orderItems.isEmpty()) {
            return "整单评价";
        }
        OrderItem firstItem = orderItems.get(0);
        if (firstItem.getDishId() == null) {
            return "整单评价";
        }
        Dish dish = dishMapper.selectById(firstItem.getDishId());
        if (dish == null || !StringUtils.hasText(dish.getName())) {
            return "整单评价";
        }
        return dish.getName().trim();
    }

    private String generateOrderNo(LocalDateTime now) {
        return "OD" + now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private String generatePaymentNo(LocalDateTime now) {
        return "PY" + now.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    private String mapDbStatus(Integer status) {
        if (status == null) {
            return "PENDING_PAY";
        }
        return switch (status) {
            case ORDER_STATUS_PENDING_PAY -> "PENDING_PAY";
            case ORDER_STATUS_PAID -> "PAID";
            case ORDER_STATUS_COOKING -> "COOKING";
            case ORDER_STATUS_DONE -> "DONE";
            case ORDER_STATUS_CANCELED -> "CANCELED";
            default -> "PENDING_PAY";
        };
    }

    private int toFen(BigDecimal amount) {
        if (amount == null) {
            return 0;
        }
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValue();
    }

    private String toIso(LocalDateTime time) {
        if (time == null) {
            return null;
        }
        return time.atZone(ZoneId.systemDefault()).toInstant().toString();
    }

    private record OrderLineKey(Long dishId, String skuName) {
    }

    private record StoreSettings(
            String storeId,
            String storeName,
            String openTime,
            String closeTime,
            boolean autoAccept
    ) {
        private static StoreSettings defaults() {
            return new StoreSettings(DEFAULT_STORE_ID, DEFAULT_STORE_NAME, DEFAULT_OPEN_TIME, DEFAULT_CLOSE_TIME, true);
        }
    }
}
