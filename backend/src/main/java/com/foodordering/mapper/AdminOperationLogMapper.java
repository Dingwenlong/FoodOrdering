package com.foodordering.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.foodordering.entity.AdminOperationLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminOperationLogMapper extends BaseMapper<AdminOperationLog> {
}
