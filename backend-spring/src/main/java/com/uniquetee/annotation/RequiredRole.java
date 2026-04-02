package com.uniquetee.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation để xác định role yêu cầu cho một endpoint
 * Ví dụ: @RequiredRole({"admin"}) - chỉ admin có thể truy cập
 *        @RequiredRole({"admin", "staff"}) - admin và staff có thể truy cập
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiredRole {
    String[] value() default {"customer"}; // Default roles, all roles are allowed
}
