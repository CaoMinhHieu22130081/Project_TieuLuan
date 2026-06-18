package com.uniquetee.controller;

import com.uniquetee.dto.ChatMessageDTO;
import com.uniquetee.entity.ChatMessage;
import com.uniquetee.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDTO chatMessageDTO) {
        ChatMessage savedMessage = chatService.saveMessage(
                chatMessageDTO.getConversationId(),
                chatMessageDTO.getSenderId(),
                chatMessageDTO.getContent()
        );
        
        ChatMessageDTO responseDTO = chatService.convertToDTO(savedMessage);
        
        // Broadcast to the conversation topic
        messagingTemplate.convertAndSend("/topic/conversation/" + chatMessageDTO.getConversationId(), responseDTO);
        
        // Notify admin about new message if it's from a customer
        if ("customer".equals(responseDTO.getSenderRole())) {
            messagingTemplate.convertAndSend("/topic/admin/notifications", responseDTO);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessageDTO typingInfo) {
        messagingTemplate.convertAndSend("/topic/conversation/" + typingInfo.getConversationId() + "/typing", typingInfo);
    }

    @MessageMapping("/chat.deleteMessage")
    public void deleteMessage(@Payload ChatMessageDTO deleteInfo) {
        ChatMessage deletedMsg = chatService.deleteMessage(
            deleteInfo.getId(),
            deleteInfo.getSenderId(),
            deleteInfo.getSenderRole()
        );
        
        ChatMessageDTO responseDTO = chatService.convertToDTO(deletedMsg);
        
        messagingTemplate.convertAndSend("/topic/conversation/" + responseDTO.getConversationId(), responseDTO);
    }
}
