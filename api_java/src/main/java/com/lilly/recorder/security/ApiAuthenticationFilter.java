package com.lilly.recorder.security;

import com.lilly.recorder.service.ApiKeyService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class ApiAuthenticationFilter extends OncePerRequestFilter {
    private static final List<String> EXEMPT_PREFIXES = List.of("/health", "/swagger", "/v3/api-docs", "/webhook");

    private final ApiKeyService apiKeyService;
    private final JwtService jwtService;

    public ApiAuthenticationFilter(ApiKeyService apiKeyService, JwtService jwtService) {
        this.apiKeyService = apiKeyService;
        this.jwtService = jwtService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return EXEMPT_PREFIXES.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        boolean authenticated = false;
        String principal = "api-client";

        try {
            principal = jwtService.parse(token).getSubject();
            authenticated = true;
        } catch (JwtException ignored) {
            authenticated = apiKeyService.validateKey(token);
            if (authenticated) {
                principal = "api-key";
            }
        }

        if (!authenticated) {
            filterChain.doFilter(request, response);
            return;
        }

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_API"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
