package com.uniquetee.service;

import com.uniquetee.dto.ChatConversationDTO;
import com.uniquetee.dto.ChatMessageDTO;
import com.uniquetee.entity.ChatConversation;
import com.uniquetee.entity.ChatMessage;
import com.uniquetee.entity.User;
import com.uniquetee.repository.ChatConversationRepository;
import com.uniquetee.repository.ChatMessageRepository;
import com.uniquetee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatConversationRepository conversationRepository;

    @Autowired
    private ChatMessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ChatConversation getOrCreateConversation(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return conversationRepository.findByUserAndStatus(user, "open")
                .orElseGet(() -> {
                    ChatConversation newConv = new ChatConversation();
                    newConv.setUser(user);
                    newConv.setStatus("open");
                    return conversationRepository.save(newConv);
                });
    }

    @Transactional
    public ChatMessage saveMessage(Integer conversationId, Integer senderId, String content) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        ChatMessage message = new ChatMessage();
        message.setConversation(conv);
        message.setSender(sender);
        message.setSenderRole(sender.getRole());
        message.setContent(content);
        message.setIsRead(false);
        
        ChatMessage saved = messageRepository.save(message);
        
        // Update conversation last updated time
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);
        
        return saved;
    }

    public List<ChatMessageDTO> getMessages(Integer conversationId) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        return messageRepository.findByConversationOrderBySentAtAsc(conv)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Integer getConversationUserId(Integer conversationId) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        return conv.getUser() == null ? null : conv.getUser().getId();
    }

    public List<ChatConversationDTO> getAllConversations() {
        return conversationRepository.findAllByOrderByUpdatedAtDesc()
                .stream().map(this::convertToConversationDTO).collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Integer conversationId, String readerRole) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        List<ChatMessage> unreadMessages = messageRepository.findByConversationOrderBySentAtAsc(conv)
                .stream()
                .filter(m -> !m.getIsRead() && !m.getSenderRole().equals(readerRole))
                .collect(Collectors.toList());
        
        unreadMessages.forEach(m -> m.setIsRead(true));
        messageRepository.saveAll(unreadMessages);
    }

    @Transactional
    public ChatMessage deleteMessage(Integer messageId, Integer userId, String userRole) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
                
        if (!message.getSender().getId().equals(userId) && !"admin".equals(userRole) && !"staff".equals(userRole)) {
            throw new RuntimeException("Not authorized to delete this message");
        }
        
        message.setIsDeleted(true);
        message.setContent("Tin nhắn đã bị thu hồi");
        return messageRepository.save(message);
    }

    public ChatMessageDTO convertToDTO(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversation().getId());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getName());
        dto.setSenderRole(message.getSenderRole());
        dto.setContent(message.getContent());
        dto.setIsRead(message.getIsRead());
        dto.setSentAt(message.getSentAt());
        dto.setIsDeleted(message.getIsDeleted() != null ? message.getIsDeleted() : false);
        return dto;
    }
    private ChatConversationDTO convertToConversationDTO(ChatConversation conv) {
        ChatConversationDTO dto = new ChatConversationDTO();
        dto.setId(conv.getId());
        dto.setUserId(conv.getUser().getId());
        dto.setUserName(conv.getUser().getName());
        dto.setUserEmail(conv.getUser().getEmail());
        dto.setUserAvatar(conv.getUser().getAvatar());
        dto.setStatus(conv.getStatus());
        dto.setUpdatedAt(conv.getUpdatedAt());
        
        List<ChatMessage> messages = messageRepository.findByConversationOrderBySentAtAsc(conv);
        if (!messages.isEmpty()) {
            dto.setLastMessage(messages.get(messages.size() - 1).getContent());
        }
        
        // Count unread for admin (messages sent by customer)
        dto.setUnreadCount(messageRepository.countByConversationAndIsReadAndSenderRoleNot(conv, false, "admin"));
        
        return dto;
    }
}
