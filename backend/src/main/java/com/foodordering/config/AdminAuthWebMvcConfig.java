package com.foodordering.config;

import com.foodordering.auth.AdminAuthInterceptor;
import com.foodordering.auth.ClientAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AdminAuthWebMvcConfig implements WebMvcConfigurer {

    private final AdminAuthInterceptor adminAuthInterceptor;
    private final ClientAuthInterceptor clientAuthInterceptor;

    public AdminAuthWebMvcConfig(AdminAuthInterceptor adminAuthInterceptor, ClientAuthInterceptor clientAuthInterceptor) {
        this.adminAuthInterceptor = adminAuthInterceptor;
        this.clientAuthInterceptor = clientAuthInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminAuthInterceptor)
                .addPathPatterns("/v1/admin/**")
                .excludePathPatterns("/v1/admin/auth/login");

        registry.addInterceptor(clientAuthInterceptor)
                .addPathPatterns(
                        "/v1/orders/**",
                        "/v1/pay/wechat/prepay",
                        "/v1/pay/wechat/confirm",
                        "/v1/comments",
                        "/v1/support/**"
                )
                .excludePathPatterns("/v1/pay/wechat/notify");
    }
}
