package com.foodordering.dto.client;

import java.util.List;

public final class ClientDtos {

    private ClientDtos() {
    }

    public record BindTableRequest(String storeId, String tableId) {
    }

    public record BindTableResponse(String storeId, String storeName, String tableId, String tableName) {
    }

    public record DishView(
            String id,
            String categoryId,
            String name,
            int priceFen,
            boolean onSale,
            boolean soldOut,
            String image,
            String description
    ) {
    }

    public record CategoryView(String id, String name, int sort, List<DishView> dishes) {
    }

    public record MenuView(String storeId, String storeName, List<CategoryView> categories) {
    }

    public record CreateOrderItemRequest(String dishId, Integer qty) {
    }

    public record CreateOrderRequest(String storeId, String tableId, List<CreateOrderItemRequest> items, String remark) {
    }

    public record MoneyView(String currency, int amountFen) {
    }

    public record OrderItemView(String dishId, String dishName, MoneyView unitPrice, int qty) {
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

    public record PrepayRequest(String orderId) {
    }

    public record PrepayResponse(
            String timeStamp,
            String nonceStr,
            String prepayPackage,
            String signType,
            String paySign
    ) {
    }

    public record UrgeOrderResponse(
            String orderId,
            String status,
            String message,
            String urgedAt
    ) {
    }
}
