package com.foodordering.controller.client;

import com.foodordering.dto.client.ClientDtos;
import com.foodordering.service.client.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "用户端接口", description = "提供移动端/小程序所需的点餐、支付、订单管理等功能")
@RestController
@RequestMapping("/v1")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @Operation(summary = "绑定桌号", description = "用户扫码后通过桌号信息开启点餐会话")
    @PostMapping("/session/bind-table")
    public ClientDtos.BindTableResponse bindTable(@RequestBody ClientDtos.BindTableRequest request) {
        return clientService.bindTable(request);
    }

    @Operation(summary = "获取菜单", description = "获取当前店铺/桌位的菜品分类及详情")
    @GetMapping("/menu")
    public ClientDtos.MenuView menu(@Parameter(description = "店铺ID") @RequestParam(value = "storeId", required = false) String storeId) {
        return clientService.getMenu(storeId);
    }

    @Operation(summary = "获取公告列表")
    @GetMapping("/notices")
    public List<ClientDtos.NoticeView> notices() {
        return clientService.listNotices();
    }

    @Operation(summary = "获取评价列表")
    @GetMapping("/comments")
    public List<ClientDtos.CommentView> comments() {
        return clientService.listComments();
    }

    @Operation(summary = "提交评价")
    @PostMapping("/comments")
    public ClientDtos.CommentView createComment(@RequestBody ClientDtos.CreateCommentRequest request) {
        return clientService.createComment(request);
    }

    @Operation(summary = "创建订单", description = "提交选中的菜品生成待支付订单")
    @PostMapping("/orders")
    public ClientDtos.OrderView createOrder(@RequestBody ClientDtos.CreateOrderRequest request) {
        return clientService.createOrder(request);
    }

    @Operation(summary = "获取我的订单列表")
    @GetMapping("/orders")
    public List<ClientDtos.OrderView> listOrders() {
        return clientService.listOrders();
    }

    @Operation(summary = "获取订单详情")
    @GetMapping("/orders/{orderId}")
    public ClientDtos.OrderView getOrder(@Parameter(description = "订单ID") @PathVariable("orderId") String orderId) {
        return clientService.getOrder(orderId);
    }

    @Operation(summary = "取消订单")
    @PostMapping("/orders/{orderId}/cancel")
    public ClientDtos.OrderView cancelOrder(@Parameter(description = "订单ID") @PathVariable("orderId") String orderId) {
        return clientService.cancelOrder(orderId);
    }

    @Operation(summary = "微信支付预下单", description = "根据订单号换取微信支付所需的预下单参数")
    @PostMapping("/pay/wechat/prepay")
    public ClientDtos.PrepayResponse prepay(@RequestBody ClientDtos.PrepayRequest request) {
        return clientService.createWechatPrepay(request);
    }

    @Operation(summary = "确认支付结果", description = "手动同步支付状态（仅用于模拟环境）")
    @PostMapping("/pay/wechat/confirm")
    public ClientDtos.OrderView confirmPay(@RequestBody ClientDtos.PrepayRequest request) {
        return clientService.confirmWechatPay(request);
    }

    @Operation(summary = "订单催单")
    @PostMapping("/orders/{orderId}/urge")
    public ClientDtos.UrgeOrderResponse urgeOrder(@Parameter(description = "订单ID") @PathVariable("orderId") String orderId) {
        return clientService.urgeOrder(orderId);
    }
}
