package com.uniquetee.config;

import com.uniquetee.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

    @Autowired(required = false)
    private CustomOAuth2UserService customOAuth2UserService;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable() // Disable CSRF for stateless API
                .cors() // Enable CORS
                .and()
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/api/users/login", "/api/users/register").permitAll()
                        .requestMatchers("/api/users/oauth2/**").permitAll()
                        .requestMatchers("/api/products/**", "/api/categories/**").permitAll()
                        .requestMatchers("/login/oauth2/**").permitAll()
                        .anyRequest().permitAll() // Allow all for now, can be restricted later
                )
                .httpBasic().disable()
                .oauth2Login()
                    .userInfoEndpoint()
                        .userService(customOAuth2UserService)
                    .and()
                    .successHandler((request, response, authentication) -> {
                        // Handle OAuth2 success - redirect to frontend with token
                        Object principal = authentication.getPrincipal();
                        if (principal instanceof OAuth2User) {
                            OAuth2User oAuth2User = (OAuth2User) principal;
                            String userId = oAuth2User.getAttribute("userId") != null 
                                ? oAuth2User.getAttribute("userId").toString() 
                                : "0";
                            String email = oAuth2User.getAttribute("email") != null 
                                ? oAuth2User.getAttribute("email").toString() 
                                : "";
                            
                            // Redirect to frontend with token generation endpoint
                            response.sendRedirect("http://localhost:5176/oauth2-callback?userId=" + userId + "&email=" + 
                                    java.net.URLEncoder.encode(email, "UTF-8"));
                        }
                    })
                    .failureHandler((request, response, exception) -> {
                        // Handle OAuth2 failure - redirect to frontend with error
                        exception.printStackTrace(); // Log error for debugging
                        String errorMessage = exception.getMessage() != null ? exception.getMessage() : "OAuth2 login failed";
                        
                        // Get root cause if available
                        if (exception.getCause() != null) {
                            errorMessage = exception.getCause().getMessage();
                        }
                        
                        response.sendRedirect("http://localhost:5176/login?error=" + 
                                java.net.URLEncoder.encode(errorMessage, "UTF-8"));
                    });

        return http.build();
    }
}
