package com.uniquetee.controller;

import com.uniquetee.dto.ChatConversationDTO;
import com.uniquetee.dto.ChatMessageDTO;
import com.uniquetee.entity.ChatConversation;
import com.uniquetee.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatRestController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/conversation")
    public ResponseEntity<?> getOrCreateConversation(@RequestParam Integer userId) {
        try {
            ChatConversation conv = chatService.getOrCreateConversation(userId);
            return ResponseEntity.ok(conv);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversationDTO>> getAllConversations() {
        return ResponseEntity.ok(chatService.getAllConversations());
    }

    @GetMapping("/messages/{conversationId}")
    public ResponseEntity<List<ChatMessageDTO>> getMessages(@PathVariable Integer conversationId) {
        return ResponseEntity.ok(chatService.getMessages(conversationId));
    }

    @PutMapping("/read/{conversationId}")
    public ResponseEntity<?> markAsRead(@PathVariable Integer conversationId, @RequestParam String role) {
        chatService.markAsRead(conversationId, role);
        return ResponseEntity.ok().build();
    }
}
