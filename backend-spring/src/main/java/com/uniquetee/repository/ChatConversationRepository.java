package com.uniquetee.repository;

import com.uniquetee.entity.ChatConversation;
import com.uniquetee.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Integer> {
    Optional<ChatConversation> findByUserAndStatus(User user, String status);
    List<ChatConversation> findAllByOrderByUpdatedAtDesc();
}
