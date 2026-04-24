package com.foodordering.dto.client;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @Schema(description = "微信登录请求")
    public record WechatLoginRequest(
            @Schema(description = "wx.login 返回的临时 code") String code,
            @Schema(description = "用户昵称") String nickname,
            @Schema(description = "用户头像") String avatar
    ) {
    }

    @Schema(description = "用户端登录响应")
    public record WechatLoginResponse(
            @Schema(description = "用户端 JWT") String token,
            @Schema(description = "用户信息") ClientUserView user
    ) {
    }

    @Schema(description = "用户端用户视图")
    public record ClientUserView(
            @Schema(description = "用户ID") String id,
            @Schema(description = "昵称") String nickname,
            @Schema(description = "头像") String avatar,
            @Schema(description = "微信 OpenID") String openid
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

    @Schema(description = "公告视图")
    public record NoticeView(
            @Schema(description = "公告ID") String id,
            @Schema(description = "公告标题") String title,
            @Schema(description = "公告内容") String content,
            @Schema(description = "发布时间") String createdAt
    ) {
    }

    @Schema(description = "评价视图")
    public record CommentView(
            @Schema(description = "评价ID") String id,
            @Schema(description = "订单ID") String orderId,
            @Schema(description = "用户名称") String userName,
            @Schema(description = "评价内容") String content,
            @Schema(description = "评分") int rating,
            @Schema(description = "创建时间") String createdAt
    ) {
    }

    @Schema(description = "提交评价请求")
    public record CreateCommentRequest(
            @Schema(description = "订单ID") String orderId,
            @Schema(description = "评分（1-5）") Integer rating,
            @Schema(description = "评价内容") String content
    ) {
    }

    @Schema(description = "创建订单项请求")
    public record CreateOrderItemRequest(
            @Schema(description = "菜品ID") String dishId,
            @Schema(description = "购买数量") Integer qty,
            @Schema(description = "规格名称快照") String skuName
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
            @Schema(description = "规格名称") String skuName,
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
            @JsonProperty("package")
            @Schema(description = "预支付包名，供 wx.requestPayment 使用") String payPackage,
            @Schema(description = "预支付包名，兼容旧小程序字段") String prepayPackage,
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

    @Schema(description = "创建客服工单请求")
    public record CreateSupportTicketRequest(
            @Schema(description = "问题主题") String topic,
            @Schema(description = "首条消息内容") String content
    ) {
    }

    @Schema(description = "客服工单视图")
    public record SupportTicketView(
            @Schema(description = "工单ID") String id,
            @Schema(description = "昵称") String nickname,
            @Schema(description = "问题主题") String topic,
            @Schema(description = "最后消息时间") String lastMessageAt,
            @Schema(description = "状态：OPEN/CLOSED") String status
    ) {
    }

    @Schema(description = "客服工单详情")
    public record SupportTicketDetailView(
            @Schema(description = "工单ID") String id,
            @Schema(description = "昵称") String nickname,
            @Schema(description = "问题主题") String topic,
            @Schema(description = "最后消息时间") String lastMessageAt,
            @Schema(description = "状态：OPEN/CLOSED") String status,
            @Schema(description = "创建时间") String createdAt,
            @Schema(description = "更新时间") String updatedAt
    ) {
    }

    @Schema(description = "客服消息视图")
    public record SupportTicketMessageView(
            @Schema(description = "消息ID") String id,
            @Schema(description = "工单ID") String ticketId,
            @Schema(description = "发送者类型：USER/ADMIN") String senderType,
            @Schema(description = "发送者ID") String senderId,
            @Schema(description = "发送者名称") String senderName,
            @Schema(description = "消息内容") String content,
            @Schema(description = "是否已读") boolean isRead,
            @Schema(description = "创建时间") String createdAt
    ) {
    }

    @Schema(description = "发送客服消息请求")
    public record SendSupportMessageRequest(
            @Schema(description = "消息内容") String content
    ) {
    }

    @Schema(description = "分页结果")
    public record PageResult<T>(
            List<T> list,
            long total,
            int page,
            int pageSize
    ) {
    }
}
