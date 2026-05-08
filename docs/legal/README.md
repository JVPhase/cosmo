# Legal Package — Cosmo Mini App

> Version 1.0 · Effective 2026-04-11  
> **[REPLACE ALL PLACEHOLDERS]** before publishing: `[OPERATOR]`, `[EMAIL]`, `[WEBSITE]`, `[COUNTRY]`, `[OGRNIP/OGRN]`.

---

## 1. Document Index

| File | Language | Purpose |
|------|----------|---------|
| [privacy-policy-en.md](privacy-policy-en.md) | EN | Privacy Policy — Telegram Mini App (GDPR-aligned) |
| [privacy-policy-ru.md](privacy-policy-ru.md) | RU | Политика конфиденциальности — Telegram Mini App |
| [privacy-policy-android-en.md](privacy-policy-android-en.md) | EN | Privacy Policy — Google Play / Android app |
| [privacy-policy-android-ru.md](privacy-policy-android-ru.md) | RU | Политика конфиденциальности — Google Play / Android |
| [../privacy-policy.html](../privacy-policy.html) | EN+RU | Hostable HTML page for Google Play (combined Android policy) |
| [terms-en.md](terms-en.md) | EN | Terms of Service |
| [terms-ru.md](terms-ru.md) | RU | Публичная оферта / Пользовательское соглашение |
| [dpa-en.md](dpa-en.md) | EN | Data Processing Agreement (controller → sub-processor) |
| [dpa-ru.md](dpa-ru.md) | RU | Политика обработки персональных данных (152-ФЗ) |
| [consent-telegram.md](consent-telegram.md) | EN+RU | Consent text for Telegram profile data |

---

## 2. Data Inventory

### 2.1 Personal Data Collected

| Category | Fields | Source | Legal Basis |
|----------|--------|--------|-------------|
| Telegram identity | `telegramId`, `firstName`, `lastName`, `username`, `photoUrl`, `languageCode`, `isPremium` | Telegram `initData` on auth | Consent (Art. 6(1)(a) GDPR / ст. 6 152-ФЗ) |
| Email & credentials | `email`, `passwordHash` (Argon2) | User input on registration | Contract performance |
| OAuth identity | `provider`, `providerUserId` (Google / Apple) | OAuth flow | Contract performance |
| Game state | `UserSave.data`, `GameplaySave.data` — JSON blob (resources, buildings, fleet) | Client sync | Contract performance |
| Wallet | `Wallet.credits` (BigInt) | Server computation | Contract performance |
| Transactions | `Purchase.*`, `telegramPaymentChargeId`, `starsAmount` | Telegram Payments API | Legal obligation (accounting) |
| Item grants / inventory | `Grant.*`, `Inventory.*` | Server fulfillment | Contract performance |
| Consents | `UserConsent.*` | Client checkbox / API | Legal compliance |
| Technical logs | IP address, User-Agent (request-level) | Fastify logger | Legitimate interest (security) |

### 2.2 Data NOT Collected
- Payment card numbers (Telegram Stars handles payment natively)
- Precise geolocation
- Biometric data
- Minors data (service is 13+ per Telegram ToS)

---

## 3. Roles

| Party | Role | Notes |
|-------|------|-------|
| **[OPERATOR]** | Data Controller (GDPR) / Оператор (152-ФЗ) | Owns the service and all data |
| **Telegram Messenger Inc.** | Data Sub-processor (auth, payments) | Own Privacy Policy applies to Telegram platform |
| **Hosting provider** | Data Sub-processor | [FILL: provider name, country, DPA link] |
| **Google LLC** | Data Sub-processor (OAuth) | Google Privacy Policy, SCCs in place |
| **Apple Inc.** | Data Sub-processor (OAuth) | Apple Privacy Policy, SCCs in place |

---

## 4. Sub-processors

| Sub-processor | Purpose | Location | Transfer Mechanism |
|---------------|---------|----------|-------------------|
| Telegram Messenger Inc. | Auth (initData), Stars payments, Mini App platform | UAE / distributed | Telegram ToS |
| [HOSTING PROVIDER] | Database & API hosting | [COUNTRY] | [DPA / SCCs] |
| Google LLC | Sign in with Google | USA | SCCs (Art. 46 GDPR) |
| Apple Inc. | Sign in with Apple | USA | SCCs (Art. 46 GDPR) |

---

## 5. Retention Periods

| Data Type | Retention | Trigger for Deletion |
|-----------|-----------|----------------------|
| Telegram profile, game state | While account is active | 30 days after deletion request |
| Email & password hash | While account is active | 30 days after deletion request |
| Purchase & payment records | 5 years from transaction | Accounting / tax law |
| Refresh tokens | Until expiry or logout | Automatic (expiresAt) |
| Consents (UserConsent) | 5 years | Manual audit review |
| Application logs (IP, UA) | 90 days | Log rotation |
| Backups | 30 days | Backup rotation policy |

---

## 6. User Rights

Users may exercise the following rights by contacting **[EMAIL]**:

| Right | Description | Response SLA |
|-------|-------------|-------------|
| Access (SAR) | Receive a copy of their data | 30 days |
| Rectification | Correct inaccurate data | 10 days |
| Erasure ("right to be forgotten") | Delete account and personal data | 30 days |
| Restriction | Restrict processing | 10 days |
| Portability | Export data in machine-readable format | 30 days |
| Objection | Object to legitimate-interest processing | 10 days |
| Withdraw consent | Revoke consent without affecting prior processing | Immediate |

---

## 7. UI Integration Plan

### 7.1 Telegram Mini App (mobile/cosmo-miner)

**On first launch / registration screen:**
```
[x] I agree to the Terms of Service and Privacy Policy
    [link: Terms] · [link: Privacy Policy]

[x] I consent to Telegram sharing my profile data (name, username, photo)
    with Cosmo for account creation.  [link: Learn more]
```

**Account settings screen (in-game menu):**
- "Privacy & Legal" section with links to all documents
- "Delete my account" button → calls `DELETE /auth/me` (to be implemented)
- "Download my data" button → calls `GET /consents/export` (future)

**On Stars purchase:**
- Checkbox or inline notice: "By completing this purchase you agree to the [Purchase Terms]."

### 7.2 Telegram Bot (if future webhook bot is added)
- On `/start`: send inline keyboard with "Accept Terms" button
- Record consent via `POST /consents` before allowing gameplay commands

### 7.3 CRM (crm/src)
- Footer links: Privacy Policy, Terms
- Admin: view consents log per user via CRM player page

---

## 8. Consent Flow (API)

See [consents route](../../server/src/routes/consents.ts) for implementation.

### Record consent
```
POST /consents
Authorization: Bearer <token>
{
  "consentType": "privacy_policy",   // see enum below
  "version": "1.0",
  "metadata": { "source": "onboarding" }
}
```

### Get user consents
```
GET /consents
Authorization: Bearer <token>
```

### Revoke consent
```
DELETE /consents/:consentType
Authorization: Bearer <token>
```

### Consent types enum
| Value | Meaning |
|-------|---------|
| `privacy_policy` | Privacy Policy acceptance |
| `terms_of_service` | Terms of Service acceptance |
| `telegram_data` | Telegram profile data sharing |
| `marketing` | Marketing communications (optional) |

---

## 9. TODO Before Launch

- [ ] Fill all `[PLACEHOLDERS]` in every document (legal entity name, address, ОГРН/ОГРНИП, email, website URL)
- [ ] Get legal review by a qualified lawyer (especially dpa-ru.md for 152-ФЗ compliance)
- [ ] Host documents at a public URL (e.g. `https://[WEBSITE]/legal/privacy-policy`)
- [ ] Update Telegram Bot / Mini App manifest with policy URLs
- [ ] Implement onboarding consent checkboxes in `mobile/cosmo-miner`
- [ ] Implement account deletion endpoint `DELETE /auth/me`
- [ ] Implement data export endpoint `GET /consents/export`
- [ ] Add consent recording to Telegram auth flow (`POST /telegram/auth`)
- [ ] Rotate all documents on any material change; bump version; re-request consent if required
- [ ] Register as data operator with Роскомнадзор (if processing Russian citizens' data)
- [ ] Set up DPA agreements with all sub-processors
- [ ] Configure log retention (90-day rotation in server logging config)
