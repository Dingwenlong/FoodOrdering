package com.foodordering.controller.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodordering.dto.client.ClientDtos;
import com.foodordering.service.client.ClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ClientControllerTest {

    private final ClientService clientService = mock(ClientService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ClientController controller = new ClientController(clientService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void shouldReturnNotices() throws Exception {
        when(clientService.listNotices()).thenReturn(List.of(
                new ClientDtos.NoticeView("1", "公告1", "内容1", "2026-03-07T11:00:00Z")
        ));

        mockMvc.perform(get("/v1/notices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("1"))
                .andExpect(jsonPath("$[0].title").value("公告1"));
    }

    @Test
    void shouldReturnComments() throws Exception {
        when(clientService.listComments()).thenReturn(List.of(
                new ClientDtos.CommentView("2", "10003", "xiaoli", "好评", 5, "2026-03-07T11:00:00Z")
        ));

        mockMvc.perform(get("/v1/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderId").value("10003"))
                .andExpect(jsonPath("$[0].rating").value(5));
    }

    @Test
    void shouldCreateComment() throws Exception {
        when(clientService.createComment(any())).thenReturn(
                new ClientDtos.CommentView("3", "10005", "xiaozhang", "味道很好", 5, "2026-03-07T11:00:00Z")
        );

        String body = objectMapper.writeValueAsString(new ClientDtos.CreateCommentRequest("10005", 5, "味道很好"));
        mockMvc.perform(post("/v1/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("3"))
                .andExpect(jsonPath("$.userName").value("xiaozhang"));
    }

    @Test
    void shouldListOrders() throws Exception {
        when(clientService.listOrders()).thenReturn(List.of(
                new ClientDtos.OrderView("10001", "store_1", "1", "A01", "PENDING_PAY", List.of(), new ClientDtos.MoneyView("CNY", 3200), null, "2026-03-07T11:00:00Z")
        ));

        mockMvc.perform(get("/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("10001"))
                .andExpect(jsonPath("$[0].status").value("PENDING_PAY"));
    }

    @Test
    void shouldCancelOrder() throws Exception {
        when(clientService.cancelOrder("10001")).thenReturn(
                new ClientDtos.OrderView("10001", "store_1", "1", "A01", "CANCELED", List.of(), new ClientDtos.MoneyView("CNY", 3200), null, "2026-03-07T11:00:00Z")
        );

        mockMvc.perform(post("/v1/orders/10001/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("10001"))
                .andExpect(jsonPath("$.status").value("CANCELED"));
    }
}
