package com.uniquetee.service;

import com.uniquetee.entity.ContactMessage;
import com.uniquetee.repository.ContactMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class ContactMessageService {

    @Autowired
    private ContactMessageRepository contactMessageRepository;

    public ContactMessage saveMessage(ContactMessage message) {
        if (message == null) throw new IllegalArgumentException("Message cannot be null");
        return contactMessageRepository.save(message);
    }

    public List<ContactMessage> getAllMessages() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    public void markAsRead(Integer id) {
        if (id == null) return;
        contactMessageRepository.findById(id).ifPresent(msg -> {
            msg.setIsRead(true);
            contactMessageRepository.save(msg);
        });
    }

    public void deleteMessage(Integer id) {
        if (id == null) return;
        contactMessageRepository.deleteById(id);
    }
}
