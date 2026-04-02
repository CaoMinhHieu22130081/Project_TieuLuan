package com.uniquetee.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String email, String resetToken, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("caominhhieunq@gmail.com");
            message.setTo(email);
            message.setSubject("UniqueTee - Đặt lại mật khẩu");
            
            String emailBody = "Xin chào,\n\n" +
                    "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản UniqueTee của mình.\n\n" +
                    "Hãy nhấp vào link dưới đây để đặt lại mật khẩu:\n" +
                    resetLink + "\n\n" +
                    "Hoặc sao chép mã reset này: " + resetToken + "\n\n" +
                    "Link này sẽ hết hạn trong 30 phút.\n\n" +
                    "Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.\n\n" +
                    "Trân trọng,\n" +
                    "UniqueTee Team";
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    public void sendPasswordResetSuccessEmail(String email, String userName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("caominhhieunq@gmail.com");
            message.setTo(email);
            message.setSubject("UniqueTee - Mật khẩu đã được đặt lại thành công");
            
            String emailBody = "Xin chào " + userName + ",\n\n" +
                    "Mật khẩu của bạn đã được đặt lại thành công.\n\n" +
                    "Bạn có thể đăng nhập bằng mật khẩu mới của mình.\n\n" +
                    "Nếu đây không phải là bạn, vui lòng liên hệ với chúng tôi ngay lập tức.\n\n" +
                    "Trân trọng,\n" +
                    "UniqueTee Team";
            
            message.setText(emailBody);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }
}
