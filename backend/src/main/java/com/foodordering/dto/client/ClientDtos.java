package com.foodordering.dto.client;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "用户端数据传输对象集合")
public final class ClientDtos {

    private ClientDtos() {
    }

    @Schema(description = "绑定桌号请求")
    public record BindTableRequest(
            @Schema(description = "门店ID") String storeId,
            @Schema(description = "桌号ID") String tableId
    ) {
    }

    @Schema(description = "绑定桌号响应")
    public record BindTableResponse(
            @Schema(description = "门店ID") String storeId,
            @Schema(description = "门店名称") String storeName,
            @Schema(description = "桌号ID") String tableId,
            @Schema(description = "桌号名称") String tableName
    ) {
    }

    @Schema(description = "菜品视图")
    public record DishView(
            @Schema(description = "菜品ID") String id,
            @Schema(description = "所属分类ID") String categoryId,
            @Schema(description = "菜品名称") String name,
            @Schema(description = "价格（分）") int priceFen,
            @Schema(description = "是否上架") boolean onSale,
            @Schema(description = "是否售罄") boolean soldOut,
            @Schema(description = "图片地址") String image,
            @Schema(description = "菜品描述") String description
    ) {
    }

    @Schema(description = "分类视图（含菜品）")
    public record CategoryView(
            @Schema(description = "分类ID") String id,
            @Schema(description = "分类名称") String name,
            @Schema(description = "排序权重") int sort,
            @Schema(description = "分类下菜品列表") List<DishView> dishes
    ) {
    }

    @Schema(description = "菜单数据视图")
    public record MenuView(
            @Schema(description = "门店ID") String storeId,
            @Schema(description = "门店名称") String storeName,
            @Schema(description = "全部分类及菜品") List<CategoryView> categories
    ) {
    }

    @Schema(description = "创建订单项请求")
    public record CreateOrderItemRequest(
            @Schema(description = "菜品ID") String dishId,
            @Schema(description = "购买数量") Integer qty
    ) {
    }

    @Schema(description = "下单请求")
    public record CreateOrderRequest(
            @Schema(description = "门店ID") String storeId,
            @Schema(description = "桌号ID") String tableId,
            @Schema(description = "商品明细列表") List<CreateOrderItemRequest> items,
            @Schema(description = "用户备注") String remark
    ) {
    }

    @Schema(description = "货币金额视图")
    public record MoneyView(
            @Schema(description = "币种", example = "CNY") String currency,
            @Schema(description = "金额（分）") int amountFen
    ) {
    }

    @Schema(description = "订单项视图")
    public record OrderItemView(
            @Schema(description = "菜品ID") String dishId,
            @Schema(description = "菜品名称") String dishName,
            @Schema(description = "单价") MoneyView unitPrice,
            @Schema(description = "数量") int qty
    ) {
    }

    @Schema(description = "订单视图")
    public record OrderView(
            @Schema(description = "订单ID") String id,
            @Schema(description = "门店ID") String storeId,
            @Schema(description = "桌号ID") String tableId,
            @Schema(description = "桌号名称") String tableName,
            @Schema(description = "订单状态") String status,
            @Schema(description = "商品明细列表") List<OrderItemView> items,
            @Schema(description = "订单总额") MoneyView totalPrice,
            @Schema(description = "用户备注") String remark,
            @Schema(description = "创建时间") String createdAt
    ) {
    }

    @Schema(description = "预支付请求")
    public record PrepayRequest(
            @Schema(description = "订单ID") String orderId
    ) {
    }

    @Schema(description = "微信支付参数响应")
    public record PrepayResponse(
            @Schema(description = "时间戳") String timeStamp,
            @Schema(description = "随机字符串") String nonceStr,
            @Schema(description = "预支付包名") String prepayPackage,
            @Schema(description = "签名类型") String signType,
            @Schema(description = "支付签名") String paySign
    ) {
    }

    @Schema(description = "催单响应")
    public record UrgeOrderResponse(
            @Schema(description = "订单ID") String orderId,
            @Schema(description = "当前状态") String status,
            @Schema(description = "提示消息") String message,
            @Schema(description = "催单时间") String urgedAt
    ) {
    }
}
