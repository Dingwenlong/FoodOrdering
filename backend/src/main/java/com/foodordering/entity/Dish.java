package com.foodordering.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("dishes")
@Schema(description = "菜品实体")
public class Dish {
    @TableId(type = IdType.AUTO)
    @Schema(description = "菜品ID")
    private Long id;
    @Schema(description = "所属分类ID")
    private Long categoryId;
    @Schema(description = "菜品名称")
    private String name;
    @Schema(description = "菜品描述")
    private String description;
    @Schema(description = "菜品价格")
    private BigDecimal price;
    @Schema(description = "菜品图片")
    private String image;
    @Schema(description = "状态 (0:下架, 1:上架)")
    private Integer status;
    @Schema(description = "是否售罄 (0:未售罄, 1:已售罄)")
    private Integer soldOut;
    @Schema(description = "排序权重")
    private Integer sortOrder;
    @Schema(description = "创建时间")
    private LocalDateTime createTime;
    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public Integer getSoldOut() { return soldOut; }
    public void setSoldOut(Integer soldOut) { this.soldOut = soldOut; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public LocalDateTime getUpdateTime() { return updateTime; }
    public void setUpdateTime(LocalDateTime updateTime) { this.updateTime = updateTime; }
}
