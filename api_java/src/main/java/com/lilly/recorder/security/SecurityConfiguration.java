package com.lilly.recorder.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import jakarta.servlet.http.HttpServletRequest;

@Configuration
@EnableMethodSecurity
public class SecurityConfiguration {
    private final ApiAuthenticationFilter apiAuthenticationFilter;
    private final BearerTokenResolver defaultBearerTokenResolver = new DefaultBearerTokenResolver();

    public SecurityConfiguration(ApiAuthenticationFilter apiAuthenticationFilter) {
        this.apiAuthenticationFilter = apiAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/swagger/**", "/v3/api-docs/**", "/webhook/**", "/meetings/**").permitAll()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(apiAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2ResourceServer(oauth -> oauth
                        .bearerTokenResolver(this::resolveBearerToken)
                        .jwt(Customizer.withDefaults()));
        return http.build();
    }

    private String resolveBearerToken(HttpServletRequest request) {
        if (isPublicMeetingRequest(request)) return null;
        return defaultBearerTokenResolver.resolve(request);
    }

    private boolean isPublicMeetingRequest(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/meetings")) return false;
        if (path.equals("/meetings") && ("GET".equals(request.getMethod()) || "POST".equals(request.getMethod()))) return true;
        if (!path.equals("/meetings/mine") && path.matches("/meetings/[^/]+") && "GET".equals(request.getMethod())) return true;
        return path.matches("/meetings/[^/]+/end") && "POST".equals(request.getMethod());
    }
}
