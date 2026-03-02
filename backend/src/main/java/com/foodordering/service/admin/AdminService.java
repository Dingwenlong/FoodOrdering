package com.foodordering.service.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.foodordering.auth.AdminJwtTokenService;
import com.foodordering.dto.admin.AdminDtos;
import com.foodordering.entity.AdminNotice;
import com.foodordering.entity.AdminUserAccount;
import com.foodordering.entity.Category;
import com.foodordering.entity.Dish;
import com.foodordering.entity.Order;
import com.foodordering.entity.OrderItem;
import com.foodordering.entity.SupportTicketRecord;
import com.foodordering.entity.Table;
import com.foodordering.entity.User;
import com.foodordering.entity.UserComment;
import com.foodordering.entity.UserFeedback;
import com.foodordering.mapper.AdminNoticeMapper;
import com.foodordering.mapper.AdminUserAccountMapper;
import com.foodordering.mapper.CategoryMapper;
import com.foodordering.mapper.DishMapper;
import com.foodordering.mapper.OrderItemMapper;
import com.foodordering.mapper.OrderMapper;
import com.foodordering.mapper.SupportTicketRecordMapper;
import com.foodordering.mapper.TableMapper;
import com.foodordering.mapper.UserCommentMapper;
import com.foodordering.mapper.UserFeedbackMapper;
import com.foodordering.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final String STORE_ID = "store_1";
    private static final String CURRENCY_CNY = "CNY";
    private static final Map<String, Integer> API_TO_DB_STATUS = Map.of(
            "PENDING_PAY", 0,
            "PAID", 1,
            "COOKING", 2,
            "DONE", 3,
            "CANCELED", 4
    );
    private static final Map<Integer, String> DB_TO_API_STATUS = API_TO_DB_STATUS.entrySet()
            .stream()
            .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey));
    private static final Set<String> FEEDBACK_STATUS_SET = Set.of("OPEN", "IN_PROGRESS", "RESOLVED");
    private static final Set<String> SUPPORT_STATUS_SET = Set.of("OPEN", "CLOSED");

    private final AdminUserAccountMapper adminUserAccountMapper;
    private final AdminNoticeMapper adminNoticeMapper;
    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final DishMapper dishMapper;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final TableMapper tableMapper;
    private final UserCommentMapper userCommentMapper;
    private final UserFeedbackMapper userFeedbackMapper;
    private final SupportTicketRecordMapper supportTicketRecordMapper;
    private final AdminJwtTokenService adminJwtTokenService;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            AdminUserAccountMapper adminUserAccountMapper,
            AdminNoticeMapper adminNoticeMapper,
            UserMapper userMapper,
            CategoryMapper categoryMapper,
            DishMapper dishMapper,
            OrderMapper orderMapper,
            OrderItemMapper orderItemMapper,
            TableMapper tableMapper,
            UserCommentMapper userCommentMapper,
            UserFeedbackMapper userFeedbackMapper,
            SupportTicketRecordMapper supportTicketRecordMapper,
            AdminJwtTokenService adminJwtTokenService,
            PasswordEncoder passwordEncoder
    ) {
        this.adminUserAccountMapper = adminUserAccountMapper;
        this.adminNoticeMapper = adminNoticeMapper;
        this.userMapper = userMapper;
        this.categoryMapper = categoryMapper;
        this.dishMapper = dishMapper;
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.tableMapper = tableMapper;
        this.userCommentMapper = userCommentMapper;
        this.userFeedbackMapper = userFeedbackMapper;
        this.supportTicketRecordMapper = supportTicketRecordMapper;
        this.adminJwtTokenService = adminJwtTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    public AdminDtos.LoginResponse login(AdminDtos.LoginRequest request) {
        if (request == null || !StringUtils.hasText(request.username()) || !StringUtils.hasText(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户名和密码不能为空");
        }

        AdminUserAccount account = adminUserAccountMapper.selectOne(
                new LambdaQueryWrapper<AdminUserAccount>()
                        .eq(AdminUserAccount::getUsername, request.username())
                        .eq(AdminUserAccount::getStatus, 1)
                        .last("LIMIT 1")
        );

        if (account == null || !verifyAdminPassword(account, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
        }

        AdminDtos.AdminUserView userView = toAdminUserView(account);
        String token = adminJwtTokenService.createToken(userView);
        return new AdminDtos.LoginResponse(token, userView);
    }

    public AdminDtos.AdminUserView getProfile(AdminUserAccount currentAdmin) {
        if (currentAdmin == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已失效");
        }
        return toAdminUserView(currentAdmin);
    }

    public List<AdminDtos.NoticeView> listNotices() {
        List<AdminNotice> notices = adminNoticeMapper.selectList(
                new LambdaQueryWrapper<AdminNotice>()
                        .orderByDesc(AdminNotice::getIsPinned)
                        .orderByDesc(AdminNotice::getCreateTime)
        );
        return notices.stream().map(this::toNoticeView).toList();
    }

    public AdminDtos.NoticeView createNotice(AdminDtos.NoticeUpsertRequest request) {
        validateNoticeRequest(request);
        AdminNotice notice = new AdminNotice();
        notice.setTitle(request.title().trim());
        notice.setContent(request.content().trim());
        notice.setIsPinned(Boolean.TRUE.equals(request.isPinned()) ? 1 : 0);
        notice.setCreateTime(LocalDateTime.now());
        notice.setUpdateTime(LocalDateTime.now());
        adminNoticeMapper.insert(notice);
        return toNoticeView(notice);
    }

    public AdminDtos.NoticeView updateNotice(String noticeId, AdminDtos.NoticeUpsertRequest request) {
        validateNoticeRequest(request);
        Long id = parseLongId(noticeId, "noticeId");
        AdminNotice notice = adminNoticeMapper.selectById(id);
        if (notice == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "公告不存在");
        }
        notice.setTitle(request.title().trim());
        notice.setContent(request.content().trim());
        notice.setIsPinned(Boolean.TRUE.equals(request.isPinned()) ? 1 : 0);
        notice.setUpdateTime(LocalDateTime.now());
        adminNoticeMapper.updateById(notice);
        return toNoticeView(notice);
    }

    public void deleteNotice(String noticeId) {
        Long id = parseLongId(noticeId, "noticeId");
        AdminNotice notice = adminNoticeMapper.selectById(id);
        if (notice == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "公告不存在");
        }
        adminNoticeMapper.deleteById(id);
    }

    public List<AdminDtos.AppUserView> listUsers() {
        List<User> users = userMapper.selectList(
                new LambdaQueryWrapper<User>()
                        .orderByDesc(User::getCreateTime)
        );
        if (users.isEmpty()) {
            return List.of();
        }

        Set<Long> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        List<Order> orders = orderMapper.selectList(
                new LambdaQueryWrapper<Order>().in(Order::getUserId, userIds)
        );

        Map<Long, Long> orderCountMap = orders.stream()
                .collect(Collectors.groupingBy(Order::getUserId, Collectors.counting()));

        Map<Long, LocalDateTime> lastOrderTimeMap = orders.stream()
                .filter(o -> o.getOrderTime() != null)
                .collect(Collectors.groupingBy(
                        Order::getUserId,
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparing(Order::getOrderTime)),
                                maxOpt -> maxOpt.map(Order::getOrderTime).orElse(null)
                        )
                ));

        List<AdminDtos.AppUserView> result = new ArrayList<>(users.size());
        for (User user : users) {
            LocalDateTime lastActive = lastOrderTimeMap.get(user.getId());
            if (lastActive == null) {
                lastActive = user.getUpdateTime() != null ? user.getUpdateTime() : user.getCreateTime();
            }
            int orderCount = orderCountMap.getOrDefault(user.getId(), 0L).intValue();
            result.add(new AdminDtos.AppUserView(
                    String.valueOf(user.getId()),
                    user.getUsername(),
                    user.getPhone(),
                    toIso(user.getCreateTime()),
                    toIso(lastActive),
                    orderCount,
                    user.getStatus() != null && user.getStatus() == 1 ? "ACTIVE" : "INACTIVE"
            ));
        }
        return result;
    }

    public AdminDtos.UserStatusView updateUserStatus(String userId, AdminDtos.UserStatusUpdateRequest request) {
        Long id = parseLongId(userId, "userId");
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
        }

        int statusValue = parseUserStatus(request);
        user.setStatus(statusValue);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);

        return new AdminDtos.UserStatusView(String.valueOf(user.getId()), statusValue == 1 ? "ACTIVE" : "INACTIVE");
    }

    public AdminDtos.MenuView listMenu() {
        List<Category> categories = categoryMapper.selectList(
                new LambdaQueryWrapper<Category>()
                        .orderByAsc(Category::getSortOrder)
                        .orderByAsc(Category::getId)
        );
        List<Dish> dishes = dishMapper.selectList(
                new LambdaQueryWrapper<Dish>()
                        .orderByAsc(Dish::getSortOrder)
                        .orderByAsc(Dish::getId)
        );

        List<AdminDtos.CategoryView> categoryViews = categories.stream()
                .map(this::toCategoryView)
                .toList();

        List<AdminDtos.DishView> dishViews = dishes.stream()
                .map(this::toDishView)
                .toList();

        return new AdminDtos.MenuView(categoryViews, dishViews);
    }

    public AdminDtos.CategoryView createCategory(AdminDtos.CategoryUpsertRequest request) {
        if (request == null || !StringUtils.hasText(request.name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类名称不能为空");
        }

        Category category = new Category();
        category.setName(request.name().trim());
        category.setSortOrder(request.sort() == null ? 0 : request.sort());
        category.setStatus(Boolean.FALSE.equals(request.enabled()) ? 0 : 1);
        category.setCreateTime(LocalDateTime.now());
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.insert(category);
        return toCategoryView(category);
    }

    public AdminDtos.CategoryView updateCategory(String categoryId, AdminDtos.CategoryUpsertRequest request) {
        Long id = parseLongId(categoryId, "categoryId");
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "分类不存在");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (request.name() != null) {
            if (!StringUtils.hasText(request.name())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类名称不能为空");
            }
            category.setName(request.name().trim());
        }
        if (request.sort() != null) {
            category.setSortOrder(request.sort());
        }
        if (request.enabled() != null) {
            category.setStatus(Boolean.TRUE.equals(request.enabled()) ? 1 : 0);
        }
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.updateById(category);
        return toCategoryView(category);
    }

    public void deleteCategory(String categoryId) {
        Long id = parseLongId(categoryId, "categoryId");
        Category category = categoryMapper.selectById(id);
        if (category == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "分类不存在");
        }
        Long dishCount = dishMapper.selectCount(new LambdaQueryWrapper<Dish>().eq(Dish::getCategoryId, id));
        if (dishCount != null && dishCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "分类下存在菜品，无法删除");
        }
        categoryMapper.deleteById(id);
    }

    public AdminDtos.DishView createDish(AdminDtos.DishUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (!StringUtils.hasText(request.categoryId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "categoryId 不能为空");
        }
        if (!StringUtils.hasText(request.name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "菜品名称不能为空");
        }
        if (request.priceFen() == null || request.priceFen() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priceFen 非法");
        }

        Long categoryId = parseLongId(request.categoryId(), "categoryId");
        ensureCategoryExists(categoryId);

        Dish dish = new Dish();
        dish.setCategoryId(categoryId);
        dish.setName(request.name().trim());
        dish.setPrice(BigDecimal.valueOf(request.priceFen(), 2));
        dish.setStatus(Boolean.FALSE.equals(request.onSale()) ? 0 : 1);
        dish.setSoldOut(Boolean.TRUE.equals(request.soldOut()) ? 1 : 0);
        dish.setDescription(trimToNull(request.description()));
        dish.setImage(trimToNull(request.image()));
        dish.setSortOrder(request.sort() == null ? 0 : request.sort());
        dish.setCreateTime(LocalDateTime.now());
        dish.setUpdateTime(LocalDateTime.now());
        dishMapper.insert(dish);
        return toDishView(dish);
    }

    public AdminDtos.DishView updateDish(String dishId, AdminDtos.DishUpsertRequest request) {
        Long id = parseLongId(dishId, "dishId");
        Dish dish = dishMapper.selectById(id);
        if (dish == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "菜品不存在");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }

        if (request.categoryId() != null) {
            Long categoryId = parseLongId(request.categoryId(), "categoryId");
            ensureCategoryExists(categoryId);
            dish.setCategoryId(categoryId);
        }
        if (request.name() != null) {
            if (!StringUtils.hasText(request.name())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "菜品名称不能为空");
            }
            dish.setName(request.name().trim());
        }
        if (request.priceFen() != null) {
            if (request.priceFen() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "priceFen 非法");
            }
            dish.setPrice(BigDecimal.valueOf(request.priceFen(), 2));
        }
        if (request.onSale() != null) {
            dish.setStatus(Boolean.TRUE.equals(request.onSale()) ? 1 : 0);
        }
        if (request.soldOut() != null) {
            dish.setSoldOut(Boolean.TRUE.equals(request.soldOut()) ? 1 : 0);
        }
        if (request.description() != null) {
            dish.setDescription(trimToNull(request.description()));
        }
        if (request.image() != null) {
            dish.setImage(trimToNull(request.image()));
        }
        if (request.sort() != null) {
            dish.setSortOrder(request.sort());
        }
        dish.setUpdateTime(LocalDateTime.now());
        dishMapper.updateById(dish);
        return toDishView(dish);
    }

    public void deleteDish(String dishId) {
        Long id = parseLongId(dishId, "dishId");
        Dish dish = dishMapper.selectById(id);
        if (dish == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "菜品不存在");
        }
        Long count = orderItemMapper.selectCount(new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getDishId, id));
        if (count != null && count > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "菜品已有关联订单，无法删除");
        }
        dishMapper.deleteById(id);
    }

    public List<AdminDtos.OrderView> listOrders(String status) {
        Integer statusCode = parseStatusOrNull(status);
        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<Order>().orderByDesc(Order::getOrderTime);
        if (statusCode != null) {
            query.eq(Order::getStatus, statusCode);
        }
        List<Order> orders = orderMapper.selectList(query);
        return buildOrderViews(orders);
    }

    public AdminDtos.OrderView updateOrderStatus(String orderId, AdminDtos.UpdateOrderStatusRequest request) {
        if (!StringUtils.hasText(orderId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId 不能为空");
        }
        if (request == null || !StringUtils.hasText(request.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status 不能为空");
        }

        Long id;
        try {
            id = Long.parseLong(orderId);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "orderId 非法");
        }

        Integer statusCode = parseStatusOrThrow(request.status());
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }

        order.setStatus(statusCode);
        if (statusCode == 3) {
            order.setCompleteTime(LocalDateTime.now());
        }
        order.setUpdateTime(LocalDateTime.now());
        orderMapper.updateById(order);

        return buildOrderViews(List.of(order)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "更新订单失败"));
    }

    public List<AdminDtos.DishSalesView> getDishSales() {
        List<Order> validOrders = orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .ne(Order::getStatus, 4)
        );
        if (validOrders.isEmpty()) {
            return List.of();
        }

        Set<Long> orderIds = validOrders.stream().map(Order::getId).collect(Collectors.toSet());
        List<OrderItem> orderItems = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().in(OrderItem::getOrderId, orderIds)
        );
        if (orderItems.isEmpty()) {
            return List.of();
        }

        Map<Long, Long> soldQtyMap = orderItems.stream()
                .collect(Collectors.groupingBy(
                        OrderItem::getDishId,
                        Collectors.summingLong(item -> item.getQuantity() == null ? 0 : item.getQuantity())
                ));

        Set<Long> dishIds = soldQtyMap.keySet();
        Map<Long, Dish> dishMap = dishMapper.selectBatchIds(dishIds).stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        return soldQtyMap.entrySet().stream()
                .map(entry -> {
                    Dish dish = dishMap.get(entry.getKey());
                    String dishName = dish == null ? ("菜品#" + entry.getKey()) : dish.getName();
                    return new AdminDtos.DishSalesView(
                            String.valueOf(entry.getKey()),
                            dishName,
                            entry.getValue()
                    );
                })
                .sorted(Comparator.comparingLong(AdminDtos.DishSalesView::soldQty).reversed())
                .toList();
    }

    public List<AdminDtos.CommentView> listComments() {
        List<UserComment> comments = userCommentMapper.selectList(
                new LambdaQueryWrapper<UserComment>()
                        .orderByDesc(UserComment::getCreateTime)
        );
        return comments.stream()
                .map(c -> new AdminDtos.CommentView(
                        String.valueOf(c.getId()),
                        String.valueOf(c.getOrderId()),
                        c.getDishName(),
                        c.getNickname(),
                        c.getRating() == null ? 5 : c.getRating(),
                        c.getContent(),
                        toIso(c.getCreateTime())
                ))
                .toList();
    }

    public List<AdminDtos.FeedbackView> listFeedbacks() {
        List<UserFeedback> feedbacks = userFeedbackMapper.selectList(
                new LambdaQueryWrapper<UserFeedback>()
                        .orderByDesc(UserFeedback::getCreateTime)
        );
        return feedbacks.stream().map(this::toFeedbackView).toList();
    }

    public AdminDtos.FeedbackView updateFeedbackStatus(
            String feedbackId,
            AdminDtos.FeedbackStatusUpdateRequest request
    ) {
        Long id = parseLongId(feedbackId, "feedbackId");
        UserFeedback feedback = userFeedbackMapper.selectById(id);
        if (feedback == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "留言不存在");
        }
        String status = parseFeedbackStatus(request == null ? null : request.status());
        feedback.setStatus(status);
        feedback.setUpdateTime(LocalDateTime.now());
        userFeedbackMapper.updateById(feedback);
        return toFeedbackView(feedback);
    }

    public List<AdminDtos.SupportTicketView> listSupportTickets() {
        List<SupportTicketRecord> tickets = supportTicketRecordMapper.selectList(
                new LambdaQueryWrapper<SupportTicketRecord>()
                        .orderByDesc(SupportTicketRecord::getLastMessageAt)
        );
        return tickets.stream().map(this::toSupportTicketView).toList();
    }

    public AdminDtos.SupportTicketView updateSupportTicketStatus(
            String ticketId,
            AdminDtos.SupportTicketStatusUpdateRequest request
    ) {
        Long id = parseLongId(ticketId, "ticketId");
        SupportTicketRecord ticket = supportTicketRecordMapper.selectById(id);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }
        String status = parseSupportStatus(request == null ? null : request.status());
        ticket.setStatus(status);
        ticket.setLastMessageAt(LocalDateTime.now());
        ticket.setUpdateTime(LocalDateTime.now());
        supportTicketRecordMapper.updateById(ticket);
        return toSupportTicketView(ticket);
    }

    private List<AdminDtos.OrderView> buildOrderViews(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return List.of();
        }

        Set<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toSet());
        Set<Long> tableIds = orders.stream()
                .map(Order::getTableId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Table> tableMap = tableIds.isEmpty()
                ? Map.of()
                : tableMapper.selectBatchIds(tableIds).stream().collect(Collectors.toMap(Table::getId, Function.identity()));

        List<OrderItem> orderItems = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().in(OrderItem::getOrderId, orderIds)
        );
        Map<Long, List<OrderItem>> orderItemMap = orderItems.stream().collect(Collectors.groupingBy(OrderItem::getOrderId));

        Set<Long> dishIds = new HashSet<>();
        for (OrderItem item : orderItems) {
            if (item.getDishId() != null) {
                dishIds.add(item.getDishId());
            }
        }
        Map<Long, Dish> dishMap = dishIds.isEmpty()
                ? Map.of()
                : dishMapper.selectBatchIds(dishIds).stream().collect(Collectors.toMap(Dish::getId, Function.identity()));

        return orders.stream().map(order -> {
            List<OrderItem> items = orderItemMap.getOrDefault(order.getId(), List.of());
            List<AdminDtos.OrderItemView> itemViews = items.stream().map(item -> {
                Dish dish = dishMap.get(item.getDishId());
                String dishName = dish == null ? ("菜品#" + item.getDishId()) : dish.getName();
                return new AdminDtos.OrderItemView(
                        String.valueOf(item.getDishId()),
                        dishName,
                        null,
                        null,
                        new AdminDtos.MoneyView(CURRENCY_CNY, toFen(item.getUnitPrice())),
                        item.getQuantity() == null ? 0 : item.getQuantity()
                );
            }).toList();

            Table table = order.getTableId() == null ? null : tableMap.get(order.getTableId());
            String tableName = table == null ? "未分配桌台" : table.getTableNo();
            LocalDateTime createdAt = order.getOrderTime() != null ? order.getOrderTime() : order.getCreateTime();

            return new AdminDtos.OrderView(
                    String.valueOf(order.getId()),
                    STORE_ID,
                    order.getTableId() == null ? "" : String.valueOf(order.getTableId()),
                    tableName,
                    mapDbStatusToApi(order.getStatus()),
                    itemViews,
                    new AdminDtos.MoneyView(CURRENCY_CNY, toFen(order.getTotalAmount())),
                    order.getRemark(),
                    toIso(createdAt)
            );
        }).toList();
    }

    private AdminDtos.NoticeView toNoticeView(AdminNotice notice) {
        return new AdminDtos.NoticeView(
                String.valueOf(notice.getId()),
                notice.getTitle(),
                notice.getContent(),
                toIso(notice.getCreateTime()),
                notice.getIsPinned() != null && notice.getIsPinned() == 1
        );
    }

    private AdminDtos.CategoryView toCategoryView(Category category) {
        return new AdminDtos.CategoryView(
                String.valueOf(category.getId()),
                category.getName(),
                category.getSortOrder() == null ? 0 : category.getSortOrder()
        );
    }

    private AdminDtos.DishView toDishView(Dish dish) {
        return new AdminDtos.DishView(
                String.valueOf(dish.getId()),
                String.valueOf(dish.getCategoryId()),
                dish.getName(),
                toFen(dish.getPrice()),
                dish.getStatus() != null && dish.getStatus() == 1,
                dish.getSoldOut() != null && dish.getSoldOut() == 1
        );
    }

    private AdminDtos.FeedbackView toFeedbackView(UserFeedback feedback) {
        return new AdminDtos.FeedbackView(
                String.valueOf(feedback.getId()),
                feedback.getNickname(),
                feedback.getContent(),
                toIso(feedback.getCreateTime()),
                feedback.getStatus()
        );
    }

    private AdminDtos.SupportTicketView toSupportTicketView(SupportTicketRecord ticket) {
        return new AdminDtos.SupportTicketView(
                String.valueOf(ticket.getId()),
                ticket.getNickname(),
                ticket.getTopic(),
                toIso(ticket.getLastMessageAt()),
                ticket.getStatus()
        );
    }

    private void validateNoticeRequest(AdminDtos.NoticeUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (!StringUtils.hasText(request.title())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "公告标题不能为空");
        }
        if (!StringUtils.hasText(request.content())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "公告内容不能为空");
        }
    }

    private Long parseLongId(String raw, String fieldName) {
        if (!StringUtils.hasText(raw)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 不能为空");
        }
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " 非法");
        }
    }

    private int parseUserStatus(AdminDtos.UserStatusUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (request.enabled() != null) {
            return Boolean.TRUE.equals(request.enabled()) ? 1 : 0;
        }
        String status = request.status();
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "状态不能为空");
        }
        String normalized = status.trim().toUpperCase();
        return switch (normalized) {
            case "1", "TRUE", "ACTIVE", "ENABLED" -> 1;
            case "0", "FALSE", "INACTIVE", "DISABLED" -> 0;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法用户状态: " + status);
        };
    }

    private String parseFeedbackStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "状态不能为空");
        }
        String normalized = status.trim().toUpperCase();
        if (!FEEDBACK_STATUS_SET.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法留言状态: " + status);
        }
        return normalized;
    }

    private String parseSupportStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "状态不能为空");
        }
        String normalized = status.trim().toUpperCase();
        if (!SUPPORT_STATUS_SET.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法工单状态: " + status);
        }
        return normalized;
    }

    private void ensureCategoryExists(Long categoryId) {
        if (categoryMapper.selectById(categoryId) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "分类不存在");
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private AdminDtos.AdminUserView toAdminUserView(AdminUserAccount account) {
        return new AdminDtos.AdminUserView(
                String.valueOf(account.getId()),
                account.getUsername(),
                account.getDisplayName(),
                account.getRoleName()
        );
    }

    private boolean verifyAdminPassword(AdminUserAccount account, String rawPassword) {
        String storedPassword = account.getPassword();
        if (!StringUtils.hasText(storedPassword)) {
            return false;
        }

        boolean matched = false;
        try {
            matched = passwordEncoder.matches(rawPassword, storedPassword);
        } catch (IllegalArgumentException ignored) {
            matched = false;
        }
        if (matched) {
            return true;
        }

        // 兼容历史明文密码，首次登录成功后自动升级为哈希存储。
        if (!Objects.equals(storedPassword, rawPassword)) {
            return false;
        }

        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setUpdateTime(LocalDateTime.now());
        adminUserAccountMapper.updateById(account);
        return true;
    }

    private Integer parseStatusOrNull(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        return parseStatusOrThrow(status);
    }

    private Integer parseStatusOrThrow(String status) {
        Integer code = API_TO_DB_STATUS.get(status);
        if (code == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法状态: " + status);
        }
        return code;
    }

    private String mapDbStatusToApi(Integer statusCode) {
        return DB_TO_API_STATUS.getOrDefault(statusCode, "PENDING_PAY");
    }

    private int toFen(BigDecimal amount) {
        if (amount == null) {
            return 0;
        }
        return amount
                .movePointRight(2)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    private String toIso(LocalDateTime time) {
        if (time == null) {
            return null;
        }
        return time.atZone(ZoneId.systemDefault()).toInstant().toString();
    }
}
