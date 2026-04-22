package com.spotitfixit.core_backend.controllers;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotitfixit.core_backend.models.AppUser;
import com.spotitfixit.core_backend.repositories.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    // --- NEW: Bulletproof DTO to prevent 400/500 parsing errors ---
    public static class AuthRequest {
        public String username;
        public String password;
        public String role;
        public String aadhaar;
        public String departmentAccess;
        public String email;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest payload) {
        if (userRepository.findByUsername(payload.username).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists.");
        }
        
        AppUser newUser = new AppUser();
        newUser.setUsername(payload.username);
        newUser.setPassword(payload.password);
        newUser.setRole(payload.role);

        // Generates the Secure Mask
        if ("citizen".equals(payload.role)) {
            String aadhaar = (payload.aadhaar != null && !payload.aadhaar.isEmpty()) ? payload.aadhaar : "000000000000";
            String secureMask = "CTZ-" + Math.abs(aadhaar.hashCode());
            newUser.setUserMask(secureMask);
            newUser.setDepartmentAccess("NONE");
            newUser.setEmail(payload.email); // Store email for confirmation notifications
        } else {
            newUser.setDepartmentAccess(payload.departmentAccess != null ? payload.departmentAccess : "ALL");
        }

        return ResponseEntity.ok(userRepository.save(newUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest payload) {
        Optional<AppUser> existingUser = userRepository.findByUsername(payload.username);
        if (existingUser.isEmpty() || !existingUser.get().getPassword().equals(payload.password) || !existingUser.get().getRole().equals(payload.role)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials or clearance level.");
        }
        return ResponseEntity.ok(existingUser.get());
    }
}