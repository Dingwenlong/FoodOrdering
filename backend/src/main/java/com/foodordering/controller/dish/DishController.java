package com.foodordering.controller.dish;

import com.foodordering.entity.Dish;
import com.foodordering.service.dish.DishService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "菜品接口 (旧版)", description = "提供基础菜品查询功能")
@RestController
@RequestMapping("/dish")
public class DishController {

    @Autowired
    private DishService dishService;

    @Operation(summary = "查询全量菜品列表")
    @GetMapping("/list")
    public List<Dish> list() {
        return dishService.list();
    }
}
