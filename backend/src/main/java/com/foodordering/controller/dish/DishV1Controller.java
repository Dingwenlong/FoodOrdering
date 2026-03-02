package com.foodordering.controller.dish;

import com.foodordering.entity.Dish;
import com.foodordering.service.dish.DishService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/dishes")
public class DishV1Controller {

    private final DishService dishService;

    public DishV1Controller(DishService dishService) {
        this.dishService = dishService;
    }

    @GetMapping
    public List<Dish> list() {
        return dishService.list();
    }
}
