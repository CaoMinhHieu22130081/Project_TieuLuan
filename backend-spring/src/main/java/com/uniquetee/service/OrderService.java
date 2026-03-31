package com.uniquetee.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;
import com.uniquetee.entity.User;
import com.uniquetee.repository.OrderRepository;
import com.uniquetee.repository.ProductRepository;
import com.uniquetee.repository.UserRepository;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<Order> getOrderById(Integer id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByUser(Integer userId) {
        return orderRepository.findByUserId(userId);
    }

    @Transactional
    public Order createOrder(Order order) {
        // compute subtotal from items if not provided
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            // if unitPrice missing, try to fetch product price
            Integer pid = item.getProductId();
            if (item.getUnitPrice() == null && pid != null) {
                productRepository.findById(pid).ifPresent(p -> item.setUnitPrice(p.getPrice()));
            }
            if (item.getUnitPrice() != null) {
                BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQty()));
                item.setSubtotal(line);
                subtotal = subtotal.add(line);
            }
            item.setOrder(order);
        }
        order.setSubtotal(subtotal);
        if (order.getShippingFee() == null) order.setShippingFee(BigDecimal.ZERO);
        order.setTotal(order.getSubtotal().add(order.getShippingFee()));

        // link user if provided
        if (order.getUser() != null) {
            Integer uid = order.getUser().getId();
            if (uid != null) {
                Optional<User> u = userRepository.findById(uid);
                u.ifPresent(order::setUser);
            }
        }

        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Integer id, String status) {
        Optional<Order> o = orderRepository.findById(id);
        if (o.isPresent()) {
            Order order = o.get();
            order.setStatus(status);
            return orderRepository.save(order);
        }
        return null;
    }
}
