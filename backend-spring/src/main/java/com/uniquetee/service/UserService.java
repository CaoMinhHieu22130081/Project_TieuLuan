package com.uniquetee.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.User;
import com.uniquetee.entity.PasswordReset;
import com.uniquetee.repository.UserRepository;
import com.uniquetee.repository.PasswordResetRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetRepository passwordResetRepository;

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

    /**
     * Create password reset token
     * @param email User email
     * @return Reset token
     */
    public String createPasswordResetToken(String email) {
        // Kiểm tra user tồn tại
        Optional<User> user = userRepository.findByEmail(email);
        if (!user.isPresent()) {
            throw new IllegalArgumentException("Email này không được tìm thấy trong hệ thống");
        }

        // Xóa token cũ nếu có
        Optional<PasswordReset> existingReset = passwordResetRepository.findByEmail(email);
        if (existingReset.isPresent()) {
            passwordResetRepository.delete(existingReset.get());
        }

        // Tạo token mới
        String token = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(30); // 30 phút hết hạn

        PasswordReset passwordReset = new PasswordReset(token, email, now, expiryTime);
        passwordResetRepository.save(passwordReset);

        return token;
    }

    /**
     * Verify reset token
     * @param token Reset token
     * @return PasswordReset object nếu hợp lệ
     */
    public PasswordReset verifyResetToken(String token) {
        Optional<PasswordReset> passwordReset = passwordResetRepository.findByToken(token);
        if (!passwordReset.isPresent()) {
            throw new IllegalArgumentException("Token không hợp lệ");
        }

        PasswordReset reset = passwordReset.get();
        
        // Kiểm tra token đã hết hạn chưa
        if (reset.isExpired()) {
            throw new IllegalArgumentException("Token này đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới");
        }

        // Kiểm tra token đã được sử dụng chưa
        if (reset.getIsUsed()) {
            throw new IllegalArgumentException("Token này đã được sử dụng");
        }

        return reset;
    }

    /**
     * Reset user password
     * @param token Reset token
     * @param newPassword New password (plain text)
     * @return PasswordReset object after successful reset
     */
    public PasswordReset resetPassword(String token, String newPassword) {
        PasswordReset passwordReset = verifyResetToken(token);
        
        // Tìm user
        Optional<User> user = userRepository.findByEmail(passwordReset.getEmail());
        if (!user.isPresent()) {
            throw new IllegalArgumentException("User không tìm thấy");
        }

        User foundUser = user.get();
        // Hash password mới
        foundUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(foundUser);

        // Mark token as used
        passwordReset.setIsUsed(true);
        passwordReset.setUsedAt(LocalDateTime.now());
        passwordResetRepository.save(passwordReset);
        
        return passwordReset;
    }

    /**
     * Get reset token by email (FOR TESTING ONLY)
     * @param email User email
     * @return Reset token if found
     */
    public String getResetTokenByEmail(String email) {
        Optional<PasswordReset> passwordReset = passwordResetRepository.findByEmail(email);
        if (!passwordReset.isPresent()) {
            throw new IllegalArgumentException("Không tìm thấy token reset cho email này");
        }
        
        PasswordReset reset = passwordReset.get();
        
        // Check if token is still valid
        if (reset.isExpired()) {
            throw new IllegalArgumentException("Token đã hết hạn");
        }
        
        if (reset.getIsUsed()) {
            throw new IllegalArgumentException("Token đã được sử dụng");
        }
        
        return reset.getToken();
    }
}
