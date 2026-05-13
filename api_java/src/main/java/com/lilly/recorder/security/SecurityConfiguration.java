package com.lilly.recorder.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfiguration {
    private final ApiAuthenticationFilter apiAuthenticationFilter;

    public SecurityConfiguration(ApiAuthenticationFilter apiAuthenticationFilter) {
        this.apiAuthenticationFilter = apiAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/swagger/**", "/v3/api-docs/**", "/webhook/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(apiAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
