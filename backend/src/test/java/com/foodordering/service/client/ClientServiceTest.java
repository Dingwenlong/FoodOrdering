package com.foodordering.service.client;

import com.foodordering.dto.client.ClientDtos;
import com.foodordering.entity.AdminNotice;
import com.foodordering.entity.Dish;
import com.foodordering.entity.Order;
import com.foodordering.entity.OrderItem;
import com.foodordering.entity.User;
import com.foodordering.entity.UserComment;
import com.foodordering.mapper.AdminNoticeMapper;
import com.foodordering.mapper.CategoryMapper;
import com.foodordering.mapper.DishMapper;
import com.foodordering.mapper.OrderItemMapper;
import com.foodordering.mapper.OrderMapper;
import com.foodordering.mapper.PaymentMapper;
import com.foodordering.mapper.TableMapper;
import com.foodordering.mapper.UserCommentMapper;
import com.foodordering.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientServiceTest {

    private final CategoryMapper categoryMapper = mock(CategoryMapper.class);
    private final DishMapper dishMapper = mock(DishMapper.class);
    private final TableMapper tableMapper = mock(TableMapper.class);
    private final UserMapper userMapper = mock(UserMapper.class);
    private final OrderMapper orderMapper = mock(OrderMapper.class);
    private final OrderItemMapper orderItemMapper = mock(OrderItemMapper.class);
    private final PaymentMapper paymentMapper = mock(PaymentMapper.class);
    private final AdminNoticeMapper adminNoticeMapper = mock(AdminNoticeMapper.class);
    private final UserCommentMapper userCommentMapper = mock(UserCommentMapper.class);

    private final ClientService service = new ClientService(
            categoryMapper,
            dishMapper,
            tableMapper,
            userMapper,
            orderMapper,
            orderItemMapper,
            paymentMapper,
            adminNoticeMapper,
            userCommentMapper
    );

    private User activeUser() {
        User user = new User();
        user.setId(1L);
        user.setUsername("xiaozhang");
        user.setStatus(1);
        return user;
    }

    @Test
    void shouldCreateCommentWhenOrderDone() {
        when(userMapper.selectList(any())).thenReturn(List.of(activeUser()));

        Order order = new Order();
        order.setId(10010L);
        order.setStatus(3);
        order.setUserId(1L);
        when(orderMapper.selectById(10010L)).thenReturn(order);
        when(userCommentMapper.selectOne(any())).thenReturn(null);

        OrderItem orderItem = new OrderItem();
        orderItem.setDishId(2L);
        when(orderItemMapper.selectList(any())).thenReturn(List.of(orderItem));

        Dish dish = new Dish();
        dish.setName("麻婆豆腐");
        when(dishMapper.selectById(2L)).thenReturn(dish);

        when(userMapper.selectById(1L)).thenReturn(activeUser());

        doAnswer(invocation -> {
            UserComment saved = invocation.getArgument(0);
            saved.setId(99L);
            return 1;
        }).when(userCommentMapper).insert(any(UserComment.class));

        ClientDtos.CommentView result = service.createComment(new ClientDtos.CreateCommentRequest("10010", 5, "味道很好"));
        assertEquals("99", result.id());
        assertEquals("10010", result.orderId());
        assertEquals("xiaozhang", result.userName());
        assertEquals("味道很好", result.content());
        assertEquals(5, result.rating());
        assertTrue(result.createdAt() != null && !result.createdAt().isBlank());
    }

    @Test
    void shouldRejectDuplicateComment() {
        when(userMapper.selectList(any())).thenReturn(List.of(activeUser()));

        Order order = new Order();
        order.setId(10011L);
        order.setStatus(3);
        order.setUserId(1L);
        when(orderMapper.selectById(10011L)).thenReturn(order);

        UserComment existing = new UserComment();
        existing.setId(1L);
        when(userCommentMapper.selectOne(any())).thenReturn(existing);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.createComment(new ClientDtos.CreateCommentRequest("10011", 4, "重复评价"))
        );
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void shouldListOnlyOwnedOrders() {
        when(userMapper.selectList(any())).thenReturn(List.of(activeUser()));

        Order order = new Order();
        order.setId(10001L);
        order.setUserId(1L);
        order.setTableId(1L);
        order.setStatus(0);
        order.setTotalAmount(new BigDecimal("36.00"));
        order.setCreateTime(LocalDateTime.now());
        when(orderMapper.selectList(any())).thenReturn(List.of(order));

        OrderItem item = new OrderItem();
        item.setOrderId(10001L);
        item.setDishId(6L);
        item.setQuantity(3);
        item.setUnitPrice(new BigDecimal("12.00"));
        when(orderItemMapper.selectList(any())).thenReturn(List.of(item));

        Dish dish = new Dish();
        dish.setId(6L);
        dish.setName("可乐");
        when(dishMapper.selectBatchIds(any())).thenReturn(List.of(dish));

        com.foodordering.entity.Table table = new com.foodordering.entity.Table();
        table.setId(1L);
        table.setTableNo("A01");
        when(tableMapper.selectById(1L)).thenReturn(table);

        List<ClientDtos.OrderView> result = service.listOrders();
        assertEquals(1, result.size());
        assertEquals("10001", result.get(0).id());
        assertEquals("PENDING_PAY", result.get(0).status());
    }

    @Test
    void shouldCancelPendingPayOrder() {
        when(userMapper.selectList(any())).thenReturn(List.of(activeUser()));

        Order order = new Order();
        order.setId(10012L);
        order.setUserId(1L);
        order.setStatus(0);
        order.setTableId(1L);
        order.setTotalAmount(new BigDecimal("20.00"));
        order.setCreateTime(LocalDateTime.now());
        when(orderMapper.selectById(10012L)).thenReturn(order);

        OrderItem item = new OrderItem();
        item.setOrderId(10012L);
        item.setDishId(1L);
        item.setQuantity(1);
        item.setUnitPrice(new BigDecimal("20.00"));
        when(orderItemMapper.selectList(any())).thenReturn(List.of(item));

        Dish dish = new Dish();
        dish.setId(1L);
        dish.setName("宫保鸡丁");
        when(dishMapper.selectBatchIds(any())).thenReturn(List.of(dish));

        com.foodordering.entity.Table table = new com.foodordering.entity.Table();
        table.setId(1L);
        table.setTableNo("A01");
        when(tableMapper.selectById(1L)).thenReturn(table);

        ClientDtos.OrderView result = service.cancelOrder("10012");
        assertEquals("CANCELED", result.status());
    }

    @Test
    void shouldRejectAccessingOthersOrder() {
        when(userMapper.selectList(any())).thenReturn(List.of(activeUser()));
        Order order = new Order();
        order.setId(10013L);
        order.setUserId(2L);
        when(orderMapper.selectById(10013L)).thenReturn(order);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.getOrder("10013")
        );
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void shouldListNoticesByPinnedAndTime() {
        AdminNotice notice = new AdminNotice();
        notice.setId(7L);
        notice.setTitle("营业时间调整");
        notice.setContent("周末延长营业");
        notice.setCreateTime(LocalDateTime.now());
        when(adminNoticeMapper.selectList(any())).thenReturn(List.of(notice));

        List<ClientDtos.NoticeView> result = service.listNotices();
        assertEquals(1, result.size());
        assertEquals("7", result.get(0).id());
        assertEquals("营业时间调整", result.get(0).title());
    }
}
