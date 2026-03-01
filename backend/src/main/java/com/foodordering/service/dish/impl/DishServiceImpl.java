package com.foodordering.service.dish.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.foodordering.entity.Dish;
import com.foodordering.mapper.DishMapper;
import com.foodordering.service.dish.DishService;
import org.springframework.stereotype.Service;

@Service
public class DishServiceImpl extends ServiceImpl<DishMapper, Dish> implements DishService {
}
