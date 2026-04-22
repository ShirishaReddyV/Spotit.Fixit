package com.spotitfixit.core_backend.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Sends a community confirmation email to a citizen upvoter.
     * The email contains two action links with a unique token.
     */
    public void sendConfirmationRequest(String toEmail, String toName,
                                        String issueCategory, String issueId,
                                        String token, int currentVoters) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("shyxark@gmail.com", "Spotit.Fixit Civic Platform");
            helper.setTo(toEmail);
            helper.setSubject("✅ Has the " + issueCategory + " near you been fixed?");

            String confirmUrl = baseUrl + "/api/confirm/" + token + "/yes";
            String denyUrl    = baseUrl + "/api/confirm/" + token + "/no";

            String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width,initial-scale=1"/>
                  <style>
                    body { margin:0; padding:0; background:#050B14; font-family:'Segoe UI',sans-serif; color:#e2e8f0; }
                    .wrapper { max-width:520px; margin:32px auto; background:#0a0c10; border:1px solid #1e293b; border-radius:24px; overflow:hidden; }
                    .header { background:linear-gradient(135deg,#1c0a00,#0a0c10); padding:32px 32px 24px; border-bottom:1px solid #1e293b; }
                    .logo { font-size:22px; font-weight:900; color:#fff; letter-spacing:-0.5px; }
                    .logo span { color:#f97316; }
                    .badge { display:inline-flex; align-items:center; gap:6px; margin-top:10px; background:#f97316; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:4px 12px; border-radius:99px; }
                    .body { padding:28px 32px; }
                    h2 { font-size:20px; font-weight:800; color:#fff; margin:0 0 8px; }
                    p { font-size:14px; color:#94a3b8; line-height:1.6; margin:0 0 20px; }
                    .issue-card { background:#0f1117; border:1px solid #1e293b; border-radius:16px; padding:16px 20px; margin:20px 0; }
                    .issue-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748b; margin-bottom:4px; }
                    .issue-title { font-size:18px; font-weight:800; color:#fff; }
                    .issue-id { font-size:11px; font-family:monospace; color:#475569; margin-top:4px; }
                    .voters { font-size:12px; color:#f97316; font-weight:600; margin-top:8px; }
                    .actions { display:flex; gap:12px; margin-top:24px; }
                    .btn { flex:1; display:block; text-align:center; padding:14px 20px; border-radius:12px; font-size:14px; font-weight:700; text-decoration:none; }
                    .btn-confirm { background:#10b981; color:#fff; }
                    .btn-deny { background:#0f1117; color:#94a3b8; border:1px solid #1e293b; }
                    .footer { padding:16px 32px; background:#050B14; border-top:1px solid #0f1117; text-align:center; }
                    .footer p { font-size:11px; color:#334155; margin:0; }
                    .footer a { color:#475569; }
                  </style>
                </head>
                <body>
                  <div class="wrapper">
                    <div class="header">
                      <div class="logo">spotit<span>.</span>fixit</div>
                      <div class="badge">🏙️ Bengaluru Civic Platform</div>
                    </div>
                    <div class="body">
                      <h2>Hi %s, was your reported issue fixed?</h2>
                      <p>The municipality has uploaded proof of resolution for an issue you voted on. As a community verifier, your response helps determine if this issue is truly resolved.</p>

                      <div class="issue-card">
                        <div class="issue-label">Issue Type</div>
                        <div class="issue-title">%s</div>
                        <div class="issue-id">TKT-%s</div>
                        <div class="voters">👥 %d community members are verifying this fix</div>
                      </div>

                      <p><strong style="color:#fff;">Your vote matters.</strong> If 30%% of voters confirm this fix, the issue will be automatically marked as resolved. Your 1 vote = 1 fair voice.</p>

                      <div class="actions">
                        <a href="%s" class="btn btn-confirm">✅ Yes, It's Fixed!</a>
                        <a href="%s" class="btn btn-deny">❌ Still Not Fixed</a>
                      </div>
                    </div>
                    <div class="footer">
                      <p>You're receiving this because you upvoted this civic issue.<br/>
                      This link is unique to you and expires in 7 days. | <a href="#">Unsubscribe</a></p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(toName, issueCategory,
                              issueId.substring(0, Math.min(6, issueId.length())).toUpperCase(),
                              currentVoters, confirmUrl, denyUrl);

            helper.setText(html, true);
            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send to " + toEmail + ": " + e.getMessage());
        }
    }
}
