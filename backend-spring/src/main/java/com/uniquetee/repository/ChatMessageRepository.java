package com.uniquetee.repository;

import com.uniquetee.entity.ChatConversation;
import com.uniquetee.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByConversationOrderBySentAtAsc(ChatConversation conversation);
    
    // Count unread messages for a specific conversation and role
    long countByConversationAndIsReadAndSenderRoleNot(ChatConversation conversation, Boolean isRead, String senderRole);
}
