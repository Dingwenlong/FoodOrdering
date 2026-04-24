package com.foodordering.service.order;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.foodordering.entity.Order;
import com.foodordering.mapper.OrderMapper;
import com.foodordering.websocket.MenuWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderStatusAutoProgressService {

    private static final int ORDER_STATUS_PAID = 1;
    private static final int ORDER_STATUS_COOKING = 2;

    private final OrderMapper orderMapper;
    private final MenuWebSocketHandler menuWebSocketHandler;
    private final boolean enabled;
    private final long autoStartCookingDelaySeconds;

    public OrderStatusAutoProgressService(
            OrderMapper orderMapper,
            MenuWebSocketHandler menuWebSocketHandler,
            @Value("${app.order.auto-start-cooking-enabled:true}") boolean enabled,
            @Value("${app.order.auto-start-cooking-delay-seconds:300}") long autoStartCookingDelaySeconds
    ) {
        this.orderMapper = orderMapper;
        this.menuWebSocketHandler = menuWebSocketHandler;
        this.enabled = enabled;
        this.autoStartCookingDelaySeconds = Math.max(1, autoStartCookingDelaySeconds);
    }

    @Scheduled(fixedDelayString = "${app.order.auto-start-cooking-scan-interval-ms:15000}")
    public void scheduledAutoStartCooking() {
        autoStartCookingOrders(LocalDateTime.now());
    }

    public int autoStartCookingOrders(LocalDateTime now) {
        if (!enabled) {
            return 0;
        }

        LocalDateTime cutoff = now.minusSeconds(autoStartCookingDelaySeconds);
        List<Order> candidates = orderMapper.selectList(
                new LambdaQueryWrapper<Order>()
                        .eq(Order::getStatus, ORDER_STATUS_PAID)
                        .le(Order::getUpdateTime, cutoff)
        );

        int changed = 0;
        for (Order order : candidates) {
            Order updated = new Order();
            updated.setStatus(ORDER_STATUS_COOKING);
            updated.setUpdateTime(now);

            int rows = orderMapper.update(
                    updated,
                    new LambdaUpdateWrapper<Order>()
                            .eq(Order::getId, order.getId())
                            .eq(Order::getStatus, ORDER_STATUS_PAID)
            );
            if (rows > 0) {
                changed++;
                menuWebSocketHandler.broadcastOrderUpdate(String.valueOf(order.getId()));
            }
        }
        return changed;
    }
}
