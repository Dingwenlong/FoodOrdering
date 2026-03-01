package com.foodordering.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.foodordering.entity.Table;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TableMapper extends BaseMapper<Table> {
}
