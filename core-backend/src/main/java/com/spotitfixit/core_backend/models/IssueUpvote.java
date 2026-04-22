package com.spotitfixit.core_backend.models;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Tracks WHO upvoted which issue.
 * Used to build the email list for community confirmation.
 * Unique constraint prevents the same user from upvoting twice.
 */
@Entity
@Table(name = "issue_upvotes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"issue_id", "username"}))
public class IssueUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String issueId;
    private String username;
    private String email; // snapshot of email at vote time
    private LocalDateTime votedAt = LocalDateTime.now();

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIssueId() { return issueId; }
    public void setIssueId(String issueId) { this.issueId = issueId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getVotedAt() { return votedAt; }
    public void setVotedAt(LocalDateTime votedAt) { this.votedAt = votedAt; }
}
