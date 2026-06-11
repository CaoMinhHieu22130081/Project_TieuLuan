package com.uniquetee.controller;

import com.uniquetee.dto.ChatConversationDTO;
import com.uniquetee.dto.ChatMessageDTO;
import com.uniquetee.entity.ChatConversation;
import com.uniquetee.annotation.RequiredRole;
import com.uniquetee.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/conversation")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> getOrCreateConversation(@RequestParam Integer userId, HttpServletRequest request) {
        if (!canAccessUser(userId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Forbidden");
        }

        try {
            ChatConversation conv = chatService.getOrCreateConversation(userId);
            return ResponseEntity.ok(conv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/conversations")
    @RequiredRole({"admin", "staff"})
    public ResponseEntity<List<ChatConversationDTO>> getAllConversations() {
        return ResponseEntity.ok(chatService.getAllConversations());
    }

    @GetMapping("/messages/{conversationId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Integer conversationId, HttpServletRequest request) {
        if (!canAccessConversation(conversationId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(chatService.getMessages(conversationId));
    }

    @PutMapping("/read/{conversationId}")
    @RequiredRole({"admin", "staff", "customer"})
    public ResponseEntity<?> markAsRead(@PathVariable Integer conversationId, @RequestParam(required = false) String role, HttpServletRequest request) {
        if (!canAccessConversation(conversationId, request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        chatService.markAsRead(conversationId, getCurrentRole(request));
        return ResponseEntity.ok().build();
    }

    private boolean canAccessConversation(Integer conversationId, HttpServletRequest request) {
        String role = getCurrentRole(request);
        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
            return true;
        }

        Integer currentUserId = getCurrentUserId(request);
        Integer conversationUserId = chatService.getConversationUserId(conversationId);
        return currentUserId != null && currentUserId.equals(conversationUserId);
    }

    private boolean canAccessUser(Integer userId, HttpServletRequest request) {
        String role = getCurrentRole(request);
        if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
            return true;
        }

        Integer currentUserId = getCurrentUserId(request);
        return currentUserId != null && currentUserId.equals(userId);
    }

    private Integer getCurrentUserId(HttpServletRequest request) {
        Object currentUserId = request.getAttribute("userId");
        if (currentUserId instanceof Integer integerUserId) {
            return integerUserId;
        }
        if (currentUserId instanceof Number numberUserId) {
            return numberUserId.intValue();
        }
        return null;
    }

    private String getCurrentRole(HttpServletRequest request) {
        Object role = request.getAttribute("role");
        return role == null ? null : role.toString();
    }
}
