package com.uniquetee.service;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.AdminNotification;
import com.uniquetee.repository.AdminNotificationRepository;

@Service
public class AdminNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AdminNotificationService.class);

    @Autowired
    private AdminNotificationRepository repo;

    public AdminNotification createNotification(String type, String text, Integer orderId) {
        AdminNotification n = new AdminNotification();
        n.setType(type);
        n.setText(text);
        n.setOrderId(orderId);
        n.setUnread(true);
        AdminNotification saved = repo.save(n);
        log.info("Created admin notification: id={} orderId={} text={}", saved.getId(), saved.getOrderId(), saved.getText());
        return saved;
    }

    public List<AdminNotification> getRecentNotifications(int limit) {
        var page = PageRequest.of(0, Math.max(1, limit), Sort.by(Sort.Direction.DESC, "createdAt"));
        return repo.findAll(page).stream().collect(Collectors.toList());
    }
}
