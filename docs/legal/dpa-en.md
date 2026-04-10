# Data Processing Agreement (Controller → Sub-processor)

**Version:** 1.0  
**Effective date:** 2026-04-11

This Data Processing Agreement ("DPA") is entered into between **[OPERATOR]** ("Controller") and the sub-processor listed below ("Processor"), and forms part of the main service agreement between the parties.

> **Note:** This is a template DPA for agreements with your hosting provider and other sub-processors. For Telegram and Google/Apple, their own DPAs/Terms govern the relationship. Fill in the Processor details for each separate agreement.

---

## 1. Definitions

"**Personal Data**", "**Data Subject**", "**Processing**", "**Controller**", "**Processor**" have the meanings given in Regulation (EU) 2016/679 (GDPR) and/or applicable national law.

"**Service**" means the Cosmo Mini App and related infrastructure operated by the Controller.

---

## 2. Subject Matter and Duration

2.1 The Processor agrees to process Personal Data on behalf of the Controller for the purpose of providing hosting, database, and infrastructure services for the Service.

2.2 This DPA remains in force for the duration of the main service agreement.

---

## 3. Nature and Purpose of Processing

| Item | Detail |
|------|--------|
| **Subject matter** | Hosting and storage of Service data |
| **Duration** | Term of main agreement + 30 days data deletion period |
| **Nature** | Storage, transmission, backup, retrieval |
| **Purpose** | Operate Controller's API, database, and static servers |
| **Personal Data categories** | Telegram identifiers, email, game state, transaction records, server logs |
| **Data subjects** | End users of the Cosmo game |

---

## 4. Processor Obligations

The Processor shall:

4.1 Process Personal Data only on documented instructions from the Controller.

4.2 Ensure that persons authorised to process Personal Data are under appropriate confidentiality obligations.

4.3 Implement appropriate technical and organisational security measures (Art. 32 GDPR), including at minimum: encryption at rest and in transit, access controls, and audit logging.

4.4 Assist the Controller in responding to Data Subject requests (Art. 12–22 GDPR).

4.5 Assist the Controller with security obligations, breach notification, DPIAs, and prior consultation (Art. 32–36 GDPR).

4.6 At the Controller's choice, delete or return all Personal Data upon termination of the DPA, and delete existing copies.

4.7 Make available all information necessary to demonstrate compliance and allow audits or inspections.

4.8 **Not engage sub-processors** without the Controller's prior written authorisation. Approved sub-processors are listed in Annex B.

---

## 5. Controller Obligations

The Controller shall:

5.1 Provide Personal Data lawfully, having obtained any required consents and provided appropriate notices to Data Subjects.

5.2 Document and provide processing instructions in writing.

5.3 Ensure the purposes and means of processing are lawful.

---

## 6. Security Measures (Article 32 GDPR)

The parties agree to implement the following measures:

| Measure | Responsibility |
|---------|---------------|
| TLS/HTTPS encryption in transit | Both parties |
| Encryption at rest for database volumes | Processor |
| Access controls and least-privilege principle | Both parties |
| Audit logging of access to Personal Data | Processor |
| Regular security testing and patching | Processor |
| Incident detection and response | Processor (notify Controller within 24h) |

---

## 7. Personal Data Breach Notification

7.1 The Processor shall notify the Controller of a Personal Data Breach **without undue delay and no later than 24 hours** after becoming aware.

7.2 Notification shall include: nature of the breach, categories and approximate number of Data Subjects and records concerned, likely consequences, and measures taken or proposed.

---

## 8. International Transfers

8.1 The Processor shall not transfer Personal Data outside the EEA without:
- The Controller's prior written consent, and
- An appropriate transfer mechanism (SCCs, adequacy decision, BCRs)

8.2 Where SCCs are used, both parties agree to be bound by the applicable module (Controller-to-Processor or Processor-to-Processor).

---

## 9. Sub-processors

The Controller provides general authorisation for the following sub-processors:

**Annex B — Approved Sub-processors:**

| Sub-processor | Purpose | Location |
|---------------|---------|---------|
| [LIST SUB-PROCESSORS OF HOSTING PROVIDER] | [PURPOSE] | [COUNTRY] |

The Processor must inform the Controller of any intended changes and give the Controller the opportunity to object.

---

## 10. Governing Law

This DPA is governed by the law of **[COUNTRY]** / GDPR as applicable.

---

## Annex A — Technical and Organisational Measures

| Control Area | Measure |
|-------------|---------|
| Pseudonymisation | User IDs (cuid) used; Telegram IDs stored as BigInt (no direct link to name in logs) |
| Encryption at rest | Database volume encrypted at rest |
| Encryption in transit | TLS 1.2+ for all connections |
| Integrity | Database checksums; JWT signature verification |
| Availability | Database backups with 30-day retention |
| Access control | Role-based access; JWT authentication for all API endpoints |
| Incident response | 24-hour breach notification to Controller |

---

**Signed for and on behalf of [OPERATOR] (Controller):**

Name: ___________________________  
Title: ___________________________  
Date: ___________________________

**Signed for and on behalf of [PROCESSOR]:**

Name: ___________________________  
Title: ___________________________  
Date: ___________________________
