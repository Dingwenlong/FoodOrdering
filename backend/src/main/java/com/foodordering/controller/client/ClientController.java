package com.foodordering.controller.client;

import com.foodordering.dto.client.ClientDtos;
import com.foodordering.service.client.ClientService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @PostMapping("/session/bind-table")
    public ClientDtos.BindTableResponse bindTable(@RequestBody ClientDtos.BindTableRequest request) {
        return clientService.bindTable(request);
    }

    @GetMapping("/menu")
    public ClientDtos.MenuView menu(@RequestParam(value = "storeId", required = false) String storeId) {
        return clientService.getMenu(storeId);
    }

    @PostMapping("/orders")
    public ClientDtos.OrderView createOrder(@RequestBody ClientDtos.CreateOrderRequest request) {
        return clientService.createOrder(request);
    }

    @GetMapping("/orders/{orderId}")
    public ClientDtos.OrderView getOrder(@PathVariable("orderId") String orderId) {
        return clientService.getOrder(orderId);
    }

    @PostMapping("/pay/wechat/prepay")
    public ClientDtos.PrepayResponse prepay(@RequestBody ClientDtos.PrepayRequest request) {
        return clientService.createWechatPrepay(request);
    }

    @PostMapping("/pay/wechat/confirm")
    public ClientDtos.OrderView confirmPay(@RequestBody ClientDtos.PrepayRequest request) {
        return clientService.confirmWechatPay(request);
    }

    @PostMapping("/orders/{orderId}/urge")
    public ClientDtos.UrgeOrderResponse urgeOrder(@PathVariable("orderId") String orderId) {
        return clientService.urgeOrder(orderId);
    }
}
