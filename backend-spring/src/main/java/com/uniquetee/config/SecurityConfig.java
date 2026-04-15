package com.uniquetee.config;

import com.uniquetee.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired(required = false)
    private CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/api/users/login", "/api/users/register").permitAll()
                        .requestMatchers("/api/users/oauth2/**").permitAll()
                        .requestMatchers("/api/products/**", "/api/categories/**").permitAll()
                        .requestMatchers("/api/login/oauth2/**").permitAll()
                        .requestMatchers("/login/oauth2/**").permitAll()
                        .anyRequest().permitAll() // Allow all for now, can be restricted later
                )
                .httpBasic(AbstractHttpConfigurer::disable)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2Login(oauth2 -> oauth2
                    .authorizationEndpoint(authorization -> authorization.baseUri("/login/oauth2/authorization"))
                    .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                    .successHandler((request, response, authentication) -> {
                        // Frontend will call the backend callback using the active OAuth2 session.
                        response.sendRedirect("http://localhost:5176/oauth2-callback");
                    })
                    .failureHandler((request, response, exception) -> {
                        // Handle OAuth2 failure - redirect to frontend with error
                        System.err.println("OAuth2 login failed: " + exception.getMessage());
                        String errorMessage = exception.getMessage() != null ? exception.getMessage() : "OAuth2 login failed";
                        
                        // Get root cause if available
                        if (exception.getCause() != null) {
                            errorMessage = exception.getCause().getMessage();
                        }
                        
                        response.sendRedirect("http://localhost:5176/login?error=" + 
                                java.net.URLEncoder.encode(errorMessage, "UTF-8"));
                    }));

        return http.build();
    }
}
