package com.uniquetee.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.User;
import com.uniquetee.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Register new user with password hashing
     * @param user User object với password plain text
     * @return User saved vào DB với password hashed
     * @throws IllegalArgumentException nếu email đã tồn tại
     */
    public User registerUser(User user) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email này đã được đăng ký rồi. Vui lòng dùng email khác hoặc đăng nhập.");
        }
        
        // Kiểm tra tên không rỗng
        if (user.getName() == null || user.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Họ tên không được để trống");
        }
        
        // Kiểm tra phone không rỗng
        if (user.getPhone() == null || user.getPhone().trim().isEmpty()) {
            throw new IllegalArgumentException("Số điện thoại không được để trống");
        }
        
        // Kiểm tra gender là bắt buộc
        if (user.getGender() == null || user.getGender().trim().isEmpty()) {
            throw new IllegalArgumentException("Giới tính không được để trống");
        }
        
        // Kiểm tra dob là bắt buộc
        if (user.getDob() == null) {
            throw new IllegalArgumentException("Ngày sinh không được để trống");
        }
        
        // Hash password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set default role nếu không có
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("customer");
        }
        
        // Set default status
        if (user.getStatus() == null || user.getStatus().isEmpty()) {
            user.setStatus("active");
        }
        
        return userRepository.save(user);
    }

    /**
     * Create user (dùng cho admin create)
     */
    public User createUser(User user) {
        // Kiểm tra email đã tồn tại chưa
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        // Hash password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        return userRepository.save(user);
    }

    public User updateUser(Integer id, User userDetails) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            User existingUser = user.get();
            if (userDetails.getName() != null) existingUser.setName(userDetails.getName());
            if (userDetails.getPhone() != null) existingUser.setPhone(userDetails.getPhone());
            if (userDetails.getPassword() != null) {
                // Hash password nếu được update
                existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }
            if (userDetails.getRole() != null) existingUser.setRole(userDetails.getRole());
            if (userDetails.getStatus() != null) existingUser.setStatus(userDetails.getStatus());
            if (userDetails.getAvatar() != null) existingUser.setAvatar(userDetails.getAvatar());
            if (userDetails.getGender() != null) existingUser.setGender(userDetails.getGender());
            if (userDetails.getDob() != null) existingUser.setDob(userDetails.getDob());
            if (userDetails.getAddress() != null) existingUser.setAddress(userDetails.getAddress());
            if (userDetails.getSpent() != null) existingUser.setSpent(userDetails.getSpent());
            if (userDetails.getOrderCount() != null) existingUser.setOrderCount(userDetails.getOrderCount());
            
            return userRepository.save(existingUser);
        }
        return null;
    }

    public boolean deleteUser(Integer id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Authenticate user với email & password
     * @param email User email
     * @param password Plain text password
     * @return User object nếu authenticate thành công, else null
     */
    public User authenticate(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            User foundUser = user.get();
            // Check if user is active
            if (!"active".equals(foundUser.getStatus())) {
                throw new IllegalArgumentException("Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
            }
            // Compare plain password với hashed password trong DB
            if (passwordEncoder.matches(password, foundUser.getPassword())) {
                return foundUser;
            }
        }
        return null;
    }
}
