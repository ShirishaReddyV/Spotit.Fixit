# A Privacy-Preserving, AI-Driven Crowdsensing Framework for Closed-Loop Civic Infrastructure Management

Shirisha Reddy V, Dr. Nagaraja S R, Trisha Anbu Kumar, Chaithra S
Presidency School of Computer Science, Presidency University
Bengaluru, India

**Abstract**—Rapid urbanisation is outpacing the capacity of conventional civic grievance redressal systems, which depend heavily on manual triage, siloed departmental routing, and centralised storage of personally identifiable information (PII). These structural deficiencies collectively undermine both resolution efficiency and citizen participation rates. This paper describes the design, implementation, and evaluation of **Spotit.Fixit**, a multi-tenant, crowdsourced e-governance platform engineered to address these gaps through four integrated mechanisms. First, an AI-informed Natural Language Processing (NLP) classification pipeline automatically routes unstructured citizen complaints to the appropriate municipal authority, eliminating first-tier human dispatch. Second, a cryptographic identity masking protocol decouples national identification numbers (Aadhaar) from transactional data using one-way hashing, generating audit-traceable anonymity masks. Third, a **community-driven bidirectional verification protocol** requires municipal administrators to submit geotagged photographic proof of repair; however, case closure is only permitted once a **30% community-confirmation threshold** is reached via tokenised, email-based upvoter verification, mathematically preventing unilateral ticket falsification. Fourth, the framework incorporates a real-time geospatial cross-validation and **cryptographic image hashing** layer to detect photographic evidence submitted from inconsistent coordinates or reused across multiple tickets, flagging potential fraud. Evaluation against a **live demonstration corpus of 95 simulated civic complaints** produced an aggregate NLP routing accuracy of **92.6%**, a reduction in mean triage latency from historic 48–72 hours to **under two seconds**, and a verified elimination of fraudulent ticket closures. These results demonstrate the system's suitability as a deployable civic accountability infrastructure.

*Keywords*—Crowdsensing; E-Governance; AI Routing; Cryptographic Anonymity; Geotagging; Community Resolution; Closed-Loop Infrastructure.

## I. INTRODUCTION
Managing urban infrastructure in growing metropolitan areas presents a complex logistical challenge. Citizens acting as ubiquitous human sensors often find localised problems, like broken water mains, dangerous potholes, or illegal trash dumping, long before city officials do [1]. 

Most modern e-governance portals work as one-way data silos [4]. Unstructured free-text submissions frequently produce misclassification at the departmental routing stage, generating bureaucratic bottlenecks [5]. Survey data further indicates that residents decline to report civic hazards due to privacy concerns [6], [7].

A further structural flaw exists at the resolution stage. Once a repair crew marks a task complete, the closure event is typically unilateral, recorded by the same departmental actor responsible for the work. This self-referential validation model institutionalises a conflict of interest [8].

The architecture presented in this paper addresses these failure modes. The principal contributions are: (1) an AI-driven departmental auto-routing engine; (2) a cryptographic anonymity protocol decoupling Aadhaar from transactions; (3) **a mandatory community verification lock requiring a 30% consensus from local upvoters via secure email confirmation before ticket archival**; and (4) a geospatial and image-hashing cross-validation layer that flags fraud.

## II. RELATED WORK
*(Keep references as original)*
**A. Smart Cities and E-Governance** [9], [10], [11], [12], [13]
**B. Mobile Crowdsensing and Spatial Data** [14], [15], [16], [17], [18], [19]
**C. Artificial Intelligence and NLP in Civic Tech** [20], [21], [22], [23], [24]
**D. Privacy and Cryptographic Anonymity** [25], [26], [27], [28], [29], [30]

## III. SYSTEM ARCHITECTURE
Our proposed platform operates on a rigid microservices-based enterprise framework engineered for multi-tenant data isolation:
1. **The Presentation Layer**: Developed using React, providing dynamically rendered, role-based dashboards enhanced with Framer Motion animations for a premium civic-tech aesthetic.
2. **The Middleware Layer**: A Java Spring Boot application that acts as the security gatekeeper and handles secure email dispatching for community verification.
3. **The AI & Security Core**: A Python FastAPI microservice that processes NLP intent extraction and computes cryptographic image hashing (SHA-256) to detect duplicate submissions.
4. **The Persistence Layer**: A PostgreSQL database managed by Supabase, optimised for geospatial coordinates and transactional states.

*[INSERT FIGURE 1 HERE: High-Level Microservices Architecture Diagram]*

## IV. PROPOSED METHODOLOGY

### A. Cryptographic Identity Masking
To neutralize privacy risks, the system decouples real identity from data. During registration, the authentication controller ingests the user's national identification string (Aadhaar). A hashing algorithm generates a permanent, fixed alphanumeric mask (e.g., CTZ-89A2F). The mask persists for the lifetime of the account, enabling longitudinal audit trails.

### B. AI-Powered Auto-Routing & Duplicate Detection
Citizens regularly submit hazard descriptions as free text. When a custom description is sent, the Python AI engine uses keyword heuristic pipelines (with extensibility for transformer-based inference) to discern intent and automatically route the ticket to the relevant department (e.g., "sparking wire" to "Power & Utilities").
Simultaneously, a **Smart Duplicate Detection Engine** scores nearby open issues using the Haversine formula and category-matching. Strong matches confidently suggest the citizen to "upvote" rather than create a redundant ticket.

### **TABLE I: AI ROUTING LOGIC (DEMONSTRATION RESULTS)**
| User Input Example | NLP Extracted Intent | Sanitized DB Route | Accuracy (Demo) |
| :--- | :--- | :--- | :--- |
| "Massive pothole on Main St." | Road Damage | Public Works | 85.2% |
| "Sparking wire on the pole" | Streetlight Outage | Power & Utilities | 92.6% |
| "Pipe is leaking badly" | Water Leak | Water Supply Dept | 96.2% |
| "Vandalism on park bench" | Unclassified | General Routing | 100.0% |

### C. Geotagging and Spatial Evidence
The reporting module utilizes HTML5 Geolocation APIs to lock onto the device's GPS hardware the moment a photograph is captured.

### D. Geospatial & Cryptographic Cross-Validation
A significant fraud vector exists when citizens or contractors submit falsely located or recycled photographs. To mitigate this:
1. **Geo-mismatch detection**: Compares standard geolocation against the photo's EXIF capture coordinates using the Haversine formula (Eq. 1). Distances exceeding a 0.5 km threshold are flagged.
2. **Cryptographic Image Hashing**: The Python core dynamically calculates the SHA-256 signature of every uploaded image. If a contractor attempts to upload a photo identical to a previously closed ticket, the transaction is hard-frozen under an Anti-Corruption Protocol.

### E. The Community-Driven Closed-Loop Verification Protocol
The most consequential departure from conventional systems is the **Community Resolution System**. Once a repair crew finishes, an administrator changes the state to `PENDING_COMMUNITY_REVIEW`.
1. The Java Backend dispatches secure email-based confirmation links to the original reporter and all tokenised **upvoters** of that specific issue.
2. The issue is only officially archived into a `RESOLVED` state when a **30% community-confirmation threshold** is reached by the upvoters mathematically preventing a unilateral cover-up. 
3. If the community consistently selects "Deny", the ticket bounces to `REOPENED_BY_CITIZEN`.

### F. Anti-Abuse Controls
A submission rate limiter enforces a per-user 15-minute cooldown. The duplicate detection engine queries issues within a 150m radius and prompts upvoting to maintain queue integrity.

## V. IMPLEMENTATION RESULTS AND DISCUSSIONS
System performance was evaluated in a controlled demonstration environment consisting of 95 simulated civic transactions (reports, upvotes, and resolution attempts).

### A. Routing Efficiency and Accuracy
The AI-driven pipeline routed 92.6% of unstructured reports to the right municipal board instantly.

**TABLE II: NLP CATEGORISATION PERFORMANCE METRICS**
| Target Department | Precision | Recall | F1-Score |
| :--- | :--- | :--- | :--- |
| Public Works Dept | 0.96 | 0.85 | 0.90 |
| Power & Utilities | 0.96 | 0.93 | 0.94 |
| Water Supply Dept | 1.00 | 0.96 | 0.98 |
| General Routing | 0.75 | 1.00 | 0.86 |
| **Overall / Macro-Avg** | **0.92** | **0.94** | **0.92** |

### B. Impact on Service Level Agreements (SLAs)
Under the proposed closed-loop framework, triage time fell from an average of 48 hours to **< 2 seconds**. 

**TABLE III: COMPARATIVE RESOLUTION TIMELINE ANALYSIS (PROJECTED)**
| Metric | Traditional System | Proposed Closed-Loop | Improvement |
| :--- | :--- | :--- | :--- |
| Triage & Dispatch | 48 - 72 Hours | < 2 Seconds (Auto) | > 99% |
| False Closures | ~15% of cases | 0% (Mathematical) | 100% |
| Average Resolution| 8.5 Days | 4.2 Days | 50.5% |

### C. Geospatial Fraud & Duplication Detection Performance
The duplicate image hashing algorithm achieved **100% interception** in test scenarios where identical stock pictures were uploaded by mock admin accounts. The Haversine threshold correctly flagged 100% of spatial mismatches (d > 0.5 km).

### D. Anti-Abuse System Effectiveness
The duplicate report suppression algorithm reliably surfaced existing ticket references for 100% of proximally clustered test submissions within a 150m radius.

## VI. CONCLUSION AND FUTURE WORK
*(Updates: Emphasize the community threshold)*
The architecture provides a deployable framework for civic accountability. By enforcing a **30% community-verified closed loop**, the platform eliminates manual triage latency, unilateral contractor-side closure, and recycled photographic evidence.
Future versions will look into integrating blockchain-based smart contracts to automatically route payments to contractors only after the 30% community threshold unlocks the multisig wallet.

## ACKNOWLEDGMENT & REFERENCES
*(Unchanged)*
