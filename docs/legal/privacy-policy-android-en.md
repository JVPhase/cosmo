# Privacy Policy — Mine Cosmo (Android)

**Version:** 1.0
**Effective date:** 2026-05-08
**Last updated:** 2026-05-08
**Applies to:** Mine Cosmo Android application distributed via Google Play (package `com.minecosmo.app`).

> A separate Privacy Policy applies to the Telegram Mini App version of the game; this document covers the standalone Android app only.

---

## 1. Who We Are

This application ("the App", "Mine Cosmo") is operated by **Ivan Vasilev** ("we", "us", "our"), an independent developer.

**Contact:** jvmobile.info@gmail.com

We act as the Data Controller for personal data processed under this Policy.

---

## 2. What Data We Collect

### 2.1 Anonymous analytics data (PostHog)

When you use the App, we collect anonymous usage data via PostHog:
- A randomly generated, app-scoped device identifier (not linked to your real identity, your Google account, your phone number, or any contact data)
- Device model, operating system version, App version
- In-app events: screens viewed, features used, gameplay milestones reached, errors and crashes
- Approximate session timing and duration

Analytics events are stored in the European Union region.

### 2.2 In-app purchase data (Google Play Billing)

When you make an in-app purchase:
- Product ID of the purchased item (e.g. `cosmo_credits_100`)
- Purchase token issued by Google Play
- Timestamp of the transaction

Google Play Billing handles the entire payment flow. **We do not see, store, or have access to your payment card information, billing address, or Google Account email.**

### 2.3 Advertising data (Google AdMob)

The App shows rewarded video ads served by Google AdMob. We request **non-personalised ads only**: AdMob does not build a behavioural advertising profile based on your activity in this App.

AdMob may collect technical data such as IP address, device identifiers, and ad-interaction events to deliver and measure ads. See [Google's AdMob & AdSense data disclosure](https://support.google.com/admob/answer/6128543) for details.

### 2.4 Local game data (stored on your device only)

- Save files (game progress, settings, language preference)
- Cached configuration and analytics events (when offline)

This data lives in the App's private sandbox on your device and is never shared with third parties unless you explicitly use a backup/restore feature.

### 2.5 Optional cloud save data (server-side)

If you sign in to enable cloud saves, we store on our server:
- An anonymous account identifier and JWT refresh token
- Your game state (resources, fleet, research) as a JSON blob
- Wallet balance (server-authoritative credits)

The App does **not** require an email, password, phone number, or any third-party login (Google / Apple / Facebook) to function.

### 2.6 Technical server logs

When the App contacts our server, we capture transient request logs (IP address, User-Agent string) for security and abuse prevention.

### What we do **not** collect

- Payment card or banking information
- Precise or coarse location
- Microphone, camera, photos, or contacts
- Biometric data
- SMS, call logs, or other personal device data
- Children's data (the App is not directed at children under 13)

---

## 3. How We Use Your Data

| Purpose | Legal basis (GDPR Art. 6) |
|---|---|
| Run the App, save and restore your progress | Contract (Art. 6(1)(b)) |
| Process in-app purchases and deliver purchased items | Contract |
| Show rewarded ads in exchange for in-game rewards | Consent / Legitimate interest (Art. 6(1)(f)) |
| Diagnose crashes and improve gameplay balance via analytics | Legitimate interest |
| Detect and prevent fraud, abuse, and security incidents | Legitimate interest |
| Comply with legal obligations (purchase records for tax/accounting) | Legal obligation (Art. 6(1)(c)) |

We do **not** sell your data, do **not** use it for cross-app advertising profiling, and do **not** share it with third parties for marketing.

---

## 4. Third-party Services (Sub-processors)

| Service | Purpose | Provider | Region |
|---|---|---|---|
| Google Play Billing | In-app purchases | Google LLC | Global (per Google Play Terms) |
| Google AdMob | Rewarded video ads | Google LLC | Global |
| PostHog | Anonymous product analytics | PostHog Inc. | European Union |
| Cloud hosting | API and database hosting | (See [hosting provider docs](https://github.com/JVPhase/cosmo)) | EU |

Each provider processes data only as instructed by us, under their own privacy policy:

- [Google Play Privacy Policy](https://policies.google.com/privacy)
- [Google AdMob Privacy](https://support.google.com/admob/answer/6128543)
- [PostHog Privacy Policy](https://posthog.com/privacy)

---

## 5. International Transfers

Data may be transferred outside your country of residence. Where required, we rely on the EU Standard Contractual Clauses (SCCs) or adequacy decisions to protect data crossing borders.

---

## 6. How Long We Keep Your Data

| Data | Retention |
|---|---|
| Anonymous analytics events | Up to 12 months |
| Cloud save game state (if enabled) | While account is active + 30 days after deletion request |
| Purchase records | 5 years from transaction (accounting / tax law) |
| Server request logs (IP, User-Agent) | 90 days |
| Server backups | 30 days rolling |
| Local on-device data | Until you uninstall the App or reset progress |

---

## 7. Your Rights

If you reside in the EU/EEA, UK, or another jurisdiction with equivalent rights, you may:

- Request **access** to your personal data
- Request **rectification** of inaccurate data
- Request **erasure** of your data ("right to be forgotten")
- Request **restriction** of processing
- Request **portability** of your data in a machine-readable format
- **Object** to processing based on legitimate interests
- **Withdraw consent** at any time

To exercise any of these rights, email **jvmobile.info@gmail.com**. We will respond within 30 days. You may also lodge a complaint with your national data protection authority.

You can additionally:
- Reset all local game data via in-app **Settings → Reset**
- Uninstall the App at any time, which removes all local data
- Opt out of personalised ads in your device settings (Android: Settings → Google → Ads → Reset advertising ID)

---

## 8. Children

The App is not directed at children under 13 and we do not knowingly collect data from children under 13. If you believe a child has provided us data, contact us and we will delete it promptly.

---

## 9. Security

- All network traffic is encrypted via HTTPS / TLS 1.2+
- Local save files are stored in the App's private sandbox (not readable by other apps)
- Server-side data is protected by industry-standard access controls and encrypted backups
- We follow the OWASP Mobile Top 10 guidelines for App security

---

## 10. Changes to This Policy

We may update this Policy. Material changes will be communicated through the App or the Google Play listing. The "Last updated" date at the top reflects the most recent revision. Continued use of the App after changes constitutes acceptance of the updated Policy.

---

## 11. Contact

For privacy questions, data deletion requests, or any other concerns:

**Email:** jvmobile.info@gmail.com

---

This Policy is published at: _https://[publish-via-github-pages]/privacy-policy.html_
