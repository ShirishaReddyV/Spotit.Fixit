package com.spotitfixit.core_backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spotitfixit.core_backend.models.Issue;
import com.spotitfixit.core_backend.models.IssueUpvote;
import com.spotitfixit.core_backend.repositories.IssueRepository;
import com.spotitfixit.core_backend.repositories.IssueUpvoteRepository;
import com.spotitfixit.core_backend.repositories.UserRepository;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private IssueUpvoteRepository upvoteRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/report")
    public ResponseEntity<Issue> createIssue(@RequestBody Issue newIssue) {
        return ResponseEntity.ok(issueRepository.save(newIssue));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Issue>> getAllIssues() {
        return ResponseEntity.ok(issueRepository.findAll());
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Issue>> getUserIssues(@PathVariable String username) {
        return ResponseEntity.ok(issueRepository.findBySubmittedBy(username));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Issue> updateIssueStatus(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        java.util.Optional<Issue> optionalIssue = issueRepository.findById(id);
        if (optionalIssue.isPresent()) {
            Issue issue = optionalIssue.get();
            issue.setStatus(payload.get("status"));
            return ResponseEntity.ok(issueRepository.save(issue));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/fraud")
    public ResponseEntity<Issue> markAsFraud(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        java.util.Optional<Issue> optionalIssue = issueRepository.findById(id);
        if (optionalIssue.isPresent()) {
            Issue issue = optionalIssue.get();
            issue.setStatus("REJECTED_FRAUD");
            issue.setFraudReason(payload.get("reason"));
            return ResponseEntity.ok(issueRepository.save(issue));
        }
        return ResponseEntity.notFound().build();
    }

    // --- NEW: ADMIN UPLOADING PROOF OF RESOLUTION ---
    @PutMapping("/{id}/resolve-proof")
    public ResponseEntity<Issue> resolveWithProof(@PathVariable String id, @RequestBody java.util.Map<String, String> payload) {
        java.util.Optional<Issue> optionalIssue = issueRepository.findById(id);
        if (optionalIssue.isPresent()) {
            Issue issue = optionalIssue.get();
            issue.setStatus("PENDING_CITIZEN_REVIEW"); // Sends it back to the citizen!
            issue.setResolutionImage(payload.get("resolutionImage")); // Saves the photo
            return ResponseEntity.ok(issueRepository.save(issue));
        }
        return ResponseEntity.notFound().build();
    }

    // --- NEW: FIND NEARBY OPEN ISSUES (for duplicate detection) ---
    @GetMapping("/nearby")
    public ResponseEntity<List<Issue>> getNearbyIssues(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0.15") double radiusKm) {
        List<Issue> all = issueRepository.findAll();
        List<Issue> nearby = all.stream()
            .filter(i -> i.getLatitude() != null && i.getLongitude() != null)
            .filter(i -> !"RESOLVED".equals(i.getStatus()) && !"REJECTED_FRAUD".equals(i.getStatus()))
            .filter(i -> category == null || category.isEmpty() || category.equals(i.getAiCategory()))
            .filter(i -> haversineKm(lat, lng, i.getLatitude(), i.getLongitude()) <= radiusKm)
            .collect(Collectors.toList());
        return ResponseEntity.ok(nearby);
    }

    // --- NEW: UPVOTE AN EXISTING ISSUE (atomic + tracked) ---
    @PutMapping("/{id}/upvote")
    public ResponseEntity<Issue> upvoteIssue(@PathVariable String id,
                                              @RequestBody(required = false) java.util.Map<String, String> payload) {
        java.util.Optional<Issue> optionalIssue = issueRepository.findById(id);
        if (optionalIssue.isEmpty()) return ResponseEntity.notFound().build();

        Issue issue = optionalIssue.get();
        issue.setUpvoteCount(issue.getUpvoteCount() + 1);
        issueRepository.save(issue);

        // Track who voted so we can email them for confirmation later
        if (payload != null && payload.containsKey("username")) {
            String username = payload.get("username");
            if (!upvoteRepository.existsByIssueIdAndUsername(id, username)) {
                IssueUpvote upvote = new IssueUpvote();
                upvote.setIssueId(id);
                upvote.setUsername(username);
                // Look up email from user profile
                userRepository.findByUsername(username).ifPresent(u -> upvote.setEmail(u.getEmail()));
                upvoteRepository.save(upvote);
            }
        }
        return ResponseEntity.ok(issue);
    }

    // Haversine formula (km) — avoids pulling all records to client
    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}