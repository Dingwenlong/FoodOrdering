package com.foodordering.config;

import com.foodordering.websocket.MenuWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final MenuWebSocketHandler menuWebSocketHandler;

    public WebSocketConfig(MenuWebSocketHandler menuWebSocketHandler) {
        this.menuWebSocketHandler = menuWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(menuWebSocketHandler, "/ws/menu")
                .setAllowedOrigins("*");
    }
}
