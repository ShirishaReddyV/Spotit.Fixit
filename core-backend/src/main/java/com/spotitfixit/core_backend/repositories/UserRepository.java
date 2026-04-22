package com.spotitfixit.core_backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spotitfixit.core_backend.models.AppUser;

@Repository
public interface UserRepository extends JpaRepository<AppUser, String> {
    // This magical Spring Boot command automatically writes the SQL to find a user by their username
    Optional<AppUser> findByUsername(String username);
}