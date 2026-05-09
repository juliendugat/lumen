# Lumen — Privacy Policy

**Effective: 2026-05-09. Last updated: 2026-05-09.**

Lumen is a cycle-tracking app. This policy describes what we collect, where it goes, and what we don't do. Plain English. No legalese.

## TL;DR

- **We collect nothing.** No accounts. No servers. No analytics. No advertising.
- **All data stays on your device.** Cycles, day logs, medications, settings — stored locally in an app-sandboxed database.
- **Nothing leaves your phone unless you choose to export it.**

## What is stored on your device

- Cycle start/end dates and predicted next periods
- Per-day flow, symptoms, mood, free-text notes
- Optional: basal body temperature, cervical mucus observations
- Optional: sex / protection log (off by default; opt-in toggle)
- Optional: medications (name, dose, schedule, doses taken)
- Settings (theme, terminology, life mode, notification preferences)
- Encryption key (generated on first launch; held in your device's secure enclave — Keychain on iOS, Keystore on Android)

This is stored in a SQLite database file inside Lumen's app sandbox. Other apps cannot read it.

## What we do *not* do

- We do not operate any servers that hold your cycle data.
- We do not require an account, email, phone number, or any other identifier.
- We do not send analytics or telemetry of any kind.
- We do not include any third-party tracking SDKs.
- We do not share your data with anyone, because we do not have it.
- We do not target advertising. There is no advertising in the app.

If you put Lumen in airplane mode and use it normally, nothing breaks. There's nothing to talk to.

## Permissions

Lumen requests the following permissions, only when you actively use the relevant feature:

- **Notifications** — for the period / late / fertile reminders you opt into. Notifications are scheduled directly with iOS / Android and never send a push token to a server.
- **Face ID / Touch ID / device passcode** — only if you enable App Lock in Settings. Used to unlock the app; the biometric data itself never leaves your device.
- **HealthKit / Health Connect** *(only on builds that include this; opt-in)* — to read basal body temperature and write logged period days. Data never leaves your device.

We never request location, microphone, camera, contacts, or calendar access. The "Calendar export" feature creates a `.ics` file you choose what to do with — Lumen itself does not connect to your calendar.

## Backups

By default Lumen's database is **excluded from iCloud and Google Drive automatic backup**, so cloud copies of your cycle data don't accumulate without your knowledge.

If you want a backup, use Settings → "Export all data". This creates a JSON file on your device which you can save where you wish. To restore, import that file on the same or another device.

## Children

Lumen is suitable for users from menarche onward and includes a "Teen" mode with age-appropriate copy and a Learn tab covering cycle basics. We do not collect any data from any user, of any age.

## Changes to this policy

If this policy materially changes (it shouldn't, given the design), the in-app version will update and a "Last updated" date will reflect that. Because we have no servers and no contact details for you, we can't notify you outside the app.

## Contact

Open an issue at the project repository, or write to the support email listed in the App Store / Play Store listing.

---

*Lumen is built around the principle that cycle data is your data. The simplest way to honour that is not to have it. That's the entire architecture.*
