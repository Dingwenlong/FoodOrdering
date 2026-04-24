package com.foodordering.service.order;

import com.foodordering.entity.Order;
import com.foodordering.mapper.OrderMapper;
import com.foodordering.websocket.MenuWebSocketHandler;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderStatusAutoProgressServiceTest {

    private final OrderMapper orderMapper = mock(OrderMapper.class);
    private final MenuWebSocketHandler menuWebSocketHandler = mock(MenuWebSocketHandler.class);

    @Test
    void shouldAutoMoveStalePaidOrdersToCookingAndBroadcast() {
        OrderStatusAutoProgressService service = new OrderStatusAutoProgressService(
                orderMapper,
                menuWebSocketHandler,
                true,
                60
        );
        LocalDateTime now = LocalDateTime.of(2026, 4, 24, 12, 0);

        Order order = new Order();
        order.setId(10001L);
        order.setStatus(1);
        order.setUpdateTime(now.minusMinutes(2));
        when(orderMapper.selectList(any())).thenReturn(List.of(order));
        when(orderMapper.update(any(Order.class), any())).thenReturn(1);

        int changed = service.autoStartCookingOrders(now);

        assertEquals(1, changed);
        verify(orderMapper).update(any(Order.class), any());
        verify(menuWebSocketHandler).broadcastOrderUpdate("10001");
    }

    @Test
    void shouldNotBroadcastWhenManualStatusAlreadyChangedBeforeUpdate() {
        OrderStatusAutoProgressService service = new OrderStatusAutoProgressService(
                orderMapper,
                menuWebSocketHandler,
                true,
                60
        );
        LocalDateTime now = LocalDateTime.of(2026, 4, 24, 12, 0);

        Order order = new Order();
        order.setId(10002L);
        order.setStatus(1);
        order.setUpdateTime(now.minusMinutes(2));
        when(orderMapper.selectList(any())).thenReturn(List.of(order));
        when(orderMapper.update(any(Order.class), any())).thenReturn(0);

        int changed = service.autoStartCookingOrders(now);

        assertEquals(0, changed);
        verify(menuWebSocketHandler, never()).broadcastOrderUpdate(any());
    }

    @Test
    void shouldDoNothingWhenAutoProgressDisabled() {
        OrderStatusAutoProgressService service = new OrderStatusAutoProgressService(
                orderMapper,
                menuWebSocketHandler,
                false,
                60
        );

        int changed = service.autoStartCookingOrders(LocalDateTime.of(2026, 4, 24, 12, 0));

        assertEquals(0, changed);
        verify(orderMapper, never()).selectList(any());
        verify(menuWebSocketHandler, never()).broadcastOrderUpdate(any());
    }
}
