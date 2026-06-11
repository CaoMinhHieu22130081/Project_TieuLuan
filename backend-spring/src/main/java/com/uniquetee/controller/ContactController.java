package com.uniquetee.controller;

import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.entity.ContactMessage;
import com.uniquetee.service.ContactMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
public class ContactController {

    @Autowired
    private ContactMessageService contactMessageService;

    // ── Public: Khách hàng gửi liên hệ (không cần đăng nhập) ─────────────
    @PostMapping("/contact")
    public ResponseEntity<?> sendMessage(@RequestBody ContactMessage message) {
        if (message.getName() == null || message.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Tên không được để trống"));
        }
        if (message.getEmail() == null || message.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Email không được để trống"));
        }
        if (message.getMessage() == null || message.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Nội dung không được để trống"));
        }
        try {
            ContactMessage saved = contactMessageService.saveMessage(message);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Lỗi khi gửi tin nhắn: " + e.getMessage()));
        }
    }

    // ── Admin + Staff: Xem danh sách tất cả tin nhắn liên hệ ────────────
    @RequiredRole({"admin", "staff"})
    @GetMapping("/admin/contacts")
    public ResponseEntity<List<ContactMessage>> getAllMessages() {
        return ResponseEntity.ok(contactMessageService.getAllMessages());
    }

    // ── Admin + Staff: Đánh dấu đã đọc (nhân viên hỗ trợ cần quyền này) ─
    @RequiredRole({"admin", "staff"})
    @PutMapping("/admin/contacts/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id) {
        contactMessageService.markAsRead(id);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Marked as read"));
    }

    // ── Chỉ Admin: Xóa tin nhắn (staff KHÔNG được xóa để giữ audit trail) ─
    @RequiredRole({"admin"})
    @DeleteMapping("/admin/contacts/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Integer id) {
        contactMessageService.deleteMessage(id);
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Deleted successfully"));
    }
}
