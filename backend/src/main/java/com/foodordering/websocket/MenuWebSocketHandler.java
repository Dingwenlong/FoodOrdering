package com.foodordering.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class MenuWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(MenuWebSocketHandler.class);
    private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        logger.info("WebSocket connection established: {}", session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
        logger.info("WebSocket connection closed: {}", session.getId());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("WebSocket transport error for session: {}", session.getId(), exception);
        sessions.remove(session);
    }

    public void broadcastMenuUpdate() {
        MenuUpdateMessage message = new MenuUpdateMessage("menu_updated");
        String jsonMessage;
        try {
            jsonMessage = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            logger.error("Failed to serialize menu update message", e);
            return;
        }

        TextMessage textMessage = new TextMessage(jsonMessage);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    logger.error("Failed to send message to session: {}", session.getId(), e);
                }
            }
        }
        logger.info("Menu update broadcasted to {} sessions", sessions.size());
    }

    public void broadcastOrderUpdate(String orderId) {
        MenuUpdateMessage message = new MenuUpdateMessage("order_updated");
        message.setOrderId(orderId);
        String jsonMessage;
        try {
            jsonMessage = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            logger.error("Failed to serialize order update message", e);
            return;
        }

        TextMessage textMessage = new TextMessage(jsonMessage);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    logger.error("Failed to send message to session: {}", session.getId(), e);
                }
            }
        }
        logger.info("Order update broadcasted to {} sessions, orderId: {}", sessions.size(), orderId);
    }

    public static class MenuUpdateMessage {
        private String type;
        private String orderId;

        public MenuUpdateMessage(String type) {
            this.type = type;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getOrderId() {
            return orderId;
        }

        public void setOrderId(String orderId) {
            this.orderId = orderId;
        }
    }
}
