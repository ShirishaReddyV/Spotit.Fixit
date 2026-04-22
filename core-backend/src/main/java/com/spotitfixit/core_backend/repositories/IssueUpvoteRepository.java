package com.spotitfixit.core_backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spotitfixit.core_backend.models.IssueUpvote;

@Repository
public interface IssueUpvoteRepository extends JpaRepository<IssueUpvote, String> {
    List<IssueUpvote> findByIssueId(String issueId);
    Optional<IssueUpvote> findByIssueIdAndUsername(String issueId, String username);
    boolean existsByIssueIdAndUsername(String issueId, String username);
}
