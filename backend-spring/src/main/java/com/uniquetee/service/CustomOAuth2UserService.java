package com.uniquetee.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.User;
import com.uniquetee.repository.UserRepository;

/**
 * Service để xử lý OAuth2 user creation/linking từ Facebook & Google
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        logger.debug("=== CustomOAuth2UserService.loadUser() called ===");
        
        try {
            // Lấy OAuth2User từ provider (Google/Facebook)
            OAuth2User oAuth2User = super.loadUser(userRequest);
            logger.debug("OAuth2User loaded from provider: {}", oAuth2User.getAttributes());

            // Lấy provider name (google hoặc facebook)
            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            logger.debug("Provider: {}", registrationId);
            
            // Log client registration details
            logger.debug("Client ID: {}", userRequest.getClientRegistration().getClientId());
            logger.debug("Redirect URI: {}", userRequest.getClientRegistration().getRedirectUri());

            // Xử lý theo provider
            if ("google".equals(registrationId)) {
                logger.debug("Processing Google user...");
                return processGoogleUser(oAuth2User);
            } else if ("facebook".equals(registrationId)) {
                logger.debug("Processing Facebook user...");
                return processFacebookUser(oAuth2User);
            }

            logger.warn("Unknown registration ID: {}", registrationId);
            return oAuth2User;
        } catch (OAuth2AuthenticationException ex) {
            logger.error("OAuth2AuthenticationException occurred", ex);
            logger.error("Exception message: {}", ex.getMessage());
            logger.error("OAuth2 Error: {}", ex.getError());
            throw ex;
        } catch (Exception ex) {
            logger.error("OAuth2 user loading failed", ex);
            logger.error("Exception message: {}", ex.getMessage());
            logger.error("Exception cause: {}", ex.getCause());
            logger.error("Exception stack trace:", ex);
            
            // Throw more informative error
            throw new OAuth2AuthenticationException(
                new org.springframework.security.oauth2.core.OAuth2Error("oauth2_user_processing_failed"),
                "Error processing OAuth2 user: " + ex.getMessage(),
                ex
            );
        }
    }

    /**
     * Process Google OAuth2 user
     */
    private OAuth2User processGoogleUser(OAuth2User oAuth2User) {
        logger.debug("=== processGoogleUser() called ===");
        
        Map<String, Object> attributes = oAuth2User.getAttributes();
        logger.debug("Google attributes: {}", attributes.keySet());

        // Lấy thông tin từ Google
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        
        // Log details for debugging
        logger.debug("Google user - email: {}, name: {}, picture: {}", email, name, picture);
        
        // Validate required fields
        if (email == null || email.trim().isEmpty()) {
            logger.error("Google email is null or empty. Available attributes: {}", attributes.keySet());
            throw new RuntimeException("Google account không có email. Attributes nhận được: " + attributes.keySet());
        }
        
        // Use email as fallback for name if not provided
        if (name == null || name.trim().isEmpty()) {
            name = email.substring(0, email.indexOf("@"));
            logger.debug("Name was null, using email prefix: {}", name);
        }

        try {
            // Kiểm tra user đã tồn tại chưa
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                logger.debug("User already exists with email: {}", email);
                user = existingUser.get();
            } else {
                logger.debug("Creating new user for email: {}", email);
                // Tạo user mới từ Google info
                user = new User();
                user.setEmail(email);
                user.setName(name != null ? name : email);
                user.setPassword("OAUTH2_GOOGLE_" + System.currentTimeMillis()); // Dummy password
                user.setRole("customer");
                user.setStatus("active");
                user.setAvatar(extractInitials(name));

                // Lưu user vào DB
                user = userRepository.save(user);
                logger.debug("User created with ID: {}", user.getId());
            }

            // Tạo HashMap mới vì attributes là UnmodifiableMap
            Map<String, Object> modifiableAttributes = new HashMap<>(attributes);
            modifiableAttributes.put("userId", user.getId());
            logger.debug("Final attributes - userId: {}, email: {}", user.getId(), email);

            return new DefaultOAuth2User(
                    oAuth2User.getAuthorities(),
                    modifiableAttributes,
                    "email"
            );
        } catch (Exception ex) {
            logger.error("Error processing Google user", ex);
            throw new RuntimeException("Error processing Google user: " + ex.getMessage(), ex);
        }
    }

    /**
     * Process Facebook OAuth2 user
     */
    private OAuth2User processFacebookUser(OAuth2User oAuth2User) {
        logger.debug("=== processFacebookUser() called ===");
        
        Map<String, Object> attributes = oAuth2User.getAttributes();
        logger.debug("Facebook attributes: {}", attributes.keySet());

        try {
            // Lấy thông tin từ Facebook
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String facebookId = (String) attributes.get("id");
            
            logger.debug("Facebook user - email: {}, name: {}, facebookId: {}", email, name, facebookId);

            // Validate facebookId exists
            if (facebookId == null || facebookId.trim().isEmpty()) {
                logger.error("Facebook ID is null or empty!");
                throw new RuntimeException("Facebook account không có ID");
            }

            // Nếu Facebook không trả về email, dùng facebookId + domain tạm
            if (email == null || email.isEmpty()) {
                email = "facebook_" + facebookId + "@sociallogin.local";
                logger.debug("Facebook email was null, using: {}", email);
            }

            // Kiểm tra user đã tồn tại chưa
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;

            if (existingUser.isPresent()) {
                // User đã tồn tại, không cần tạo mới
                logger.debug("User already exists with email: {}", email);
                user = existingUser.get();
            } else {
                // Tạo user mới từ Facebook info
                logger.debug("Creating new user for email: {}", email);
                user = new User();
                user.setEmail(email);
                user.setName(name != null ? name : facebookId);
                user.setPassword("OAUTH2_FACEBOOK_" + facebookId); // Dummy password
                user.setRole("customer");
                user.setStatus("active");
                user.setAvatar(extractInitials(name));

                // Lưu user vào DB
                user = userRepository.save(user);
                logger.debug("User created with ID: {}", user.getId());
            }

            // Tạo HashMap mới vì attributes là UnmodifiableMap
            Map<String, Object> modifiableAttributes = new HashMap<>(attributes);
            modifiableAttributes.put("userId", user.getId());
            modifiableAttributes.put("email", email);

            return new DefaultOAuth2User(
                    oAuth2User.getAuthorities(),
                    modifiableAttributes,
                    "id"
            );
        } catch (Exception ex) {
            logger.error("Error processing Facebook user", ex);
            throw new RuntimeException("Error processing Facebook user: " + ex.getMessage(), ex);
        }
    }

    /**
     * Helper method để lấy chữ cái đầu tiên của tên
     */
    private String extractInitials(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "U";
        }
        String[] parts = name.trim().split("\\s+");
        return parts[0].substring(0, 1).toUpperCase();
    }
}
