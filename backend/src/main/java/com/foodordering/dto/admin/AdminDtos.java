package com.foodordering.dto.admin;

import java.util.List;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record LoginRequest(String username, String password) {
    }

    public record UpdateOrderStatusRequest(String status) {
    }

    public record NoticeUpsertRequest(String title, String content, Boolean isPinned) {
    }

    public record CategoryUpsertRequest(String name, Integer sort, Boolean enabled) {
    }

    public record DishUpsertRequest(
            String categoryId,
            String name,
            Integer priceFen,
            Boolean onSale,
            Boolean soldOut,
            String description,
            String image,
            Integer sort
    ) {
    }

    public record UserStatusUpdateRequest(String status, Boolean enabled) {
    }

    public record FeedbackStatusUpdateRequest(String status) {
    }

    public record SupportTicketStatusUpdateRequest(String status) {
    }

    public record LoginResponse(String token, AdminUserView user) {
    }

    public record AdminUserView(String id, String username, String displayName, String roleName) {
    }

    public record NoticeView(String id, String title, String content, String createdAt, boolean isPinned) {
    }

    public record AppUserView(
            String id,
            String nickname,
            String phone,
            String createdAt,
            String lastActiveAt,
            int orderCount,
            String status
    ) {
    }

    public record AppUserDetailView(
            String id,
            String nickname,
            String phone,
            String email,
            String avatar,
            String createdAt,
            String lastActiveAt,
            int orderCount,
            String status
    ) {
    }

    public record PageResult<T>(
            List<T> list,
            long total,
            int page,
            int pageSize
    ) {
    }

    public record UserStatusView(String id, String status) {
    }

    public record CategoryView(String id, String name, int sort) {
    }

    public record DishView(
            String id,
            String categoryId,
            String name,
            int priceFen,
            boolean onSale,
            boolean soldOut
    ) {
    }

    public record MenuView(List<CategoryView> categories, List<DishView> dishes) {
    }

    public record MoneyView(String currency, int amountFen) {
    }

    public record OrderItemView(
            String dishId,
            String dishName,
            String skuId,
            String skuName,
            MoneyView unitPrice,
            int qty
    ) {
    }

    public record OrderView(
            String id,
            String storeId,
            String tableId,
            String tableName,
            String status,
            List<OrderItemView> items,
            MoneyView totalPrice,
            String remark,
            String createdAt
    ) {
    }

    public record DishSalesView(String dishId, String dishName, long soldQty) {
    }

    public record CommentView(
            String id,
            String orderId,
            String dishName,
            String nickname,
            int rating,
            String content,
            String createdAt
    ) {
    }

    public record FeedbackView(
            String id,
            String nickname,
            String content,
            String createdAt,
            String status
    ) {
    }

    public record SupportTicketView(
            String id,
            String nickname,
            String topic,
            String lastMessageAt,
            String status
    ) {
    }

    public record SupportTicketDetailView(
            String id,
            String nickname,
            String topic,
            String lastMessageAt,
            String status,
            String createdAt,
            String updatedAt
    ) {
    }
}
