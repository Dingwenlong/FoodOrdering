package com.foodordering.controller.admin;

import com.foodordering.auth.AdminAuthInterceptor;
import com.foodordering.auth.AdminAuthorize;
import com.foodordering.auth.AdminPermission;
import com.foodordering.dto.admin.AdminDtos;
import com.foodordering.entity.AdminUserAccount;
import com.foodordering.service.admin.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

@Tag(name = "管理端接口", description = "提供管理后台所需的各类管理功能")
@RestController
@RequestMapping("/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @Operation(summary = "管理员登录", description = "使用用户名和密码换取 JWT Token")
    @PostMapping("/auth/login")
    public AdminDtos.LoginResponse login(@RequestBody AdminDtos.LoginRequest request) {
        return adminService.login(request);
    }

    @Operation(summary = "获取当前管理员信息", description = "根据 Token 获取当前登录的管理员详情")
    @GetMapping("/profile")
    public AdminDtos.AdminUserView profile(HttpServletRequest request) {
        AdminUserAccount currentAdmin = AdminAuthInterceptor.requireCurrentAdmin(request);
        return adminService.getProfile(currentAdmin);
    }

    @Operation(summary = "获取系统公告列表")
    @GetMapping("/notices")
    public List<AdminDtos.NoticeView> notices() {
        return adminService.listNotices();
    }

    @Operation(summary = "创建系统公告")
    @PostMapping("/notices")
    @AdminAuthorize(AdminPermission.NOTICE_MANAGE)
    public AdminDtos.NoticeView createNotice(@RequestBody AdminDtos.NoticeUpsertRequest request) {
        return adminService.createNotice(request);
    }

    @Operation(summary = "更新系统公告")
    @PutMapping("/notices/{noticeId}")
    @AdminAuthorize(AdminPermission.NOTICE_MANAGE)
    public AdminDtos.NoticeView updateNotice(
            @Parameter(description = "公告ID") @PathVariable("noticeId") String noticeId,
            @RequestBody AdminDtos.NoticeUpsertRequest request) {
        return adminService.updateNotice(noticeId, request);
    }

    @Operation(summary = "删除系统公告")
    @DeleteMapping("/notices/{noticeId}")
    @AdminAuthorize(AdminPermission.NOTICE_MANAGE)
    public void deleteNotice(@Parameter(description = "公告ID") @PathVariable("noticeId") String noticeId) {
        adminService.deleteNotice(noticeId);
    }

    @Operation(summary = "查询用户列表", description = "支持分页、关键词搜索和状态过滤")
    @GetMapping("/users")
    public Object users(
            @Parameter(description = "页码") @RequestParam(value = "page", required = false) Integer page,
            @Parameter(description = "每页数量") @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "关键词") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "状态") @RequestParam(value = "status", required = false) String status) {
        boolean usePaged = page != null
                || pageSize != null
                || StringUtils.hasText(keyword)
                || StringUtils.hasText(status);
        if (!usePaged) {
            return adminService.listUsers();
        }
        int resolvedPage = page == null ? 1 : page;
        int resolvedPageSize = pageSize == null ? 20 : pageSize;
        return adminService.listUsersPaged(resolvedPage, resolvedPageSize, keyword, status);
    }

    @Operation(summary = "获取用户详情")
    @GetMapping("/users/{userId}")
    public AdminDtos.AppUserDetailView userDetail(
            @Parameter(description = "用户ID") @PathVariable("userId") String userId) {
        return adminService.getUserDetail(userId);
    }

    @Operation(summary = "修改用户状态")
    @PatchMapping("/users/{userId}/status")
    @AdminAuthorize(AdminPermission.USER_STATUS_UPDATE)
    public AdminDtos.UserStatusView updateUserStatus(
            @Parameter(description = "用户ID") @PathVariable("userId") String userId,
            @RequestBody AdminDtos.UserStatusUpdateRequest request) {
        return adminService.updateUserStatus(userId, request);
    }

    @Operation(summary = "获取菜单数据", description = "包含全量分类和菜品信息")
    @GetMapping("/menu")
    public AdminDtos.MenuView menu() {
        return adminService.listMenu();
    }

    @Operation(summary = "创建菜品分类")
    @PostMapping("/categories")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public AdminDtos.CategoryView createCategory(@RequestBody AdminDtos.CategoryUpsertRequest request) {
        return adminService.createCategory(request);
    }

    @Operation(summary = "更新菜品分类")
    @PutMapping("/categories/{categoryId}")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public AdminDtos.CategoryView updateCategory(
            @Parameter(description = "分类ID") @PathVariable("categoryId") String categoryId,
            @RequestBody AdminDtos.CategoryUpsertRequest request) {
        return adminService.updateCategory(categoryId, request);
    }

    @Operation(summary = "删除菜品分类")
    @DeleteMapping("/categories/{categoryId}")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public void deleteCategory(@Parameter(description = "分类ID") @PathVariable("categoryId") String categoryId) {
        adminService.deleteCategory(categoryId);
    }

    @Operation(summary = "创建菜品")
    @PostMapping("/dishes")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public AdminDtos.DishView createDish(@RequestBody AdminDtos.DishUpsertRequest request) {
        return adminService.createDish(request);
    }

    @Operation(summary = "更新菜品信息")
    @PutMapping("/dishes/{dishId}")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public AdminDtos.DishView updateDish(
            @Parameter(description = "菜品ID") @PathVariable("dishId") String dishId,
            @RequestBody AdminDtos.DishUpsertRequest request) {
        return adminService.updateDish(dishId, request);
    }

    @Operation(summary = "删除菜品")
    @DeleteMapping("/dishes/{dishId}")
    @AdminAuthorize(AdminPermission.MENU_MANAGE)
    public void deleteDish(@Parameter(description = "菜品ID") @PathVariable("dishId") String dishId) {
        adminService.deleteDish(dishId);
    }

    @Operation(summary = "查询订单列表", description = "支持根据状态过滤")
    @GetMapping("/orders")
    public List<AdminDtos.OrderView> orders(
            @Parameter(description = "订单状态") @RequestParam(value = "status", required = false) String status) {
        return adminService.listOrders(status);
    }

    @Operation(summary = "修改订单状态")
    @PostMapping("/orders/{orderId}/status")
    @AdminAuthorize(AdminPermission.ORDER_STATUS_UPDATE)
    public AdminDtos.OrderView updateOrderStatus(
            @Parameter(description = "订单ID") @PathVariable("orderId") String orderId,
            @RequestBody AdminDtos.UpdateOrderStatusRequest request) {
        return adminService.updateOrderStatus(orderId, request);
    }

    @Operation(summary = "获取菜品销量统计")
    @GetMapping("/stats/dish-sales")
    public List<AdminDtos.DishSalesView> dishSales() {
        return adminService.getDishSales();
    }

    @Operation(summary = "获取评价列表")
    @GetMapping("/comments")
    public List<AdminDtos.CommentView> comments() {
        return adminService.listComments();
    }

    @Operation(summary = "获取用户反馈列表")
    @GetMapping("/feedbacks")
    public List<AdminDtos.FeedbackView> feedbacks() {
        return adminService.listFeedbacks();
    }

    @Operation(summary = "修改反馈状态")
    @PatchMapping("/feedbacks/{feedbackId}/status")
    @AdminAuthorize(AdminPermission.FEEDBACK_STATUS_UPDATE)
    public AdminDtos.FeedbackView updateFeedbackStatus(
            @Parameter(description = "反馈ID") @PathVariable("feedbackId") String feedbackId,
            @RequestBody AdminDtos.FeedbackStatusUpdateRequest request) {
        return adminService.updateFeedbackStatus(feedbackId, request);
    }

    @Operation(summary = "查询客服工单列表")
    @GetMapping("/support/tickets")
    public Object supportTickets(
            @Parameter(description = "页码") @RequestParam(value = "page", required = false) Integer page,
            @Parameter(description = "每页数量") @RequestParam(value = "pageSize", required = false) Integer pageSize,
            @Parameter(description = "关键词") @RequestParam(value = "keyword", required = false) String keyword,
            @Parameter(description = "状态") @RequestParam(value = "status", required = false) String status) {
        boolean usePaged = page != null
                || pageSize != null
                || StringUtils.hasText(keyword)
                || StringUtils.hasText(status);
        if (!usePaged) {
            return adminService.listSupportTickets();
        }
        int resolvedPage = page == null ? 1 : page;
        int resolvedPageSize = pageSize == null ? 20 : pageSize;
        return adminService.listSupportTicketsPaged(resolvedPage, resolvedPageSize, keyword, status);
    }

    @Operation(summary = "获取工单详情")
    @GetMapping("/support/tickets/{ticketId}")
    public AdminDtos.SupportTicketDetailView supportTicketDetail(
            @Parameter(description = "工单ID") @PathVariable("ticketId") String ticketId) {
        return adminService.getSupportTicketDetail(ticketId);
    }

    @Operation(summary = "修改工单状态")
    @PatchMapping("/support/tickets/{ticketId}/status")
    @AdminAuthorize(AdminPermission.SUPPORT_TICKET_STATUS_UPDATE)
    public AdminDtos.SupportTicketView updateSupportTicketStatus(
            @Parameter(description = "工单ID") @PathVariable("ticketId") String ticketId,
            @RequestBody AdminDtos.SupportTicketStatusUpdateRequest request) {
        return adminService.updateSupportTicketStatus(ticketId, request);
    }
}
