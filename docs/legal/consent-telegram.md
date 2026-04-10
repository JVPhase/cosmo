# Consent for Telegram Profile Data / Согласие на обработку данных Telegram

**Version:** 1.0 | **Версия:** 1.0  
**Effective:** 2026-04-11

---

## EN — Consent Text (display on first launch)

> **Copy this text verbatim into the onboarding screen.**

---

### Short form (checkbox label)

```
I consent to Cosmo receiving and processing my Telegram profile data
(name, username, profile photo, language) to create and manage my game account.
[Privacy Policy]
```

### Full consent text (accessible via "Learn more" link)

---

**Consent to Processing of Telegram Profile Data**

By tapping "Start Playing" or checking the box below, you give your **free, specific, informed, and unambiguous consent** to **[OPERATOR]** to process the following personal data transmitted by the Telegram platform:

| Data | Purpose |
|------|---------|
| Telegram numeric ID | Unique account identifier |
| First name, last name | Display name in the game |
| Username (@handle) | Account reference |
| Profile photo URL | Avatar display |
| Language code | Interface localisation |
| Telegram Premium status | Feature unlocks |

**Legal basis:** Your consent (Art. 6(1)(a) GDPR / ст. 6 ч.1 п.1, ст. 9 152-ФЗ).

**Data controller:** [OPERATOR], [EMAIL]

**Retention:** Your profile data is stored while your account is active and for 30 days after deletion.

**Your rights:** You may withdraw this consent at any time via Settings → Privacy, or by contacting [EMAIL]. Withdrawal does not affect any processing already carried out.

**More information:** [Privacy Policy] | [Terms of Service]

---

## RU — Текст согласия (отображается при первом запуске)

> **Скопируйте этот текст дословно на экран онбординга.**

---

### Краткая форма (надпись у чекбокса)

```
Я даю согласие на получение и обработку данных моего профиля Telegram
(имя, username, фото, язык) компанией Cosmo для создания игрового аккаунта.
[Политика конфиденциальности]
```

### Полный текст согласия (по ссылке «Подробнее»)

---

**Согласие на обработку персональных данных профиля Telegram**

Нажимая кнопку «Начать игру» или отмечая чекбокс ниже, вы даёте **свободное, конкретное, информированное и однозначное согласие** на обработку **[ОПЕРАТОРОМ]** следующих персональных данных, переданных платформой Telegram:

| Данные | Цель обработки |
|--------|---------------|
| Числовой ID Telegram | Уникальный идентификатор аккаунта |
| Имя, фамилия | Отображаемое имя в игре |
| Username (@никнейм) | Ссылка на аккаунт |
| URL фотографии профиля | Отображение аватара |
| Код языка | Локализация интерфейса |
| Статус Telegram Premium | Разблокировка возможностей |

**Правовое основание:** Согласие субъекта ПД (ст. 6 ч.1 п.1, ст. 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»).

**Оператор ПД:** [ОПЕРАТОР], [EMAIL]

**Срок хранения:** Данные хранятся пока аккаунт активен, и 30 дней после его удаления.

**Ваши права:** Вы можете отозвать согласие в любое время в Настройках → Конфиденциальность или по адресу [EMAIL]. Отзыв не влияет на законность обработки, осуществлённой до отзыва.

**Подробнее:** [Политика конфиденциальности] | [Пользовательское соглашение]

---

## Implementation Notes

### Where to show
- `mobile/cosmo-miner` — onboarding screen on first launch (before `POST /telegram/auth`)
- Both checkboxes must be ticked before the user can proceed:
  1. Terms of Service + Privacy Policy (required)
  2. Telegram profile data consent (required for Telegram auth)
  3. Marketing communications (optional, unchecked by default)

### How to record
After user ticks and submits:
```typescript
// In the onboarding submit handler, call after /telegram/auth succeeds:
await fetch('/consents', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ consentType: 'telegram_data', version: '1.0', metadata: { source: 'onboarding' } }),
});
await fetch('/consents', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ consentType: 'privacy_policy', version: '1.0', metadata: { source: 'onboarding' } }),
});
await fetch('/consents', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ consentType: 'terms_of_service', version: '1.0', metadata: { source: 'onboarding' } }),
});
```

### Consent record stored in DB
See `UserConsent` model in `server/prisma/schema.prisma`.

### Withdrawal flow
Settings screen → "Privacy" → "Manage Consents" → revoke button → `DELETE /consents/telegram_data`  
**Note:** Revoking telegram_data consent should trigger account deletion flow or at minimum prevent future logins.
