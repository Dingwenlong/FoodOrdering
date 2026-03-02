package com.foodordering.controller.admin;

import com.foodordering.auth.AdminAuthInterceptor;
import com.foodordering.dto.admin.AdminDtos;
import com.foodordering.entity.AdminUserAccount;
import com.foodordering.service.admin.AdminService;
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

@RestController
@RequestMapping("/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/auth/login")
    public AdminDtos.LoginResponse login(@RequestBody AdminDtos.LoginRequest request) {
        return adminService.login(request);
    }

    @GetMapping("/profile")
    public AdminDtos.AdminUserView profile(HttpServletRequest request) {
        AdminUserAccount currentAdmin = AdminAuthInterceptor.requireCurrentAdmin(request);
        return adminService.getProfile(currentAdmin);
    }

    @GetMapping("/notices")
    public List<AdminDtos.NoticeView> notices() {
        return adminService.listNotices();
    }

    @PostMapping("/notices")
    public AdminDtos.NoticeView createNotice(@RequestBody AdminDtos.NoticeUpsertRequest request) {
        return adminService.createNotice(request);
    }

    @PutMapping("/notices/{noticeId}")
    public AdminDtos.NoticeView updateNotice(
            @PathVariable("noticeId") String noticeId,
            @RequestBody AdminDtos.NoticeUpsertRequest request
    ) {
        return adminService.updateNotice(noticeId, request);
    }

    @DeleteMapping("/notices/{noticeId}")
    public void deleteNotice(@PathVariable("noticeId") String noticeId) {
        adminService.deleteNotice(noticeId);
    }

    @GetMapping("/users")
    public List<AdminDtos.AppUserView> users() {
        return adminService.listUsers();
    }

    @PatchMapping("/users/{userId}/status")
    public AdminDtos.UserStatusView updateUserStatus(
            @PathVariable("userId") String userId,
            @RequestBody AdminDtos.UserStatusUpdateRequest request
    ) {
        return adminService.updateUserStatus(userId, request);
    }

    @GetMapping("/menu")
    public AdminDtos.MenuView menu() {
        return adminService.listMenu();
    }

    @PostMapping("/categories")
    public AdminDtos.CategoryView createCategory(@RequestBody AdminDtos.CategoryUpsertRequest request) {
        return adminService.createCategory(request);
    }

    @PutMapping("/categories/{categoryId}")
    public AdminDtos.CategoryView updateCategory(
            @PathVariable("categoryId") String categoryId,
            @RequestBody AdminDtos.CategoryUpsertRequest request
    ) {
        return adminService.updateCategory(categoryId, request);
    }

    @DeleteMapping("/categories/{categoryId}")
    public void deleteCategory(@PathVariable("categoryId") String categoryId) {
        adminService.deleteCategory(categoryId);
    }

    @PostMapping("/dishes")
    public AdminDtos.DishView createDish(@RequestBody AdminDtos.DishUpsertRequest request) {
        return adminService.createDish(request);
    }

    @PutMapping("/dishes/{dishId}")
    public AdminDtos.DishView updateDish(
            @PathVariable("dishId") String dishId,
            @RequestBody AdminDtos.DishUpsertRequest request
    ) {
        return adminService.updateDish(dishId, request);
    }

    @DeleteMapping("/dishes/{dishId}")
    public void deleteDish(@PathVariable("dishId") String dishId) {
        adminService.deleteDish(dishId);
    }

    @GetMapping("/orders")
    public List<AdminDtos.OrderView> orders(@RequestParam(value = "status", required = false) String status) {
        return adminService.listOrders(status);
    }

    @PostMapping("/orders/{orderId}/status")
    public AdminDtos.OrderView updateOrderStatus(
            @PathVariable("orderId") String orderId,
            @RequestBody AdminDtos.UpdateOrderStatusRequest request
    ) {
        return adminService.updateOrderStatus(orderId, request);
    }

    @GetMapping("/stats/dish-sales")
    public List<AdminDtos.DishSalesView> dishSales() {
        return adminService.getDishSales();
    }

    @GetMapping("/comments")
    public List<AdminDtos.CommentView> comments() {
        return adminService.listComments();
    }

    @GetMapping("/feedbacks")
    public List<AdminDtos.FeedbackView> feedbacks() {
        return adminService.listFeedbacks();
    }

    @PatchMapping("/feedbacks/{feedbackId}/status")
    public AdminDtos.FeedbackView updateFeedbackStatus(
            @PathVariable("feedbackId") String feedbackId,
            @RequestBody AdminDtos.FeedbackStatusUpdateRequest request
    ) {
        return adminService.updateFeedbackStatus(feedbackId, request);
    }

    @GetMapping("/support/tickets")
    public List<AdminDtos.SupportTicketView> supportTickets() {
        return adminService.listSupportTickets();
    }

    @PatchMapping("/support/tickets/{ticketId}/status")
    public AdminDtos.SupportTicketView updateSupportTicketStatus(
            @PathVariable("ticketId") String ticketId,
            @RequestBody AdminDtos.SupportTicketStatusUpdateRequest request
    ) {
        return adminService.updateSupportTicketStatus(ticketId, request);
    }
}
