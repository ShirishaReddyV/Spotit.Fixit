package com.spotitfixit.core_backend.models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * One row per person notified about a resolution.
 * 'confirmed' = true (fixed), false (not fixed), null (no response yet).
 * 'token' is a UUID sent in the email link — prevents tampering.
 */
@Entity
@Table(name = "confirmation_votes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"issueId", "username"}))
public class ConfirmationVote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String issueId;
    private String username;
    private String email;
    private String token; // UUID embedded in the email link

    private Boolean confirmed; // null = no response, true = confirmed, false = denied
    private LocalDateTime respondedAt;
    private LocalDateTime sentAt = LocalDateTime.now();
    private LocalDateTime expiresAt; // 7 days from sent

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIssueId() { return issueId; }
    public void setIssueId(String issueId) { this.issueId = issueId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Boolean getConfirmed() { return confirmed; }
    public void setConfirmed(Boolean confirmed) { this.confirmed = confirmed; }
    public LocalDateTime getRespondedAt() { return respondedAt; }
    public void setRespondedAt(LocalDateTime respondedAt) { this.respondedAt = respondedAt; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
