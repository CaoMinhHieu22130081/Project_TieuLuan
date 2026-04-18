package com.uniquetee.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.AdminNotification;
import com.uniquetee.service.AdminNotificationService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = {
        "http://127.0.0.1:5173", "http://localhost:5173",
        "http://127.0.0.1:5174", "http://localhost:5174",
        "http://127.0.0.1:5175", "http://localhost:5175",
        "http://127.0.0.1:5176", "http://localhost:5176"
})
public class AdminNotificationController {

    @Autowired
    private AdminNotificationService notificationService;

    @GetMapping("/notifications")
    @RequiredRole({"admin", "staff"})
    public ResponseEntity<List<Map<String, Object>>> getNotifications() {
        List<AdminNotification> notifs = notificationService.getRecentNotifications(30);
        List<Map<String, Object>> result = notifs.stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("type", n.getType());
            m.put("text", n.getText());
            m.put("createdAt", n.getCreatedAt());
            m.put("unread", n.getUnread());
            m.put("orderId", n.getOrderId());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
