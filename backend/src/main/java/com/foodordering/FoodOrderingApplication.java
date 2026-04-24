package com.foodordering;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.foodordering.mapper")
@EnableScheduling
public class FoodOrderingApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoodOrderingApplication.class, args);
    }

}
