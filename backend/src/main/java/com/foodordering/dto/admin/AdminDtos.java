package com.foodordering.dto.admin;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "管理端数据传输对象集合")
public final class AdminDtos {

    private AdminDtos() {
    }

    @Schema(description = "管理员登录请求")
    public record LoginRequest(
            @Schema(description = "用户名", example = "admin") String username,
            @Schema(description = "密码", example = "123456") String password
    ) {
    }

    @Schema(description = "更新订单状态请求")
    public record UpdateOrderStatusRequest(
            @Schema(description = "目标状态", example = "PAID") String status
    ) {
    }

    @Schema(description = "公告创建/更新请求")
    public record NoticeUpsertRequest(
            @Schema(description = "公告标题") String title,
            @Schema(description = "公告内容") String content,
            @Schema(description = "是否置顶") Boolean isPinned
    ) {
    }

    @Schema(description = "菜品分类创建/更新请求")
    public record CategoryUpsertRequest(
            @Schema(description = "分类名称") String name,
            @Schema(description = "排序权重") Integer sort,
            @Schema(description = "是否启用") Boolean enabled
    ) {
    }

    @Schema(description = "菜品创建/更新请求")
    public record DishUpsertRequest(
            @Schema(description = "所属分类ID") String categoryId,
            @Schema(description = "菜品名称") String name,
            @Schema(description = "价格（分）") Integer priceFen,
            @Schema(description = "是否上架") Boolean onSale,
            @Schema(description = "是否售罄") Boolean soldOut,
            @Schema(description = "菜品描述") String description,
            @Schema(description = "图片地址") String image,
            @Schema(description = "排序权重") Integer sort
    ) {
    }

    @Schema(description = "用户状态更新请求")
    public record UserStatusUpdateRequest(
            @Schema(description = "状态", example = "NORMAL") String status,
            @Schema(description = "是否启用账户") Boolean enabled
    ) {
    }

    @Schema(description = "反馈状态更新请求")
    public record FeedbackStatusUpdateRequest(
            @Schema(description = "状态", example = "RESOLVED") String status
    ) {
    }

    @Schema(description = "工单状态更新请求")
    public record SupportTicketStatusUpdateRequest(
            @Schema(description = "状态", example = "CLOSED") String status
    ) {
    }

    @Schema(description = "管理员登录响应")
    public record LoginResponse(
            @Schema(description = "JWT Token") String token,
            @Schema(description = "管理员详情") AdminUserView user
    ) {
    }

    @Schema(description = "管理员详情视图")
    public record AdminUserView(
            @Schema(description = "管理员ID") String id,
            @Schema(description = "用户名") String username,
            @Schema(description = "显示名称") String displayName,
            @Schema(description = "角色名称") String roleName
    ) {
    }

    @Schema(description = "公告视图")
    public record NoticeView(
            @Schema(description = "公告ID") String id,
            @Schema(description = "标题") String title,
            @Schema(description = "内容") String content,
            @Schema(description = "创建时间") String createdAt,
            @Schema(description = "是否置顶") boolean isPinned
    ) {
    }

    @Schema(description = "移动端用户概览视图")
    public record AppUserView(
            @Schema(description = "用户ID") String id,
            @Schema(description = "昵称") String nickname,
            @Schema(description = "手机号") String phone,
            @Schema(description = "注册时间") String createdAt,
            @Schema(description = "最后活跃时间") String lastActiveAt,
            @Schema(description = "历史订单数") int orderCount,
            @Schema(description = "账户状态") String status
    ) {
    }

    @Schema(description = "移动端用户详细视图")
    public record AppUserDetailView(
            @Schema(description = "用户ID") String id,
            @Schema(description = "昵称") String nickname,
            @Schema(description = "手机号") String phone,
            @Schema(description = "电子邮箱") String email,
            @Schema(description = "头像地址") String avatar,
            @Schema(description = "注册时间") String createdAt,
            @Schema(description = "最后活跃时间") String lastActiveAt,
            @Schema(description = "历史订单数") int orderCount,
            @Schema(description = "账户状态") String status
    ) {
    }

    @Schema(description = "通用分页结果")
    public record PageResult<T>(
            @Schema(description = "当前页数据列表") List<T> list,
            @Schema(description = "总记录数") long total,
            @Schema(description = "当前页码") int page,
            @Schema(description = "每页大小") int pageSize
    ) {
    }

    @Schema(description = "用户状态视图")
    public record UserStatusView(
            @Schema(description = "用户ID") String id,
            @Schema(description = "状态") String status
    ) {
    }

    @Schema(description = "菜品分类视图")
    public record CategoryView(
            @Schema(description = "分类ID") String id,
            @Schema(description = "分类名称") String name,
            @Schema(description = "排序权重") int sort
    ) {
    }

    @Schema(description = "菜品视图")
    public record DishView(
            @Schema(description = "菜品ID") String id,
            @Schema(description = "所属分类ID") String categoryId,
            @Schema(description = "菜品名称") String name,
            @Schema(description = "价格（分）") int priceFen,
            @Schema(description = "是否上架") boolean onSale,
            @Schema(description = "是否售罄") boolean soldOut
    ) {
    }

    @Schema(description = "菜单数据视图")
    public record MenuView(
            @Schema(description = "分类列表") List<CategoryView> categories,
            @Schema(description = "菜品列表") List<DishView> dishes
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
            @Schema(description = "规格ID") String skuId,
            @Schema(description = "规格名称") String skuName,
            @Schema(description = "单价") MoneyView unitPrice,
            @Schema(description = "数量") int qty
    ) {
    }

    @Schema(description = "订单详情视图")
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

    @Schema(description = "菜品销量统计视图")
    public record DishSalesView(
            @Schema(description = "菜品ID") String dishId,
            @Schema(description = "菜品名称") String dishName,
            @Schema(description = "累计销量") long soldQty
    ) {
    }

    @Schema(description = "评论视图")
    public record CommentView(
            @Schema(description = "评论ID") String id,
            @Schema(description = "关联订单ID") String orderId,
            @Schema(description = "菜品名称") String dishName,
            @Schema(description = "用户昵称") String nickname,
            @Schema(description = "评分（1-5）") int rating,
            @Schema(description = "评价内容") String content,
            @Schema(description = "评价时间") String createdAt
    ) {
    }

    @Schema(description = "反馈视图")
    public record FeedbackView(
            @Schema(description = "反馈ID") String id,
            @Schema(description = "用户昵称") String nickname,
            @Schema(description = "反馈内容") String content,
            @Schema(description = "提交时间") String createdAt,
            @Schema(description = "处理状态") String status
    ) {
    }

    @Schema(description = "工单概览视图")
    public record SupportTicketView(
            @Schema(description = "工单ID") String id,
            @Schema(description = "用户昵称") String nickname,
            @Schema(description = "咨询主题") String topic,
            @Schema(description = "最后消息时间") String lastMessageAt,
            @Schema(description = "工单状态") String status
    ) {
    }

    @Schema(description = "工单详细视图")
    public record SupportTicketDetailView(
            @Schema(description = "工单ID") String id,
            @Schema(description = "用户昵称") String nickname,
            @Schema(description = "咨询主题") String topic,
            @Schema(description = "最后消息时间") String lastMessageAt,
            @Schema(description = "工单状态") String status,
            @Schema(description = "创建时间") String createdAt,
            @Schema(description = "更新时间") String updatedAt
    ) {
    }
}
