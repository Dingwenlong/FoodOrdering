package com.foodordering.controller.dish;

import com.foodordering.entity.Dish;
import com.foodordering.service.dish.DishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "菜品接口 (V1)", description = "提供菜品相关的 API 接口")
@RestController
@RequestMapping("/v1/dishes")
public class DishV1Controller {

    private final DishService dishService;

    public DishV1Controller(DishService dishService) {
        this.dishService = dishService;
    }

    @Operation(summary = "查询菜品列表")
    @GetMapping
    public List<Dish> list() {
        return dishService.list();
    }
}
