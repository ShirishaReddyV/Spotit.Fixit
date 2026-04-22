package com.spotitfixit.core_backend.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotitfixit.core_backend.models.ConfirmationVote;
import com.spotitfixit.core_backend.models.Issue;
import com.spotitfixit.core_backend.models.IssueUpvote;
import com.spotitfixit.core_backend.repositories.ConfirmationVoteRepository;
import com.spotitfixit.core_backend.repositories.IssueRepository;
import com.spotitfixit.core_backend.repositories.IssueUpvoteRepository;
import com.spotitfixit.core_backend.services.EmailService;

@RestController
@RequestMapping("/api/confirm")
public class ConfirmationController {

    @Autowired private IssueRepository issueRepository;
    @Autowired private IssueUpvoteRepository upvoteRepository;
    @Autowired private ConfirmationVoteRepository confirmationRepository;
    @Autowired private EmailService emailService;

    private static final double RESOLVE_THRESHOLD   = 0.30; // 30% confirm  → resolve
    private static final double REOPEN_THRESHOLD    = 0.50; // 50% deny     → reopen

    // -------------------------------------------------------------------------
    // 1. ADMIN TRIGGERS: Send confirmation emails to all upvoters
    // -------------------------------------------------------------------------
    @PostMapping("/{issueId}/send")
    public ResponseEntity<?> sendConfirmationEmails(@PathVariable String issueId) {
        Optional<Issue> opt = issueRepository.findById(issueId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Issue issue = opt.get();

        List<IssueUpvote> upvoters = upvoteRepository.findByIssueId(issueId);
        if (upvoters.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "sent", 0,
                "message", "No upvoters found for this issue. Issue remains pending."
            ));
        }

        int sent = 0;
        for (IssueUpvote upvoter : upvoters) {
            if (upvoter.getEmail() == null || upvoter.getEmail().isBlank()) continue;

            // Avoid re-sending if already notified
            if (confirmationRepository
                    .findByIssueId(issueId).stream()
                    .anyMatch(v -> v.getUsername().equals(upvoter.getUsername()))) {
                continue;
            }

            ConfirmationVote vote = new ConfirmationVote();
            vote.setIssueId(issueId);
            vote.setUsername(upvoter.getUsername());
            vote.setEmail(upvoter.getEmail());
            vote.setToken(UUID.randomUUID().toString());
            vote.setExpiresAt(LocalDateTime.now().plusDays(7));
            confirmationRepository.save(vote);

            emailService.sendConfirmationRequest(
                upvoter.getEmail(),
                upvoter.getUsername(),
                issue.getAiCategory(),
                issueId,
                vote.getToken(),
                upvoters.size()
            );
            sent++;
        }

        return ResponseEntity.ok(Map.of(
            "sent", sent,
            "totalUpvoters", upvoters.size(),
            "message", sent + " confirmation emails dispatched."
        ));
    }

    // -------------------------------------------------------------------------
    // 2. CITIZEN CLICKS "YES, IT'S FIXED" in their email
    // -------------------------------------------------------------------------
    @GetMapping(value = "/{token}/yes", produces = MediaType.TEXT_HTML_VALUE)
    public String confirmYes(@PathVariable String token) {
        return handleVoteResponse(token, true);
    }

    // -------------------------------------------------------------------------
    // 3. CITIZEN CLICKS "STILL NOT FIXED" in their email
    // -------------------------------------------------------------------------
    @GetMapping(value = "/{token}/no", produces = MediaType.TEXT_HTML_VALUE)
    public String confirmNo(@PathVariable String token) {
        return handleVoteResponse(token, false);
    }

    // -------------------------------------------------------------------------
    // 4. GET CONFIRMATION STATS for a specific issue (for the admin dashboard)
    // -------------------------------------------------------------------------
    @GetMapping("/{issueId}/stats")
    public ResponseEntity<?> getStats(@PathVariable String issueId) {
        List<ConfirmationVote> votes = confirmationRepository.findByIssueId(issueId);
        long total    = votes.size();
        long confirmed = votes.stream().filter(v -> Boolean.TRUE.equals(v.getConfirmed())).count();
        long denied    = votes.stream().filter(v -> Boolean.FALSE.equals(v.getConfirmed())).count();
        long pending   = total - confirmed - denied;
        double pct     = total > 0 ? Math.round((confirmed * 100.0 / total) * 10.0) / 10.0 : 0;

        return ResponseEntity.ok(Map.of(
            "total", total,
            "confirmed", confirmed,
            "denied", denied,
            "pending", pending,
            "confirmPct", pct,
            "thresholdPct", (int)(RESOLVE_THRESHOLD * 100),
            "thresholdMet", total > 0 && (double) confirmed / total >= RESOLVE_THRESHOLD
        ));
    }

    // -------------------------------------------------------------------------
    // 5. SCHEDULED: Auto-resolve issues where votes have expired (7 days)
    //    Runs daily at midnight.
    // -------------------------------------------------------------------------
    @Scheduled(cron = "0 0 0 * * *")
    public void autoResolveExpiredIssues() {
        List<ConfirmationVote> expired = confirmationRepository
                .findByExpiresAtBeforeAndIssueIdNotNull(LocalDateTime.now());

        expired.stream()
            .map(ConfirmationVote::getIssueId)
            .distinct()
            .forEach(issueId -> {
                Optional<Issue> opt = issueRepository.findById(issueId);
                if (opt.isEmpty()) return;
                Issue issue = opt.get();
                if ("PENDING_CITIZEN_REVIEW".equals(issue.getStatus())) {
                    issue.setStatus("RESOLVED");
                    issueRepository.save(issue);
                    System.out.println("[Scheduler] Auto-resolved issue " + issueId + " after 7-day expiry.");
                }
            });
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Handle vote, recompute threshold, update issue status
    // -------------------------------------------------------------------------
    private String handleVoteResponse(String token, boolean confirmed) {
        Optional<ConfirmationVote> optVote = confirmationRepository.findByToken(token);

        if (optVote.isEmpty()) {
            return buildPage("⚠️ Invalid Link", "This confirmation link is invalid or has already been used.", "#f97316");
        }

        ConfirmationVote vote = optVote.get();

        if (vote.getConfirmed() != null) {
            return buildPage("Already Recorded", "You've already submitted your response. Thank you!", "#10b981");
        }
        if (vote.getExpiresAt() != null && LocalDateTime.now().isAfter(vote.getExpiresAt())) {
            return buildPage("Link Expired", "This confirmation link expired after 7 days. The issue has been auto-resolved.", "#64748b");
        }

        // Record the vote
        vote.setConfirmed(confirmed);
        vote.setRespondedAt(LocalDateTime.now());
        confirmationRepository.save(vote);

        // Recompute threshold for this issue
        String issueId = vote.getIssueId();
        List<ConfirmationVote> allVotes = confirmationRepository.findByIssueId(issueId);
        long total     = allVotes.size();
        long confirms  = allVotes.stream().filter(v -> Boolean.TRUE.equals(v.getConfirmed())).count();
        long denies    = allVotes.stream().filter(v -> Boolean.FALSE.equals(v.getConfirmed())).count();

        Optional<Issue> optIssue = issueRepository.findById(issueId);
        if (optIssue.isPresent()) {
            Issue issue = optIssue.get();
            if ((double) confirms / total >= RESOLVE_THRESHOLD) {
                issue.setStatus("RESOLVED");
                issueRepository.save(issue);
                return buildPage("🎉 Issue Resolved!", 
                    "Thank you! " + confirms + " out of " + total + " voters confirmed this fix. " +
                    "The issue has been automatically marked <strong>RESOLVED</strong>. Bengaluru thanks you!",
                    "#10b981");
            } else if (total > 0 && (double) denies / total > REOPEN_THRESHOLD) {
                issue.setStatus("REOPENED_BY_COMMUNITY");
                issueRepository.save(issue);
                return buildPage("🚨 Issue Reopened",
                    "Over 50% of voters say this isn't fixed. The issue has been <strong>re-opened</strong> and the department notified.",
                    "#ef4444");
            }
        }

        double pct = total > 0 ? Math.round(confirms * 100.0 / total) : 0;
        return buildPage(
            confirmed ? "✅ Confirmation Recorded!" : "❌ Denial Recorded",
            "Your response has been saved. Current progress: <strong>" + confirms + "/" + total +
            " (" + (int)pct + "%)</strong> confirmations — need 30% to auto-resolve. Keep sharing!",
            confirmed ? "#10b981" : "#f97316"
        );
    }

    /** Renders a minimal but branded HTML confirmation page returned after link click */
    private String buildPage(String title, String message, String accentColor) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1"/>
              <title>Spotit.Fixit — %s</title>
              <style>
                *{box-sizing:border-box;margin:0;padding:0}
                body{background:#050B14;font-family:'Segoe UI',sans-serif;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
                .card{max-width:440px;width:100%%;background:#0a0c10;border:1px solid #1e293b;border-radius:24px;overflow:hidden;text-align:center}
                .top{padding:40px 32px 28px;border-bottom:1px solid #1e293b}
                .icon{width:64px;height:64px;border-radius:50%%;background:%s22;border:2px solid %s55;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}
                h1{font-size:22px;font-weight:800;color:#fff;margin-bottom:12px}
                p{font-size:14px;color:#94a3b8;line-height:1.6}
                p strong{color:%s}
                .bottom{padding:20px 32px;background:#050B14}
                .logo{font-size:14px;font-weight:900;color:#fff}
                .logo span{color:#f97316}
                .sub{font-size:11px;color:#334155;margin-top:4px}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="top">
                  <div class="icon">%s</div>
                  <h1>%s</h1>
                  <p>%s</p>
                </div>
                <div class="bottom">
                  <div class="logo">spotit<span>.</span>fixit</div>
                  <div class="sub">Bengaluru Civic Management Platform</div>
                </div>
              </div>
            </body>
            </html>
            """.formatted(title, accentColor, accentColor, accentColor,
                          title.charAt(0) <= 127 ? "🏙️" : title.substring(0,2),
                          title, message);
    }
}
