package com.spotitfixit.core_backend.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spotitfixit.core_backend.models.ConfirmationVote;

@Repository
public interface ConfirmationVoteRepository extends JpaRepository<ConfirmationVote, String> {
    List<ConfirmationVote> findByIssueId(String issueId);
    Optional<ConfirmationVote> findByToken(String token);
    long countByIssueIdAndConfirmedTrue(String issueId);
    long countByIssueIdAndConfirmedFalse(String issueId);
    // For the 7-day auto-resolve scheduler
    List<ConfirmationVote> findByExpiresAtBeforeAndIssueIdNotNull(LocalDateTime cutoff);
}
