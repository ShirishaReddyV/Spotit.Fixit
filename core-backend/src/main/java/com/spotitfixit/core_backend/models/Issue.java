package com.spotitfixit.core_backend.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "civic_issues")
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String description;
    private String aiCategory;
    private String routedDepartment;
    private String priorityLevel;
    private String status;
    private String submittedBy; 
    
    // --- NEW UPGRADES ---
    private String userMask; // The anonymous ID tied to the ticket

    @Column(columnDefinition = "TEXT")
    private String issueImage; // The photo the citizen takes

    @Column(columnDefinition = "TEXT")
    private String resolutionImage; // The proof photo the admin takes

    @Column(columnDefinition = "TEXT")
    private String fraudReason;

    private Double latitude;
    private Double longitude;
    @Column(columnDefinition = "integer default 0")
    private int upvoteCount = 0;
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAiCategory() { return aiCategory; }
    public void setAiCategory(String aiCategory) { this.aiCategory = aiCategory; }
    public String getRoutedDepartment() { return routedDepartment; }
    public void setRoutedDepartment(String routedDepartment) { this.routedDepartment = routedDepartment; }
    public String getPriorityLevel() { return priorityLevel; }
    public void setPriorityLevel(String priorityLevel) { this.priorityLevel = priorityLevel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(String submittedBy) { this.submittedBy = submittedBy; }
    public String getUserMask() { return userMask; }
    public void setUserMask(String userMask) { this.userMask = userMask; }
    public String getIssueImage() { return issueImage; }
    public void setIssueImage(String issueImage) { this.issueImage = issueImage; }
    public String getResolutionImage() { return resolutionImage; }
    public void setResolutionImage(String resolutionImage) { this.resolutionImage = resolutionImage; }
    public String getFraudReason() { return fraudReason; }
    public void setFraudReason(String fraudReason) { this.fraudReason = fraudReason; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public int getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(int upvoteCount) { this.upvoteCount = upvoteCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}