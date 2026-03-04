package com.foodordering.common.api;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "统一 API 响应结构")
public class ApiResponse<T> {

    @Schema(description = "状态码 (0 表示成功)", example = "0")
    private int code;
    @Schema(description = "响应消息", example = "OK")
    private String message;
    @Schema(description = "响应数据")
    private T data;
    @Schema(description = "响应时间戳")
    private String timestamp;

    public ApiResponse() {
    }

    public ApiResponse(int code, String message, T data, String timestamp) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = timestamp;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "OK", data, Instant.now().toString());
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null, Instant.now().toString());
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
