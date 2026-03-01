package com.foodordering.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.foodordering.entity.Category;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
