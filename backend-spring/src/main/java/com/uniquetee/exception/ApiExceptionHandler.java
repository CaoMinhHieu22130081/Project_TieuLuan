package com.uniquetee.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        String message = bindingResult.getAllErrors().stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .filter(value -> value != null && !value.isBlank())
                .findFirst()
                .orElse("Dữ liệu đánh giá không hợp lệ");

        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        String message = ex.getReason();
        if (message == null || message.isBlank()) {
            message = "Yêu cầu không hợp lệ";
        }

        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            message = "Bạn không có quyền thực hiện thao tác này";
        }

        HttpStatus status = message.toLowerCase().contains("token required")
                || message.toLowerCase().contains("unauthorized")
                        ? HttpStatus.UNAUTHORIZED
                        : HttpStatus.FORBIDDEN;

        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Tham số không hợp lệ";
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Lỗi server";
        if (message.toLowerCase().contains("unauthorized") || message.toLowerCase().contains("token required")) {
            Map<String, String> body = new LinkedHashMap<>();
            body.put("message", message);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
