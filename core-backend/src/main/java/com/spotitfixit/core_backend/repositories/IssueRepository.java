package com.spotitfixit.core_backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.spotitfixit.core_backend.models.Issue;

@Repository
public interface IssueRepository extends JpaRepository<Issue, String> {
    
    // This is the magical command that was missing! 
    // It tells the database to search ONLY for tickets matching the logged-in user.
    List<Issue> findBySubmittedBy(String username);
}