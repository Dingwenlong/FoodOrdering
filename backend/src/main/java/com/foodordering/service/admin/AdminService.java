package com.foodordering.service.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.foodordering.auth.AdminAuthorizationService;
import com.foodordering.auth.AdminJwtTokenService;
import com.foodordering.dto.admin.AdminDtos;
import com.foodordering.entity.AdminOperationLog;
import com.foodordering.entity.AdminNotice;
import com.foodordering.entity.AdminUserAccount;
import com.foodordering.entity.Category;
import com.foodordering.entity.Dish;
import com.foodordering.entity.Order;
import com.foodordering.entity.OrderItem;
import com.foodordering.entity.Payment;
import com.foodordering.entity.SupportTicketMessage;
import com.foodordering.entity.SupportTicketRecord;
import com.foodordering.entity.SystemSetting;
import com.foodordering.entity.Table;
import com.foodordering.entity.User;
import com.foodordering.entity.UserComment;
import com.foodordering.entity.UserFeedback;
import com.foodordering.mapper.AdminOperationLogMapper;
import com.foodordering.mapper.AdminNoticeMapper;
import com.foodordering.mapper.AdminUserAccountMapper;
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
import com.foodordering.mapper.UserFeedbackMapper;
import com.foodordering.mapper.UserMapper;
import com.foodordering.websocket.MenuWebSocketHandler;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
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
    private static final Set<String> TABLE_STATUS_SET = Set.of("IDLE", "OCCUPIED", "RESERVED", "MAINTENANCE");
    private static final Map<String, Integer> TABLE_STATUS_TO_DB = Map.of(
            "IDLE", 0,
            "OCCUPIED", 1,
            "RESERVED", 2,
            "MAINTENANCE", 3
    );
    private static final Map<Integer, String> DB_TO_TABLE_STATUS = TABLE_STATUS_TO_DB.entrySet()
            .stream()
            .collect(Collectors.toMap(Map.Entry::getValue, Map.Entry::getKey));
    private static final Map<Integer, String> DB_TO_PAYMENT_STATUS = Map.of(
            0, "PENDING",
            1, "SUCCESS",
            2, "FAILED"
    );
    private static final Map<Integer, String> DB_TO_PAYMENT_METHOD = Map.of(
            1, "ALIPAY",
            2, "WECHAT",
            3, "CASH"
    );
    private static final String SETTING_STORE_ID = "storeId";
    private static final String SETTING_STORE_NAME = "storeName";
    private static final String SETTING_OPEN_TIME = "openTime";
    private static final String SETTING_CLOSE_TIME = "closeTime";
    private static final String SETTING_AUTO_ACCEPT = "autoAccept";
    private static final String SETTING_PRINTER_ENABLED = "printerEnabled";

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
    private final SupportTicketMessageMapper supportTicketMessageMapper;
    private final PaymentMapper paymentMapper;
    private final SystemSettingMapper systemSettingMapper;
    private final AdminOperationLogMapper adminOperationLogMapper;
    private final AdminJwtTokenService adminJwtTokenService;
    private final AdminAuthorizationService adminAuthorizationService;
    private final PasswordEncoder passwordEncoder;
    private final MenuWebSocketHandler menuWebSocketHandler;

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
            SupportTicketMessageMapper supportTicketMessageMapper,
            PaymentMapper paymentMapper,
            SystemSettingMapper systemSettingMapper,
            AdminOperationLogMapper adminOperationLogMapper,
            AdminJwtTokenService adminJwtTokenService,
            AdminAuthorizationService adminAuthorizationService,
            PasswordEncoder passwordEncoder,
            MenuWebSocketHandler menuWebSocketHandler
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
        this.supportTicketMessageMapper = supportTicketMessageMapper;
        this.paymentMapper = paymentMapper;
        this.systemSettingMapper = systemSettingMapper;
        this.adminOperationLogMapper = adminOperationLogMapper;
        this.adminJwtTokenService = adminJwtTokenService;
        this.adminAuthorizationService = adminAuthorizationService;
        this.passwordEncoder = passwordEncoder;
        this.menuWebSocketHandler = menuWebSocketHandler;
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

    public List<AdminDtos.RoleView> listRoles() {
        return adminAuthorizationService.getRoleNames().stream()
                .map(role -> new AdminDtos.RoleView(role, adminAuthorizationService.getPermissionNames(role)))
                .toList();
    }

    public AdminDtos.PageResult<AdminDtos.AdminAccountView> listAdminAccounts(
            int page,
            int pageSize,
            String keyword,
            String roleName,
            String status
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);
        LambdaQueryWrapper<AdminUserAccount> query = new LambdaQueryWrapper<AdminUserAccount>()
                .orderByDesc(AdminUserAccount::getCreateTime);

        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(AdminUserAccount::getUsername, q).or().like(AdminUserAccount::getDisplayName, q);
                if (idKeyword != null) {
                    w.or().eq(AdminUserAccount::getId, idKeyword);
                }
            });
        }
        String role = trimToNull(roleName);
        if (role != null) {
            query.eq(AdminUserAccount::getRoleName, role);
        }
        Integer statusCode = parseEnabledStatusOrNull(status);
        if (statusCode != null) {
            query.eq(AdminUserAccount::getStatus, statusCode);
        }

        Page<AdminUserAccount> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<AdminUserAccount> pageRes = adminUserAccountMapper.selectPage(pageReq, query);
        return new AdminDtos.PageResult<>(
                pageRes.getRecords().stream().map(this::toAdminAccountView).toList(),
                pageRes.getTotal(),
                resolvedPage,
                resolvedPageSize
        );
    }

    public AdminDtos.AdminAccountView createAdminAccount(AdminDtos.AdminAccountUpsertRequest request) {
        validateAdminAccountRequest(request, true);
        String username = request.username().trim();
        Long existingCount = adminUserAccountMapper.selectCount(
                new LambdaQueryWrapper<AdminUserAccount>().eq(AdminUserAccount::getUsername, username)
        );
        if (existingCount != null && existingCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "管理员账号已存在");
        }

        AdminUserAccount account = new AdminUserAccount();
        account.setUsername(username);
        account.setPassword(passwordEncoder.encode(request.password().trim()));
        account.setDisplayName(request.displayName().trim());
        account.setRoleName(request.roleName().trim());
        account.setStatus(Boolean.FALSE.equals(request.enabled()) ? 0 : 1);
        account.setCreateTime(LocalDateTime.now());
        account.setUpdateTime(LocalDateTime.now());
        adminUserAccountMapper.insert(account);
        return toAdminAccountView(account);
    }

    public AdminDtos.AdminAccountView updateAdminAccount(String adminUserId, AdminDtos.AdminAccountUpsertRequest request) {
        Long id = parseLongId(adminUserId, "adminUserId");
        AdminUserAccount account = adminUserAccountMapper.selectById(id);
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "管理员账号不存在");
        }
        validateAdminAccountRequest(request, false);

        if (StringUtils.hasText(request.username())) {
            String username = request.username().trim();
            if (!username.equals(account.getUsername())) {
                Long existingCount = adminUserAccountMapper.selectCount(
                        new LambdaQueryWrapper<AdminUserAccount>().eq(AdminUserAccount::getUsername, username)
                );
                if (existingCount != null && existingCount > 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "管理员账号已存在");
                }
                account.setUsername(username);
            }
        }
        if (StringUtils.hasText(request.displayName())) {
            account.setDisplayName(request.displayName().trim());
        }
        if (StringUtils.hasText(request.roleName())) {
            ensureRoleExists(request.roleName());
            account.setRoleName(request.roleName().trim());
        }
        if (request.enabled() != null) {
            account.setStatus(Boolean.TRUE.equals(request.enabled()) ? 1 : 0);
        }
        account.setUpdateTime(LocalDateTime.now());
        adminUserAccountMapper.updateById(account);
        return toAdminAccountView(account);
    }

    public AdminDtos.AdminAccountView updateAdminAccountStatus(
            String adminUserId,
            AdminDtos.AdminAccountStatusUpdateRequest request
    ) {
        Long id = parseLongId(adminUserId, "adminUserId");
        AdminUserAccount account = adminUserAccountMapper.selectById(id);
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "管理员账号不存在");
        }
        int status = parseEnabledStatus(request == null ? null : request.status(), request == null ? null : request.enabled());
        account.setStatus(status);
        account.setUpdateTime(LocalDateTime.now());
        adminUserAccountMapper.updateById(account);
        return toAdminAccountView(account);
    }

    public AdminDtos.AdminAccountView resetAdminPassword(
            String adminUserId,
            AdminDtos.AdminPasswordResetRequest request
    ) {
        Long id = parseLongId(adminUserId, "adminUserId");
        AdminUserAccount account = adminUserAccountMapper.selectById(id);
        if (account == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "管理员账号不存在");
        }
        if (request == null || !StringUtils.hasText(request.password()) || request.password().trim().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "新密码至少 6 位");
        }
        account.setPassword(passwordEncoder.encode(request.password().trim()));
        account.setUpdateTime(LocalDateTime.now());
        adminUserAccountMapper.updateById(account);
        return toAdminAccountView(account);
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

    public AdminDtos.PageResult<AdminDtos.AppUserView> listUsersPaged(
            int page,
            int pageSize,
            String keyword,
            String status
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);

        LambdaQueryWrapper<User> query = new LambdaQueryWrapper<User>()
                .orderByDesc(User::getCreateTime);

        String trimmedStatus = trimToNull(status);
        if (trimmedStatus != null) {
            String normalized = trimmedStatus.trim().toUpperCase();
            if ("ACTIVE".equals(normalized) || "1".equals(normalized)) {
                query.eq(User::getStatus, 1);
            } else if ("INACTIVE".equals(normalized) || "0".equals(normalized)) {
                query.eq(User::getStatus, 0);
            }
        }

        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(User::getUsername, q).or().like(User::getPhone, q);
                if (idKeyword != null) {
                    w.or().eq(User::getId, idKeyword);
                }
            });
        }

        Page<User> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<User> pageRes = userMapper.selectPage(pageReq, query);
        List<User> users = pageRes.getRecords();

        if (users == null || users.isEmpty()) {
            return new AdminDtos.PageResult<>(List.of(), pageRes.getTotal(), resolvedPage, resolvedPageSize);
        }

        Set<Long> userIds = users.stream().map(User::getId).collect(Collectors.toSet());
        List<Order> orders = orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .in(Order::getUserId, userIds)
                        .select(Order::getUserId, Order::getOrderTime)
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

        return new AdminDtos.PageResult<>(result, pageRes.getTotal(), resolvedPage, resolvedPageSize);
    }

    public AdminDtos.AppUserDetailView getUserDetail(String userId) {
        Long id = parseLongId(userId, "userId");
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
        }

        List<Order> orders = orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getUserId, id)
                        .select(Order::getOrderTime)
        );

        int orderCount = orders.size();
        LocalDateTime lastOrderTime = orders.stream()
                .filter(o -> o.getOrderTime() != null)
                .max(Comparator.comparing(Order::getOrderTime))
                .map(Order::getOrderTime)
                .orElse(null);

        LocalDateTime lastActive = lastOrderTime;
        if (lastActive == null) {
            lastActive = user.getUpdateTime() != null ? user.getUpdateTime() : user.getCreateTime();
        }

        return new AdminDtos.AppUserDetailView(
                String.valueOf(user.getId()),
                user.getUsername(),
                user.getPhone(),
                user.getEmail(),
                user.getAvatar(),
                toIso(user.getCreateTime()),
                toIso(lastActive),
                orderCount,
                user.getStatus() != null && user.getStatus() == 1 ? "ACTIVE" : "INACTIVE"
        );
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
        menuWebSocketHandler.broadcastMenuUpdate();
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
        menuWebSocketHandler.broadcastMenuUpdate();
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
        menuWebSocketHandler.broadcastMenuUpdate();
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
        menuWebSocketHandler.broadcastMenuUpdate();
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
        menuWebSocketHandler.broadcastMenuUpdate();
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
        menuWebSocketHandler.broadcastMenuUpdate();
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

    public AdminDtos.PageResult<AdminDtos.OrderView> listOrdersPaged(
            int page,
            int pageSize,
            String status,
            String keyword,
            String tableId,
            String userId,
            String from,
            String to
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);
        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<Order>().orderByDesc(Order::getOrderTime);

        Integer statusCode = parseStatusOrNull(status);
        if (statusCode != null) {
            query.eq(Order::getStatus, statusCode);
        }
        Long resolvedTableId = parseLongOrNull(tableId);
        if (resolvedTableId != null) {
            query.eq(Order::getTableId, resolvedTableId);
        }
        Long resolvedUserId = parseLongOrNull(userId);
        if (resolvedUserId != null) {
            query.eq(Order::getUserId, resolvedUserId);
        }
        LocalDateTime fromTime = parseDateStartOrNull(from);
        if (fromTime != null) {
            query.ge(Order::getOrderTime, fromTime);
        }
        LocalDateTime toTime = parseDateEndOrNull(to);
        if (toTime != null) {
            query.le(Order::getOrderTime, toTime);
        }
        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(Order::getOrderNo, q);
                if (idKeyword != null) {
                    w.or().eq(Order::getId, idKeyword).or().eq(Order::getTableId, idKeyword).or().eq(Order::getUserId, idKeyword);
                }
            });
        }

        Page<Order> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<Order> pageRes = orderMapper.selectPage(pageReq, query);
        return new AdminDtos.PageResult<>(
                buildOrderViews(pageRes.getRecords()),
                pageRes.getTotal(),
                resolvedPage,
                resolvedPageSize
        );
    }

    public AdminDtos.OrderView getOrderDetail(String orderId) {
        Long id = parseLongId(orderId, "orderId");
        Order order = orderMapper.selectById(id);
        if (order == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        return buildOrderViews(List.of(order)).stream().findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "获取订单失败"));
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

        menuWebSocketHandler.broadcastOrderUpdate(orderId);

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

    public AdminDtos.StatsSummaryView getStatsSummary(String from, String to) {
        List<Order> orders = listOrdersInRange(from, to);
        List<Order> paidOrders = orders.stream()
                .filter(order -> order.getStatus() != null && order.getStatus() >= 1 && order.getStatus() <= 3)
                .toList();
        BigDecimal revenue = paidOrders.stream()
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long orderCount = orders.size();
        long paidOrderCount = paidOrders.size();
        BigDecimal average = paidOrderCount == 0
                ? BigDecimal.ZERO
                : revenue.divide(BigDecimal.valueOf(paidOrderCount), 2, RoundingMode.HALF_UP);
        double paymentSuccessRate = orderCount == 0 ? 0 : (paidOrderCount * 1.0d / orderCount);
        return new AdminDtos.StatsSummaryView(
                new AdminDtos.MoneyView(CURRENCY_CNY, toFen(revenue)),
                orderCount,
                paidOrderCount,
                new AdminDtos.MoneyView(CURRENCY_CNY, toFen(average)),
                paymentSuccessRate
        );
    }

    public List<AdminDtos.StatsTrendPointView> getStatsTrend(String from, String to) {
        List<Order> orders = listOrdersInRange(from, to);
        LocalDate startDate = parseDateOrDefault(from, LocalDate.now().minusDays(6));
        LocalDate endDate = parseDateOrDefault(to, LocalDate.now());
        if (endDate.isBefore(startDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "结束日期不能早于开始日期");
        }
        Map<LocalDate, List<Order>> byDate = orders.stream()
                .filter(order -> order.getOrderTime() != null)
                .collect(Collectors.groupingBy(order -> order.getOrderTime().toLocalDate()));

        List<AdminDtos.StatsTrendPointView> result = new ArrayList<>();
        for (LocalDate cursor = startDate; !cursor.isAfter(endDate); cursor = cursor.plusDays(1)) {
            List<Order> dayOrders = byDate.getOrDefault(cursor, List.of());
            List<Order> paidOrders = dayOrders.stream()
                    .filter(order -> order.getStatus() != null && order.getStatus() >= 1 && order.getStatus() <= 3)
                    .toList();
            BigDecimal revenue = paidOrders.stream()
                    .map(Order::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            result.add(new AdminDtos.StatsTrendPointView(
                    cursor.toString(),
                    new AdminDtos.MoneyView(CURRENCY_CNY, toFen(revenue)),
                    dayOrders.size(),
                    paidOrders.size()
            ));
        }
        return result;
    }

    public AdminDtos.SystemSettingsView getSystemSettings() {
        Map<String, String> settings = systemSettingMapper.selectList(new LambdaQueryWrapper<SystemSetting>())
                .stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, SystemSetting::getSettingValue, (a, b) -> a));
        return new AdminDtos.SystemSettingsView(
                settings.getOrDefault(SETTING_STORE_ID, STORE_ID),
                settings.getOrDefault(SETTING_STORE_NAME, "FoodOrdering 示例门店"),
                settings.getOrDefault(SETTING_OPEN_TIME, "09:00"),
                settings.getOrDefault(SETTING_CLOSE_TIME, "22:00"),
                Boolean.parseBoolean(settings.getOrDefault(SETTING_AUTO_ACCEPT, "true")),
                Boolean.parseBoolean(settings.getOrDefault(SETTING_PRINTER_ENABLED, "false"))
        );
    }

    public AdminDtos.SystemSettingsView updateSystemSettings(AdminDtos.SystemSettingsUpdateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (StringUtils.hasText(request.storeId())) {
            upsertSetting(SETTING_STORE_ID, request.storeId().trim(), "门店ID");
        }
        if (StringUtils.hasText(request.storeName())) {
            upsertSetting(SETTING_STORE_NAME, request.storeName().trim(), "门店名称");
        }
        if (StringUtils.hasText(request.openTime())) {
            validateTimeText(request.openTime(), "营业开始时间");
            upsertSetting(SETTING_OPEN_TIME, request.openTime().trim(), "营业开始时间");
        }
        if (StringUtils.hasText(request.closeTime())) {
            validateTimeText(request.closeTime(), "营业结束时间");
            upsertSetting(SETTING_CLOSE_TIME, request.closeTime().trim(), "营业结束时间");
        }
        if (request.autoAccept() != null) {
            upsertSetting(SETTING_AUTO_ACCEPT, String.valueOf(Boolean.TRUE.equals(request.autoAccept())), "是否自动接单");
        }
        if (request.printerEnabled() != null) {
            upsertSetting(SETTING_PRINTER_ENABLED, String.valueOf(Boolean.TRUE.equals(request.printerEnabled())), "是否启用打印");
        }
        return getSystemSettings();
    }

    public AdminDtos.PageResult<AdminDtos.AuditLogView> listAuditLogs(
            int page,
            int pageSize,
            String keyword,
            String result
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);
        LambdaQueryWrapper<AdminOperationLog> query = new LambdaQueryWrapper<AdminOperationLog>()
                .orderByDesc(AdminOperationLog::getCreateTime);
        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(AdminOperationLog::getAdminName, q)
                        .or().like(AdminOperationLog::getRequestPath, q)
                        .or().like(AdminOperationLog::getResourceType, q);
                if (idKeyword != null) {
                    w.or().eq(AdminOperationLog::getAdminId, idKeyword);
                }
            });
        }
        String normalizedResult = trimToNull(result);
        if (normalizedResult != null) {
            query.eq(AdminOperationLog::getResult, normalizedResult.toUpperCase());
        }
        Page<AdminOperationLog> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<AdminOperationLog> pageRes = adminOperationLogMapper.selectPage(pageReq, query);
        return new AdminDtos.PageResult<>(
                pageRes.getRecords().stream().map(this::toAuditLogView).toList(),
                pageRes.getTotal(),
                resolvedPage,
                resolvedPageSize
        );
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

    public AdminDtos.PageResult<AdminDtos.SupportTicketView> listSupportTicketsPaged(
            int page,
            int pageSize,
            String keyword,
            String status
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);

        LambdaQueryWrapper<SupportTicketRecord> query = new LambdaQueryWrapper<SupportTicketRecord>()
                .orderByDesc(SupportTicketRecord::getLastMessageAt);

        String trimmedStatus = trimToNull(status);
        if (trimmedStatus != null) {
            query.eq(SupportTicketRecord::getStatus, trimmedStatus.trim().toUpperCase());
        }

        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(SupportTicketRecord::getNickname, q).or().like(SupportTicketRecord::getTopic, q);
                if (idKeyword != null) {
                    w.or().eq(SupportTicketRecord::getId, idKeyword);
                }
            });
        }

        Page<SupportTicketRecord> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<SupportTicketRecord> pageRes = supportTicketRecordMapper.selectPage(pageReq, query);
        List<AdminDtos.SupportTicketView> list = pageRes.getRecords().stream().map(this::toSupportTicketView).toList();
        return new AdminDtos.PageResult<>(list, pageRes.getTotal(), resolvedPage, resolvedPageSize);
    }

    public AdminDtos.SupportTicketDetailView getSupportTicketDetail(String ticketId) {
        Long id = parseLongId(ticketId, "ticketId");
        SupportTicketRecord ticket = supportTicketRecordMapper.selectById(id);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }
        return new AdminDtos.SupportTicketDetailView(
                String.valueOf(ticket.getId()),
                ticket.getNickname(),
                ticket.getTopic(),
                toIso(ticket.getLastMessageAt()),
                ticket.getStatus(),
                toIso(ticket.getCreateTime()),
                toIso(ticket.getUpdateTime())
        );
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
        ticket.setUpdateTime(LocalDateTime.now());
        supportTicketRecordMapper.updateById(ticket);
        return toSupportTicketView(ticket);
    }

    public AdminDtos.PageResult<AdminDtos.SupportTicketMessageView> listTicketMessages(
            String ticketId,
            Integer page,
            Integer pageSize
    ) {
        Long id = parseLongId(ticketId, "ticketId");
        SupportTicketRecord ticket = supportTicketRecordMapper.selectById(id);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }

        int resolvedPage = page == null ? 1 : Math.max(1, page);
        int resolvedPageSize = pageSize == null ? 20 : Math.min(200, Math.max(1, pageSize));

        LambdaQueryWrapper<SupportTicketMessage> query = new LambdaQueryWrapper<SupportTicketMessage>()
                .eq(SupportTicketMessage::getTicketId, id)
                .orderByDesc(SupportTicketMessage::getCreateTime);

        Page<SupportTicketMessage> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<SupportTicketMessage> pageRes = supportTicketMessageMapper.selectPage(pageReq, query);

        List<AdminDtos.SupportTicketMessageView> list = pageRes.getRecords().stream()
                .map(this::toMessageView)
                .toList();

        return new AdminDtos.PageResult<>(list, pageRes.getTotal(), resolvedPage, resolvedPageSize);
    }

    public AdminDtos.SupportTicketMessageView sendMessage(
            String ticketId,
            AdminDtos.SendMessageRequest request,
            AdminUserAccount sender
    ) {
        if (request == null || !StringUtils.hasText(request.content())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "消息内容不能为空");
        }

        Long id = parseLongId(ticketId, "ticketId");
        SupportTicketRecord ticket = supportTicketRecordMapper.selectById(id);
        if (ticket == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "工单不存在");
        }

        SupportTicketMessage message = new SupportTicketMessage();
        message.setTicketId(id);
        message.setSenderType("ADMIN");
        message.setSenderId(String.valueOf(sender.getId()));
        message.setSenderName(sender.getDisplayName());
        message.setContent(request.content().trim());
        message.setIsRead(0);
        message.setCreateTime(LocalDateTime.now());
        supportTicketMessageMapper.insert(message);

        ticket.setLastMessageAt(LocalDateTime.now());
        ticket.setUpdateTime(LocalDateTime.now());
        supportTicketRecordMapper.updateById(ticket);

        return toMessageView(message);
    }

    private AdminDtos.SupportTicketMessageView toMessageView(SupportTicketMessage message) {
        return new AdminDtos.SupportTicketMessageView(
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

    private List<AdminDtos.OrderView> buildOrderViews(List<Order> orders) {
        if (orders == null || orders.isEmpty()) {
            return List.of();
        }

        Set<Long> orderIds = orders.stream().map(Order::getId).collect(Collectors.toSet());
        Set<Long> tableIds = orders.stream()
                .map(Order::getTableId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> userIds = orders.stream()
                .map(Order::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Table> tableMap = tableIds.isEmpty()
                ? Map.of()
                : tableMapper.selectBatchIds(tableIds).stream().collect(Collectors.toMap(Table::getId, Function.identity()));
        Map<Long, User> userMap = userIds.isEmpty()
                ? Map.of()
                : userMapper.selectBatchIds(userIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));

        List<OrderItem> orderItems = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>().in(OrderItem::getOrderId, orderIds)
        );
        Map<Long, List<OrderItem>> orderItemMap = orderItems.stream().collect(Collectors.groupingBy(OrderItem::getOrderId));
        List<Payment> payments = paymentMapper.selectList(
                new LambdaQueryWrapper<Payment>().in(Payment::getOrderId, orderIds)
        );
        Map<Long, List<Payment>> paymentMap = payments.stream().collect(Collectors.groupingBy(Payment::getOrderId));

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
            User user = order.getUserId() == null ? null : userMap.get(order.getUserId());
            AdminDtos.OrderUserView userView = user == null
                    ? null
                    : new AdminDtos.OrderUserView(
                    String.valueOf(user.getId()),
                    user.getUsername(),
                    user.getPhone()
            );
            List<AdminDtos.PaymentView> paymentViews = paymentMap.getOrDefault(order.getId(), List.of())
                    .stream()
                    .sorted(Comparator.comparing(Payment::getCreateTime, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                    .map(this::toPaymentView)
                    .toList();
            LocalDateTime createdAt = order.getOrderTime() != null ? order.getOrderTime() : order.getCreateTime();

            return new AdminDtos.OrderView(
                    String.valueOf(order.getId()),
                    order.getOrderNo(),
                    STORE_ID,
                    order.getTableId() == null ? "" : String.valueOf(order.getTableId()),
                    tableName,
                    mapDbStatusToApi(order.getStatus()),
                    itemViews,
                    new AdminDtos.MoneyView(CURRENCY_CNY, toFen(order.getTotalAmount())),
                    userView,
                    paymentViews,
                    order.getRemark(),
                    toIso(createdAt),
                    toIso(order.getCompleteTime()),
                    toIso(order.getUpdateTime())
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
                dish.getSoldOut() != null && dish.getSoldOut() == 1,
                dish.getDescription(),
                dish.getImage(),
                dish.getSortOrder() == null ? 0 : dish.getSortOrder()
        );
    }

    private AdminDtos.PaymentView toPaymentView(Payment payment) {
        return new AdminDtos.PaymentView(
                String.valueOf(payment.getId()),
                payment.getPaymentNo(),
                DB_TO_PAYMENT_METHOD.getOrDefault(payment.getPaymentMethod(), "UNKNOWN"),
                DB_TO_PAYMENT_STATUS.getOrDefault(payment.getStatus(), "PENDING"),
                new AdminDtos.MoneyView(CURRENCY_CNY, toFen(payment.getAmount())),
                payment.getTransactionId(),
                toIso(payment.getPaymentTime()),
                toIso(payment.getCreateTime())
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

    private void validateAdminAccountRequest(AdminDtos.AdminAccountUpsertRequest request, boolean creating) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (creating && !StringUtils.hasText(request.username())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "管理员账号不能为空");
        }
        if (creating && (!StringUtils.hasText(request.password()) || request.password().trim().length() < 6)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "密码至少 6 位");
        }
        if (creating && !StringUtils.hasText(request.displayName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "显示名称不能为空");
        }
        if (creating && !StringUtils.hasText(request.roleName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "角色不能为空");
        }
        if (StringUtils.hasText(request.roleName())) {
            ensureRoleExists(request.roleName());
        }
    }

    private void ensureRoleExists(String roleName) {
        if (!adminAuthorizationService.getRoleNames().contains(roleName.trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法角色: " + roleName);
        }
    }

    private int parseEnabledStatus(String status, Boolean enabled) {
        if (enabled != null) {
            return Boolean.TRUE.equals(enabled) ? 1 : 0;
        }
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "状态不能为空");
        }
        String normalized = status.trim().toUpperCase();
        return switch (normalized) {
            case "1", "TRUE", "ACTIVE", "ENABLED" -> 1;
            case "0", "FALSE", "INACTIVE", "DISABLED" -> 0;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法状态: " + status);
        };
    }

    private Integer parseEnabledStatusOrNull(String status) {
        if (!StringUtils.hasText(status)) {
            return null;
        }
        return parseEnabledStatus(status, null);
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

    private Long parseLongOrNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private LocalDate parseDateOrDefault(String value, LocalDate defaultValue) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            return defaultValue;
        }
        try {
            return LocalDate.parse(trimmed);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "日期格式应为 yyyy-MM-dd");
        }
    }

    private LocalDateTime parseDateStartOrNull(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : parseDateOrDefault(trimmed, null).atStartOfDay();
    }

    private LocalDateTime parseDateEndOrNull(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? null : parseDateOrDefault(trimmed, null).plusDays(1).atStartOfDay().minusNanos(1);
    }

    private List<Order> listOrdersInRange(String from, String to) {
        LambdaQueryWrapper<Order> query = new LambdaQueryWrapper<Order>().orderByAsc(Order::getOrderTime);
        LocalDateTime fromTime = parseDateStartOrNull(from);
        if (fromTime != null) {
            query.ge(Order::getOrderTime, fromTime);
        }
        LocalDateTime toTime = parseDateEndOrNull(to);
        if (toTime != null) {
            query.le(Order::getOrderTime, toTime);
        }
        return orderMapper.selectList(query);
    }

    private void upsertSetting(String key, String value, String description) {
        SystemSetting setting = systemSettingMapper.selectOne(
                new LambdaQueryWrapper<SystemSetting>()
                        .eq(SystemSetting::getSettingKey, key)
                        .last("LIMIT 1")
        );
        LocalDateTime now = LocalDateTime.now();
        if (setting == null) {
            setting = new SystemSetting();
            setting.setSettingKey(key);
            setting.setSettingValue(value);
            setting.setDescription(description);
            setting.setCreateTime(now);
            setting.setUpdateTime(now);
            systemSettingMapper.insert(setting);
            return;
        }
        setting.setSettingValue(value);
        setting.setDescription(description);
        setting.setUpdateTime(now);
        systemSettingMapper.updateById(setting);
    }

    private void validateTimeText(String value, String fieldName) {
        String trimmed = trimToNull(value);
        if (trimmed == null || !trimmed.matches("^\\d{2}:\\d{2}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + "格式应为 HH:mm");
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
                account.getRoleName(),
                adminAuthorizationService.getPermissionNames(account.getRoleName())
        );
    }

    private AdminDtos.AdminAccountView toAdminAccountView(AdminUserAccount account) {
        return new AdminDtos.AdminAccountView(
                String.valueOf(account.getId()),
                account.getUsername(),
                account.getDisplayName(),
                account.getRoleName(),
                adminAuthorizationService.getPermissionNames(account.getRoleName()),
                account.getStatus() != null && account.getStatus() == 1 ? "ACTIVE" : "INACTIVE",
                toIso(account.getCreateTime()),
                toIso(account.getUpdateTime())
        );
    }

    private AdminDtos.AuditLogView toAuditLogView(AdminOperationLog log) {
        return new AdminDtos.AuditLogView(
                String.valueOf(log.getId()),
                log.getAdminId() == null ? null : String.valueOf(log.getAdminId()),
                log.getAdminName(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getRequestPath(),
                log.getResult(),
                log.getMessage(),
                toIso(log.getCreateTime())
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

    public AdminDtos.PageResult<AdminDtos.TableView> listTablesPaged(
            int page,
            int pageSize,
            String keyword,
            String status,
            String area
    ) {
        int resolvedPage = Math.max(1, page);
        int resolvedPageSize = pageSize <= 0 ? 20 : Math.min(200, pageSize);

        LambdaQueryWrapper<Table> query = new LambdaQueryWrapper<Table>()
                .orderByDesc(Table::getCreateTime);

        String trimmedStatus = trimToNull(status);
        if (trimmedStatus != null) {
            String normalized = trimmedStatus.trim().toUpperCase();
            Integer statusCode = TABLE_STATUS_TO_DB.get(normalized);
            if (statusCode != null) {
                query.eq(Table::getStatus, statusCode);
            }
        }

        String trimmedArea = trimToNull(area);
        if (trimmedArea != null) {
            query.like(Table::getArea, trimmedArea);
        }

        String q = trimToNull(keyword);
        if (q != null) {
            Long idKeyword = parseLongOrNull(q);
            query.and(w -> {
                w.like(Table::getTableNo, q);
                if (idKeyword != null) {
                    w.or().eq(Table::getId, idKeyword);
                }
            });
        }

        Page<Table> pageReq = new Page<>(resolvedPage, resolvedPageSize);
        Page<Table> pageRes = tableMapper.selectPage(pageReq, query);
        List<AdminDtos.TableView> list = pageRes.getRecords().stream()
                .map(this::toTableView)
                .toList();
        return new AdminDtos.PageResult<>(list, pageRes.getTotal(), resolvedPage, resolvedPageSize);
    }

    public AdminDtos.TableView getTableDetail(String tableId) {
        Long id = parseLongId(tableId, "tableId");
        Table table = tableMapper.selectById(id);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌码不存在");
        }
        return toTableView(table);
    }

    public AdminDtos.TableView createTable(AdminDtos.TableUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }
        if (!StringUtils.hasText(request.tableNo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "桌台编号不能为空");
        }
        if (request.capacity() == null || request.capacity() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "容纳人数必须大于0");
        }

        String tableNo = request.tableNo().trim();
        Long existingCount = tableMapper.selectCount(
                new LambdaQueryWrapper<Table>().eq(Table::getTableNo, tableNo)
        );
        if (existingCount != null && existingCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "桌台编号已存在");
        }

        Table table = new Table();
        table.setTableNo(tableNo);
        table.setCapacity(request.capacity());
        table.setStatus(0);
        table.setLocation(trimToNull(request.location()));
        table.setArea(trimToNull(request.area()));
        table.setCreateTime(LocalDateTime.now());
        table.setUpdateTime(LocalDateTime.now());
        tableMapper.insert(table);
        return toTableView(table);
    }

    public AdminDtos.TableView updateTable(String tableId, AdminDtos.TableUpsertRequest request) {
        Long id = parseLongId(tableId, "tableId");
        Table table = tableMapper.selectById(id);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌码不存在");
        }
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请求体不能为空");
        }

        if (request.tableNo() != null) {
            String tableNo = request.tableNo().trim();
            if (tableNo.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "桌台编号不能为空");
            }
            if (!tableNo.equals(table.getTableNo())) {
                Long existingCount = tableMapper.selectCount(
                        new LambdaQueryWrapper<Table>().eq(Table::getTableNo, tableNo)
                );
                if (existingCount != null && existingCount > 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "桌台编号已存在");
                }
                table.setTableNo(tableNo);
            }
        }

        if (request.capacity() != null) {
            if (request.capacity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "容纳人数必须大于0");
            }
            table.setCapacity(request.capacity());
        }

        if (request.location() != null) {
            table.setLocation(trimToNull(request.location()));
        }
        if (request.area() != null) {
            table.setArea(trimToNull(request.area()));
        }

        table.setUpdateTime(LocalDateTime.now());
        tableMapper.updateById(table);
        return toTableView(table);
    }

    public AdminDtos.QrPayloadView getTableQrPayload(String tableId) {
        Long id = parseLongId(tableId, "tableId");
        Table table = tableMapper.selectById(id);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌码不存在");
        }
        String payload = "storeId=" + getSystemSettings().storeId() + "&tableId=" + table.getId();
        return new AdminDtos.QrPayloadView(String.valueOf(table.getId()), table.getTableNo(), payload);
    }

    public void deleteTable(String tableId) {
        Long id = parseLongId(tableId, "tableId");
        Table table = tableMapper.selectById(id);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌码不存在");
        }

        Long orderCount = orderMapper.selectCount(
                new LambdaQueryWrapper<Order>().eq(Order::getTableId, id)
        );
        if (orderCount != null && orderCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "该桌台存在关联订单，无法删除");
        }

        tableMapper.deleteById(id);
    }

    public AdminDtos.TableView updateTableStatus(String tableId, AdminDtos.TableStatusUpdateRequest request) {
        Long id = parseLongId(tableId, "tableId");
        Table table = tableMapper.selectById(id);
        if (table == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "桌码不存在");
        }

        String status = parseTableStatus(request == null ? null : request.status());
        Integer statusCode = TABLE_STATUS_TO_DB.get(status);
        table.setStatus(statusCode);
        table.setUpdateTime(LocalDateTime.now());
        tableMapper.updateById(table);
        return toTableView(table);
    }

    private AdminDtos.TableView toTableView(Table table) {
        String statusStr = DB_TO_TABLE_STATUS.getOrDefault(
                table.getStatus() == null ? 0 : table.getStatus(), "IDLE"
        );
        return new AdminDtos.TableView(
                String.valueOf(table.getId()),
                table.getTableNo(),
                table.getCapacity() == null ? 0 : table.getCapacity(),
                statusStr,
                table.getLocation(),
                table.getArea(),
                toIso(table.getCreateTime()),
                toIso(table.getUpdateTime())
        );
    }

    private String parseTableStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "状态不能为空");
        }
        String normalized = status.trim().toUpperCase();
        if (!TABLE_STATUS_SET.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "非法桌码状态: " + status);
        }
        return normalized;
    }
}
