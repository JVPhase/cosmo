# Privacy Policy — Cosmo Mini App

**Version:** 1.0  
**Effective date:** 2026-04-11  
**Last updated:** 2026-04-11

---

## 1. Who We Are

**[OPERATOR]** ("[OPERATOR]", "we", "us", "our"), registered in **[COUNTRY]** (registration number: **[OGRNIP/OGRN/VAT]**), operates the **Cosmo** game available as a Telegram Mini App (the "Service").

Contact: **[EMAIL]**  
Website: **[WEBSITE]**

We act as the **Data Controller** in relation to personal data processed under this Policy.

---

## 2. What Data We Collect

### 2.1 Telegram Profile Data
When you launch Cosmo through Telegram, Telegram provides us with data from your profile:
- Telegram numeric ID
- First name, last name (if set)
- Username (if set)
- Profile photo URL (if set)
- Language code
- Telegram Premium status

This data is transmitted via the signed `initData` payload and verified server-side via HMAC-SHA256.

### 2.2 Account Data (Optional)
If you register with email and password:
- Email address
- Password (stored as an irreversible Argon2 hash — we never see your plaintext password)

If you use "Sign in with Google" or "Sign in with Apple":
- Provider user ID and the provider name — no passwords are stored

### 2.3 Game Data
- Game state (resources mined, buildings, fleet, research) — stored as JSON
- In-game wallet balance (server-authoritative credits)
- Inventory (owned items, boosters, skins)
- Purchase history (item bought, amount in Telegram Stars, payment charge ID, timestamp)

### 2.4 Technical Data
- IP address and User-Agent string — captured transiently in server logs for security and abuse prevention

We do **not** collect payment card numbers, precise geolocation, or biometric data.

---

## 3. How We Use Your Data

| Purpose | Legal Basis (GDPR Art. 6) |
|---------|--------------------------|
| Create and authenticate your account | Art. 6(1)(b) — contract performance |
| Provide game functionality (save/load state, grant purchases) | Art. 6(1)(b) — contract performance |
| Process Telegram Stars payments and deliver in-game items | Art. 6(1)(b) — contract performance |
| Keep purchase records for tax / accounting obligations | Art. 6(1)(c) — legal obligation |
| Prevent fraud and abuse | Art. 6(1)(f) — legitimate interests |
| Process Telegram profile data for account creation | Art. 6(1)(a) — your consent |
| Send marketing communications (if you opt in) | Art. 6(1)(a) — your consent |

---

## 4. Who We Share Data With

We do **not** sell your data. We share data only with service providers ("sub-processors") needed to operate the Service:

| Sub-processor | Purpose | Location |
|---------------|---------|---------|
| Telegram Messenger Inc. | Mini App platform, Stars payments | UAE / distributed |
| [HOSTING PROVIDER] | Database & API hosting | [COUNTRY] |
| Google LLC | Sign in with Google | USA (SCCs applied) |
| Apple Inc. | Sign in with Apple | USA (SCCs applied) |

All sub-processors are bound by data processing agreements and must process data only as instructed.

---

## 5. International Transfers

Your data may be transferred to countries outside the European Economic Area. Where required by law, we apply appropriate safeguards such as the EU Standard Contractual Clauses (SCCs) or rely on adequacy decisions.

---

## 6. How Long We Keep Your Data

| Data | Retention Period |
|------|-----------------|
| Account & profile data | While your account exists + 30 days |
| Game state, wallet, inventory | While your account exists + 30 days |
| Purchase / transaction records | 5 years from transaction date |
| Consent records | 5 years from grant date |
| Server logs (IP, User-Agent) | 90 days |
| Backups | 30 days rolling |

---

## 7. Your Rights

If you are in the EU/EEA or another jurisdiction with equivalent rights, you may:

- **Access**: request a copy of your personal data
- **Rectification**: correct inaccurate data
- **Erasure**: ask us to delete your account and personal data
- **Restriction**: ask us to pause processing
- **Portability**: receive your data in a machine-readable format
- **Object**: object to processing based on legitimate interests
- **Withdraw consent**: revoke any consent at any time (does not affect prior processing)

To exercise any right, contact us at **[EMAIL]**. We will respond within **30 days**.

You also have the right to lodge a complaint with your local data protection authority.

---

## 8. Children

The Service is not directed to children under 13. We do not knowingly collect data from children. Telegram itself requires users to be 13+. If you believe a child has provided us data, please contact us immediately.

---

## 9. Security

We use industry-standard security measures:
- Argon2 password hashing
- HMAC-SHA256 signature verification for Telegram auth
- JWT tokens for session management with refresh-token rotation
- HTTPS for all communications
- Rate limiting on all endpoints

---

## 10. Cookies and Storage

The Mini App may use Telegram's `CloudStorage` API to store lightweight client-side preferences. No third-party cookies are used.

---

## 11. Changes to This Policy

We will notify you of material changes by updating the "Last updated" date and, where required, requesting renewed consent. Continued use of the Service after changes constitutes acceptance.

---

## 12. Contact

**[OPERATOR]**  
Email: **[EMAIL]**  
Address: **[FULL LEGAL ADDRESS]**
