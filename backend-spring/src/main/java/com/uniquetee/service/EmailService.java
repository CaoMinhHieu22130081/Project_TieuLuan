package com.uniquetee.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.uniquetee.entity.Order;
import com.uniquetee.entity.OrderItem;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {
    private static final DateTimeFormatter ORDER_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String email, String resetToken, String resetLink) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("caominhhieunq@gmail.com");
            message.setTo(email);
            message.setSubject("UniqueTee - Đặt lại mật khẩu");

            String emailBody = """
                    Xin chào,

                    Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản UniqueTee của mình.

                    Hãy nhấp vào link dưới đây để đặt lại mật khẩu:
                    %s

                    Hoặc sao chép mã reset này: %s

                    Link này sẽ hết hạn trong 30 phút.

                    Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.

                    Trân trọng,
                    UniqueTee Team
                    """.formatted(resetLink, resetToken);

            message.setText(emailBody);
            mailSender.send(message);
        } catch (MailException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    public void sendPasswordResetSuccessEmail(String email, String userName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("caominhhieunq@gmail.com");
            message.setTo(email);
            message.setSubject("UniqueTee - Mật khẩu đã được đặt lại thành công");

            String emailBody = """
                    Xin chào %s,

                    Mật khẩu của bạn đã được đặt lại thành công.

                    Bạn có thể đăng nhập bằng mật khẩu mới của mình.

                    Nếu đây không phải là bạn, vui lòng liên hệ với chúng tôi ngay lập tức.

                    Trân trọng,
                    UniqueTee Team
                    """.formatted(userName);

            message.setText(emailBody);
            mailSender.send(message);
        } catch (MailException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    public void sendOrderConfirmationEmail(String email, String customerName, Order order) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            String recipientEmail = Objects.requireNonNull(email, "email");
            String subject = Objects.requireNonNull(buildOrderConfirmationSubject(order), "subject");
            String plainText = Objects.requireNonNull(buildOrderConfirmationBody(recipientEmail, customerName, order), "plainText");
            String htmlText = Objects.requireNonNull(buildOrderConfirmationHtml(recipientEmail, customerName, order), "htmlText");
            helper.setFrom("caominhhieunq@gmail.com");
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(plainText, htmlText);
            mailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    public void sendOrderCancellationNotificationToAdmin(String adminEmail, Order order, String cancellationReason) {
        // Use the cancellation email template (HTML + plain text) for admin notification as well
        try {
            sendOrderCancellationEmail(adminEmail, "Quản trị viên", order, cancellationReason);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gửi email admin: " + e.getMessage());
        }
    }

    public void sendOrderCancellationEmail(String email, String customerName, Order order, String cancellationReason) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            String recipientEmail = Objects.requireNonNull(email, "email");
            String subject = Objects.requireNonNull(buildOrderCancellationSubject(order), "subject");
            String plainText = Objects.requireNonNull(buildOrderCancellationBody(recipientEmail, customerName, order, cancellationReason), "plainText");
            String htmlText = Objects.requireNonNull(buildOrderCancellationHtml(recipientEmail, customerName, order, cancellationReason), "htmlText");
            helper.setFrom("caominhhieunq@gmail.com");
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(plainText, htmlText);
            mailSender.send(mimeMessage);
        } catch (MailException | MessagingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }

    private String buildOrderCancellationSubject(Order order) {
        String orderCode = normalizeText(order == null ? null : order.getOrderCode());
        return "UniqueTee - Đơn hàng đã bị hủy" + (orderCode == null ? "" : " #" + orderCode);
    }

    private String buildOrderCancellationBody(String email, String customerName, Order order, String cancellationReason) {
        StringBuilder body = new StringBuilder();
        String recipientName = normalizeRecipientName(customerName, order);

        body.append("Xin chào ").append(recipientName).append(",\n\n");
        body.append("Đơn hàng của bạn đã được hủy. Dưới đây là thông tin chi tiết về đơn hàng và lý do hủy.\n\n");

        appendField(body, "Mã đơn hàng", order == null ? null : order.getOrderCode());
        appendField(body, "Khách hàng", normalizeText(customerName != null ? customerName : order == null ? null : order.getCustomerName()));
        appendField(body, "Số điện thoại", order == null ? null : order.getCustomerPhone());
        appendField(body, "Email nhận thông báo", email);
        appendField(body, "Địa chỉ giao hàng", formatAddress(order));
        appendField(body, "Trạng thái đơn hàng", resolveOrderStatusLabel(order == null ? null : order.getStatus()));
        if (order != null && order.getCancelledAt() != null) {
            appendField(body, "Thời gian hủy", ORDER_DATE_FORMAT.format(order.getCancelledAt()));
        }

        if (hasText(cancellationReason)) {
            appendField(body, "Lý do hủy", cancellationReason);
        }

        body.append("\nChi tiết đơn hàng:\n");
        List<OrderItem> items = order == null ? List.of() : order.getItems();
        if (items == null || items.isEmpty()) {
            body.append("- Không có chi tiết sản phẩm\n");
        } else {
            int index = 1;
            for (OrderItem item : items) {
                body.append(formatOrderItem(index++, item));
            }
        }

        body.append("\nTạm tính: ").append(formatMoney(order == null ? null : order.getSubtotal())).append('\n');
        body.append("Phí vận chuyển: ").append(formatMoney(order == null ? null : order.getShippingFee())).append('\n');
        body.append("Tổng cộng: ").append(formatMoney(order == null ? null : order.getTotal())).append("\n\n");
        body.append("Nếu bạn cần hỗ trợ thêm, vui lòng phản hồi lại email này hoặc liên hệ bộ phận chăm sóc khách hàng.");
        body.append("\n\nTrân trọng,\nUniqueTee Team");
        return body.toString();
    }

    private String buildOrderCancellationHtml(String email, String customerName, Order order, String cancellationReason) {
        String paymentMethod = normalizeText(order == null ? null : order.getPaymentMethod());
        String recipientName = normalizeRecipientName(customerName, order);
        String orderCode = normalizeText(order == null ? null : order.getOrderCode());
        String totalAmount = formatMoney(order == null ? null : order.getTotal());
        String headerTitle = "Đơn hàng đã bị hủy";
        String headerDescription = "Yêu cầu hủy đơn của bạn đã được ghi nhận. Dưới đây là thông tin chi tiết đơn hàng.";

        StringBuilder html = new StringBuilder();
        html.append("<!doctype html><html><body style=\"margin:0;padding:0;background:#fff1f7;\">");
        html.append("<div style=\"max-width:780px;margin:0 auto;padding:32px 18px 48px;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;color:#1f2937;\">");
        html.append("<div style=\"background:linear-gradient(135deg,#be185d 0%,#ec4899 55%,#fb7185 100%);border-radius:32px;overflow:hidden;box-shadow:0 22px 56px rgba(190,24,93,.24);border:1px solid rgba(244,114,182,.35);\">");
        html.append("<div style=\"padding:34px 38px 26px;color:#fff;\">");
        html.append("<div style=\"display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;\">UniqueTee</div>");
        html.append("<div style=\"margin-top:18px;font-size:30px;line-height:1.18;font-weight:800;\">"+escapeHtml(headerTitle)+"</div>");
        html.append("<div style=\"margin-top:12px;font-size:15px;line-height:1.8;max-width:560px;color:rgba(255,255,255,.94);\">"+escapeHtml(headerDescription)+"</div>");
        html.append("<div style=\"margin-top:18px;\">");
        html.append(buildHtmlBadge(resolvePaymentMethodLabel(paymentMethod), "rgba(255,255,255,.16)", "#ffffff"));
        html.append(buildHtmlBadge(resolveOrderStatusLabel(order == null ? null : order.getStatus()), "rgba(255,255,255,.16)", "#ffffff"));
        html.append("</div>");
        html.append("<div style=\"margin-top:22px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:22px;padding:18px 20px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;\"><tr>");
        html.append("<td style=\"width:50%;padding-right:14px;vertical-align:top;\">");
        html.append("<div style=\"font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,.86);\">Mã đơn hàng</div>");
        html.append("<div style=\"margin-top:8px;font-size:18px;line-height:1.35;font-weight:800;color:#fff;word-break:break-word;\">"+escapeHtml(hasText(orderCode) ? "#"+orderCode : "Chưa có mã")+"</div>");
        html.append("</td>");
        html.append("<td style=\"width:50%;padding-left:14px;vertical-align:top;text-align:right;\">");
        html.append("<div style=\"font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,.86);\">Tổng cộng</div>");
        html.append("<div style=\"margin-top:8px;font-size:24px;line-height:1.2;font-weight:900;color:#fff;\">"+escapeHtml(totalAmount)+"</div>");
        html.append("</td>");
        html.append("</tr></table>");
        html.append("</div>");
        html.append("</div>");

        html.append("<div style=\"background:#fff;border:1px solid rgba(236,72,153,.16);border-top:none;border-radius:0 0 32px 32px;padding:34px 38px 40px;\">");
        html.append("<p style=\"margin:0;font-size:16px;line-height:1.75;color:#1f2937;\">Xin chào <strong style=\"color:#be185d;\">"+escapeHtml(recipientName)+"</strong>.</p>");
        html.append("<p style=\"margin:12px 0 0;font-size:14px;line-height:1.8;color:#6b7280;max-width:620px;\">"+escapeHtml(headerDescription)+"</p>");

        html.append("<div style=\"margin-top:26px;border:1px solid #fbcfe8;border-radius:18px;overflow:hidden;background:#fff;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;background:#fff;\"><tbody>");
        appendHtmlField(html, "Mã đơn hàng", order == null ? null : order.getOrderCode());
        appendHtmlField(html, "Khách hàng", normalizeText(customerName != null ? customerName : order == null ? null : order.getCustomerName()));
        appendHtmlField(html, "Số điện thoại", order == null ? null : order.getCustomerPhone());
        appendHtmlField(html, "Email nhận thông báo", email);
        appendHtmlField(html, "Địa chỉ giao hàng", formatAddress(order));
        appendHtmlField(html, "Phương thức thanh toán", resolvePaymentMethodLabel(paymentMethod));
        appendHtmlField(html, "Trạng thái đơn hàng", resolveOrderStatusLabel(order == null ? null : order.getStatus()));
        if (order != null && order.getCancelledAt() != null) {
            appendHtmlField(html, "Thời gian hủy", ORDER_DATE_FORMAT.format(order.getCancelledAt()));
        }
        if (hasText(cancellationReason)) {
            appendHtmlField(html, "Lý do hủy", cancellationReason);
        }
        String note = order == null ? null : order.getNote();
        if (hasText(note)) {
            appendHtmlField(html, "Ghi chú", note);
        }
        html.append("</tbody></table></div>");

        html.append("<div style=\"margin-top:28px;\">");
        html.append("<div style=\"font-size:17px;font-weight:800;color:#be185d;margin-bottom:12px;letter-spacing:-.2px;\">Chi tiết đơn hàng</div>");
        html.append("<div style=\"border:1px solid #fbcfe8;border-radius:18px;overflow:hidden;background:#fff;\">");
        html.append("<div style=\"overflow-x:auto;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;min-width:540px;background:#fff;\">");
        html.append("<thead><tr style=\"background:#fdf2f8;color:#be185d;font-size:12px;text-transform:uppercase;letter-spacing:.5px;\">");
        html.append("<th style=\"padding:14px 16px;text-align:left;\">Sản phẩm</th>");
        html.append("<th style=\"padding:14px 16px;text-align:center;width:72px;\">SL</th>");
        html.append("<th style=\"padding:14px 16px;text-align:right;width:140px;\">Đơn giá</th>");
        html.append("<th style=\"padding:14px 16px;text-align:right;width:150px;\">Thành tiền</th>");
        html.append("</tr></thead><tbody>");

        List<OrderItem> items2 = order == null ? List.of() : order.getItems();
        if (items2 == null || items2.isEmpty()) {
            html.append("<tr><td colspan=\"4\" style=\"padding:20px 16px;border-top:1px solid #fce7f3;color:#64748b;\">Không có chi tiết sản phẩm</td></tr>");
        } else {
            for (OrderItem item : items2) {
                appendHtmlItemRow(html, item);
            }
        }
        html.append("</tbody></table></div></div></div>");

        html.append("<div style=\"margin-top:22px;background:#fff7fb;border:1px solid #fbcfe8;border-radius:22px;padding:18px 20px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;\"><tbody>");
        appendHtmlTotalRow(html, "Tạm tính", order == null ? null : order.getSubtotal(), false);
        appendHtmlTotalRow(html, "Phí vận chuyển", order == null ? null : order.getShippingFee(), false);
        appendHtmlTotalRow(html, "Tổng cộng", order == null ? null : order.getTotal(), true);
        html.append("</tbody></table></div>");

        html.append("<div style=\"margin-top:20px;padding-top:18px;border-top:1px solid #fbcfe8;font-size:13px;line-height:1.8;color:#7c3aed;\">");
        html.append("Nếu bạn cần hỗ trợ, bạn có thể phản hồi trực tiếp email này.");
        html.append("</div>");

        html.append("</div></div></body></html>");
        return html.toString();
    }

    private String buildOrderConfirmationSubject(Order order) {
        String orderCode = normalizeText(order == null ? null : order.getOrderCode());
        String paymentMethod = normalizeText(order == null ? null : order.getPaymentMethod());

        if ("vnpay".equalsIgnoreCase(paymentMethod)) {
            return "UniqueTee - Thanh toán VNPay thành công" + (orderCode == null ? "" : " #" + orderCode);
        }

        if ("cod".equalsIgnoreCase(paymentMethod)) {
            return "UniqueTee - Đơn hàng COD đã được xác nhận" + (orderCode == null ? "" : " #" + orderCode);
        }

        return "UniqueTee - Xác nhận đơn hàng" + (orderCode == null ? "" : " #" + orderCode);
    }

    private String buildOrderConfirmationBody(String email, String customerName, Order order) {
        StringBuilder body = new StringBuilder();
        String recipientName = normalizeRecipientName(customerName, order);

        body.append("Xin chào ").append(recipientName).append(",\n\n");

        if (order != null && "vnpay".equalsIgnoreCase(normalizeText(order.getPaymentMethod()))) {
            body.append("Thanh toán qua VNPay của bạn đã thành công.\n");
            body.append("Đơn hàng đang được xử lý để chuẩn bị giao.\n\n");
        } else {
            body.append("Đơn hàng của bạn đã được ghi nhận thành công.\n");
            body.append("Chúng tôi sẽ tiến hành xử lý và chuẩn bị giao hàng.\n\n");
        }

        appendField(body, "Mã đơn hàng", order == null ? null : order.getOrderCode());
        appendField(body, "Khách hàng", normalizeText(customerName != null ? customerName : order == null ? null : order.getCustomerName()));
        appendField(body, "Số điện thoại", order == null ? null : order.getCustomerPhone());
        appendField(body, "Email nhận thông báo", email);
        appendField(body, "Địa chỉ giao hàng", formatAddress(order));
        appendField(body, "Phương thức thanh toán", resolvePaymentMethodLabel(order == null ? null : order.getPaymentMethod()));
        appendField(body, "Trạng thái đơn hàng", resolveOrderStatusLabel(order == null ? null : order.getStatus()));

        if (order != null && order.getCreatedAt() != null) {
            appendField(body, "Thời gian đặt", ORDER_DATE_FORMAT.format(order.getCreatedAt()));
        }

        String note = order == null ? null : order.getNote();
        if (hasText(note)) {
            appendField(body, "Ghi chú", note);
        }

        body.append("\nChi tiết đơn hàng:\n");
        List<OrderItem> items = order == null ? List.of() : order.getItems();
        if (items == null || items.isEmpty()) {
            body.append("- Không có chi tiết sản phẩm\n");
        } else {
            int index = 1;
            for (OrderItem item : items) {
                body.append(formatOrderItem(index++, item));
            }
        }

        body.append("\nTạm tính: ").append(formatMoney(order == null ? null : order.getSubtotal())).append('\n');
        body.append("Phí vận chuyển: ").append(formatMoney(order == null ? null : order.getShippingFee())).append('\n');
        body.append("Tổng cộng: ").append(formatMoney(order == null ? null : order.getTotal())).append("\n\n");
        body.append("Cảm ơn bạn đã mua sắm tại UniqueTee.\n");
        body.append("Trân trọng,\n");
        body.append("UniqueTee Team");
        return body.toString();
    }

    private String buildOrderConfirmationHtml(String email, String customerName, Order order) {
        String paymentMethod = normalizeText(order == null ? null : order.getPaymentMethod());
        String recipientName = normalizeRecipientName(customerName, order);
        String orderCode = normalizeText(order == null ? null : order.getOrderCode());
        String totalAmount = formatMoney(order == null ? null : order.getTotal());
        String headerTitle = "vnpay".equalsIgnoreCase(paymentMethod)
                ? "Thanh toán thành công"
                : "Đơn hàng đã được xác nhận";
        String headerDescription = "vnpay".equalsIgnoreCase(paymentMethod)
                ? "Chúng tôi đã nhận được thanh toán của bạn và đang chuẩn bị đơn hàng để giao sớm nhất."
                : "Đơn hàng của bạn đã được ghi nhận và chúng tôi sẽ bắt đầu xử lý ngay.";

        StringBuilder html = new StringBuilder();
        html.append("<!doctype html><html><body style=\"margin:0;padding:0;background:#fff1f7;\">");
        html.append("<div style=\"max-width:780px;margin:0 auto;padding:32px 18px 48px;font-family:'Plus Jakarta Sans','Segoe UI',Arial,sans-serif;color:#1f2937;\">");
        html.append("<div style=\"background:linear-gradient(135deg,#be185d 0%,#ec4899 55%,#fb7185 100%);border-radius:32px;overflow:hidden;box-shadow:0 22px 56px rgba(190,24,93,.24);border:1px solid rgba(244,114,182,.35);\">");
        html.append("<div style=\"padding:34px 38px 26px;color:#fff;\">");
        html.append("<div style=\"display:inline-block;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.16);font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;\">UniqueTee</div>");
        html.append("<div style=\"margin-top:18px;font-size:30px;line-height:1.18;font-weight:800;\">").append(escapeHtml(headerTitle)).append("</div>");
        html.append("<div style=\"margin-top:12px;font-size:15px;line-height:1.8;max-width:560px;color:rgba(255,255,255,.94);\">").append(escapeHtml(headerDescription)).append("</div>");
        html.append("<div style=\"margin-top:18px;\">");
        html.append(buildHtmlBadge(resolvePaymentMethodLabel(paymentMethod), "rgba(255,255,255,.16)", "#ffffff"));
        html.append(buildHtmlBadge(resolveOrderStatusLabel(order == null ? null : order.getStatus()), "rgba(255,255,255,.16)", "#ffffff"));
        html.append("</div>");
        html.append("<div style=\"margin-top:22px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:22px;padding:18px 20px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;\"><tr>");
        html.append("<td style=\"width:50%;padding-right:14px;vertical-align:top;\">");
        html.append("<div style=\"font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,.86);\">Mã đơn hàng</div>");
        html.append("<div style=\"margin-top:8px;font-size:18px;line-height:1.35;font-weight:800;color:#fff;word-break:break-word;\">").append(escapeHtml(hasText(orderCode) ? "#" + orderCode : "Chưa có mã")).append("</div>");
        html.append("</td>");
        html.append("<td style=\"width:50%;padding-left:14px;vertical-align:top;text-align:right;\">");
        html.append("<div style=\"font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:rgba(255,255,255,.86);\">Tổng cộng</div>");
        html.append("<div style=\"margin-top:8px;font-size:24px;line-height:1.2;font-weight:900;color:#fff;\">").append(escapeHtml(totalAmount)).append("</div>");
        html.append("</td>");
        html.append("</tr></table>");
        html.append("</div>");
        html.append("</div>");

        html.append("<div style=\"background:#fff;border:1px solid rgba(236,72,153,.16);border-top:none;border-radius:0 0 32px 32px;padding:34px 38px 40px;\">");
        html.append("<p style=\"margin:0;font-size:16px;line-height:1.75;color:#1f2937;\">Xin chào <strong style=\"color:#be185d;\">").append(escapeHtml(recipientName)).append("</strong>.</p>");
        html.append("<p style=\"margin:12px 0 0;font-size:14px;line-height:1.8;color:#6b7280;max-width:620px;\">").append(escapeHtml(headerDescription)).append("</p>");

        html.append("<div style=\"margin-top:26px;border:1px solid #fbcfe8;border-radius:18px;overflow:hidden;background:#fff;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;background:#fff;\"><tbody>");
        appendHtmlField(html, "Mã đơn hàng", order == null ? null : order.getOrderCode());
        appendHtmlField(html, "Khách hàng", normalizeText(customerName != null ? customerName : order == null ? null : order.getCustomerName()));
        appendHtmlField(html, "Số điện thoại", order == null ? null : order.getCustomerPhone());
        appendHtmlField(html, "Email nhận thông báo", email);
        appendHtmlField(html, "Địa chỉ giao hàng", formatAddress(order));
        appendHtmlField(html, "Phương thức thanh toán", resolvePaymentMethodLabel(paymentMethod));
        appendHtmlField(html, "Trạng thái đơn hàng", resolveOrderStatusLabel(order == null ? null : order.getStatus()));
        if (order != null && order.getCreatedAt() != null) {
            appendHtmlField(html, "Thời gian đặt", ORDER_DATE_FORMAT.format(order.getCreatedAt()));
        }
        String note = order == null ? null : order.getNote();
        if (hasText(note)) {
            appendHtmlField(html, "Ghi chú", note);
        }
        html.append("</tbody></table></div>");

        html.append("<div style=\"margin-top:28px;\">");
        html.append("<div style=\"font-size:17px;font-weight:800;color:#be185d;margin-bottom:12px;letter-spacing:-.2px;\">Chi tiết đơn hàng</div>");
        html.append("<div style=\"border:1px solid #fbcfe8;border-radius:18px;overflow:hidden;background:#fff;\">");
        html.append("<div style=\"overflow-x:auto;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;min-width:540px;background:#fff;\">");
        html.append("<thead><tr style=\"background:#fdf2f8;color:#be185d;font-size:12px;text-transform:uppercase;letter-spacing:.5px;\">");
        html.append("<th style=\"padding:14px 16px;text-align:left;\">Sản phẩm</th>");
        html.append("<th style=\"padding:14px 16px;text-align:center;width:72px;\">SL</th>");
        html.append("<th style=\"padding:14px 16px;text-align:right;width:140px;\">Đơn giá</th>");
        html.append("<th style=\"padding:14px 16px;text-align:right;width:150px;\">Thành tiền</th>");
        html.append("</tr></thead><tbody>");

        List<OrderItem> items = order == null ? List.of() : order.getItems();
        if (items == null || items.isEmpty()) {
            html.append("<tr><td colspan=\"4\" style=\"padding:20px 16px;border-top:1px solid #fce7f3;color:#64748b;\">Không có chi tiết sản phẩm</td></tr>");
        } else {
            for (OrderItem item : items) {
                appendHtmlItemRow(html, item);
            }
        }
        html.append("</tbody></table></div></div></div>");

        html.append("<div style=\"margin-top:22px;background:#fff7fb;border:1px solid #fbcfe8;border-radius:22px;padding:18px 20px;\">");
        html.append("<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;\"><tbody>");
        appendHtmlTotalRow(html, "Tạm tính", order == null ? null : order.getSubtotal(), false);
        appendHtmlTotalRow(html, "Phí vận chuyển", order == null ? null : order.getShippingFee(), false);
        appendHtmlTotalRow(html, "Tổng cộng", order == null ? null : order.getTotal(), true);
        html.append("</tbody></table></div>");

        html.append("<div style=\"margin-top:20px;padding-top:18px;border-top:1px solid #fbcfe8;font-size:13px;line-height:1.8;color:#7c3aed;\">");
        html.append("Cảm ơn bạn đã mua sắm tại UniqueTee. Nếu cần hỗ trợ, bạn có thể phản hồi trực tiếp email này.");
        html.append("</div>");

        html.append("</div></div></body></html>");
        return html.toString();
    }

    private String formatOrderItem(int index, OrderItem item) {
        if (item == null) {
            return "- Sản phẩm #" + index + ": không có thông tin\n";
        }

        StringBuilder line = new StringBuilder();
        String productName = normalizeText(item.getProductName());
        line.append(index).append(". ").append(productName == null ? "Sản phẩm" : productName);

        String color = normalizeText(item.getColor());
        String size = normalizeText(item.getSize());
        if (hasText(color)) {
            line.append(" | Màu: ").append(color);
        }
        if (hasText(size)) {
            line.append(" | Size: ").append(size);
        }

        String quantityText = item.getQty() == null ? "1" : item.getQty().toString();
        line.append("\n   Số lượng: ").append(quantityText);
        line.append(" | Đơn giá: ").append(formatMoney(item.getUnitPrice()));
        line.append(" | Thành tiền: ").append(formatMoney(item.getSubtotal()));
        line.append('\n');
        return line.toString();
    }

    private void appendHtmlField(StringBuilder html, String label, String value) {
        if (!hasText(value)) {
            return;
        }

        html.append("<tr>");
        html.append("<td style=\"padding:13px 16px;border-top:1px solid #fce7f3;background:#fff7fb;color:#be185d;width:38%;vertical-align:top;font-weight:700;\">")
                .append(escapeHtml(label))
                .append("</td>");
        html.append("<td style=\"padding:13px 16px;border-top:1px solid #fce7f3;background:#fff;font-weight:600;color:#0f172a;vertical-align:top;\">")
                .append(escapeHtml(value))
                .append("</td>");
        html.append("</tr>");
    }

    private void appendHtmlItemRow(StringBuilder html, OrderItem item) {
        if (item == null) {
            return;
        }

        String productName = normalizeText(item.getProductName());
        String itemMeta = buildItemMeta(item);
        String quantityText = item.getQty() == null ? "1" : item.getQty().toString();

        html.append("<tr>");
        html.append("<td style=\"padding:16px 16px;border-top:1px solid #fce7f3;vertical-align:top;\">");
        html.append("<div style=\"font-size:14px;font-weight:700;color:#be185d;line-height:1.45;\">")
                .append(escapeHtml(productName == null ? "Sản phẩm" : productName))
                .append("</div>");
        if (hasText(itemMeta)) {
            html.append("<div style=\"margin-top:4px;font-size:12px;color:#9d174d;line-height:1.5;\">")
                    .append(escapeHtml(itemMeta))
                    .append("</div>");
        }
        html.append("</td>");
        html.append("<td style=\"padding:16px 16px;border-top:1px solid #fce7f3;text-align:center;vertical-align:top;color:#0f172a;\">")
                .append(escapeHtml(quantityText))
                .append("</td>");
        html.append("<td style=\"padding:16px 16px;border-top:1px solid #fce7f3;text-align:right;vertical-align:top;color:#0f172a;\">")
                .append(escapeHtml(formatMoney(item.getUnitPrice())))
                .append("</td>");
        html.append("<td style=\"padding:16px 16px;border-top:1px solid #fce7f3;text-align:right;vertical-align:top;font-weight:800;color:#be185d;\">")
                .append(escapeHtml(formatMoney(item.getSubtotal())))
                .append("</td>");
        html.append("</tr>");
    }

    private void appendHtmlTotalRow(StringBuilder html, String label, BigDecimal amount, boolean emphasized) {
        html.append("<tr>");
        html.append("<td style=\"padding:9px 0;color:")
            .append(emphasized ? "#be185d;font-size:18px;font-weight:800;" : "#6b7280;font-size:14px;font-weight:600;")
                .append("\">")
                .append(escapeHtml(label))
                .append("</td>");
        html.append("<td style=\"padding:9px 0;text-align:right;color:")
            .append(emphasized ? "#be185d;font-size:18px;font-weight:900;" : "#111827;font-size:14px;font-weight:700;")
                .append("\">")
                .append(escapeHtml(formatMoney(amount)))
                .append("</td>");
        html.append("</tr>");
    }

    private String buildHtmlBadge(String label, String backgroundColor, String textColor) {
        if (!hasText(label)) {
            return "";
        }

        return "<span style=\"display:inline-block;margin:0 8px 8px 0;padding:8px 12px;border-radius:999px;background:"
                + backgroundColor
                + ";color:"
                + textColor
                + ";font-size:12px;font-weight:700;\">"
                + escapeHtml(label)
                + "</span>";
    }

    private String buildItemMeta(OrderItem item) {
        List<String> parts = new ArrayList<>();
        addItemMetaPart(parts, "Màu: ", item == null ? null : item.getColor());
        addItemMetaPart(parts, "Size: ", item == null ? null : item.getSize());
        addItemMetaPart(parts, "SKU: ", item == null ? null : item.getProductSku());
        return parts.isEmpty() ? null : String.join(" • ", parts);
    }

    private void addItemMetaPart(List<String> parts, String prefix, String value) {
        if (hasText(value)) {
            parts.add(prefix + normalizeText(value));
        }
    }

    private void appendField(StringBuilder body, String label, String value) {
        if (!hasText(value)) {
            return;
        }

        body.append(label).append(": ").append(value.trim()).append('\n');
    }

    private String formatAddress(Order order) {
        if (order == null) {
            return null;
        }

        StringBuilder address = new StringBuilder();
        appendAddressPart(address, order.getAddress());
        appendAddressPart(address, order.getWard());
        appendAddressPart(address, order.getDistrict());
        appendAddressPart(address, order.getCity());
        return address.length() == 0 ? null : address.toString();
    }

    private void appendAddressPart(StringBuilder address, String value) {
        String normalized = normalizeText(value);
        if (!hasText(normalized)) {
            return;
        }

        if (address.length() > 0) {
            address.append(", ");
        }
        address.append(normalized);
    }

    private String resolvePaymentMethodLabel(String paymentMethod) {
        String normalized = normalizeText(paymentMethod);
        if (!hasText(normalized)) {
            return null;
        }

        return switch (normalized.toLowerCase()) {
            case "cod" -> "Thanh toán khi nhận hàng (COD)";
            case "vnpay" -> "VNPay";
            case "momo" -> "MoMo";
            case "card" -> "Thẻ ngân hàng";
            default -> normalized;
        };
    }

    private String resolveOrderStatusLabel(String status) {
        String normalized = normalizeText(status);
        if (!hasText(normalized)) {
            return null;
        }

        return switch (normalized.toLowerCase()) {
            case "pending" -> "Đang chờ xác nhận";
            case "processing" -> "Đang xử lý";
            case "delivered" -> "Đã giao hàng";
            case "cancelled" -> "Đã hủy";
            default -> normalized;
        };
    }

    private String normalizeRecipientName(String customerName, Order order) {
        String resolvedName = normalizeText(customerName != null ? customerName : order == null ? null : order.getCustomerName());
        return hasText(resolvedName) ? resolvedName : "bạn";
    }

    private String formatMoney(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        formatter.setMaximumFractionDigits(0);
        BigDecimal safeAmount = amount == null ? BigDecimal.ZERO : amount;
        return formatter.format(safeAmount);
    }

    private String escapeHtml(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }

    private String normalizeText(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
