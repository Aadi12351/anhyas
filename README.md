# अभ्यास — MPSC गट क तयारी

A Marathi practice app with email/password JWT sessions, an alternative dispatch-owned ChatGPT sign-in, and D1-backed personal profiles, timed attempts and scores. It starts owner-private. Public or invited access must be configured separately before other learners can use it.

## Exam behavior

- Full mixed practice: 100 MCQs / 60 minutes; +1 correct, -0.25 wrong, 0 skipped.
- The 50% net-score target is an app practice target, not an official cutoff or eligibility rule.
- Server timestamps enforce expiry; late answers are rejected. Selected answers autosave. Closed exams are finalized on the next authenticated request after their deadline.
- Keys stay server-side until submission. Every attempt lookup includes the authenticated learner ID.
- Browser timings are advisory. This is practice software, not a proctored admissions system.

## Content coverage

The server catalog currently has 31,851 MCQs/variants: 19,000 algorithmic maths/reasoning variants, 12,600 statement-analysis variants, 179 directly sourced factual questions and 72 legacy foundational questions. The structured variants use the 179 source-backed fact records, so variant count is not independent factual coverage. There are 49 main subtopics with at least 100 questions at each of the three difficulty levels, plus five shorter legacy foundational collections.

Selection uses topic, subtopic/year and difficulty; all three filters are enforced server-side. A full 100-question mixed practice paper includes all eight subjects and the 2024, 2025 and 2026 current-affairs year pools. The subject allocation is an editorial practice allocation, never an official MPSC weightage. Previously unseen IDs from the last 20 attempts are preferred, then finite pools are reused. Editorial difficulty is not examiner-calibrated.

Current-affairs coverage consists of selected dated source-checked events, not exhaustive annual coverage. Source links and check dates appear only after submission. Sources include NCERT/SATHEE, RBI, BIPM, Maharashtra government, ISRO, PIB, UNESCO, MHA and IOC. Independent human subject-expert review remains outstanding; the app labels source-based automatic practice accordingly. No live paid AI API integration is configured. The authoring prompt has been removed from the learner flow.

Maths/reasoning reviews show numbered solution steps; factual reviews show truth checks and option explanations. The dashboard uses actual catalog counts. Old results and active attempts retain their original question snapshots. The additive subtopic migration preserves existing records. History queries strip large review payloads in SQL, and repeat-avoidance fetches only question IDs to keep memory bounded.

## Validation

Run `node tests/bank-check.mjs`, `node tests/quantitative-check.mjs`, then `node tests/routes-check.mjs`, and `node node_modules/typescript/bin/tsc --noEmit`. Route tests use a temporary in-memory SQLite database and mock identity, never production data. Browser QA has not been run because the supported browser-control skill is unavailable.

## Storage and authentication

Schema migrations live in `drizzle/`; Sites applies them during publication. D1 uses `DB`. Runtime secrets `AUTH_JWT_SECRET` and `AUTH_PASSWORD_PEPPER` are configured as hosted secrets, never committed. Preserve both when moving hosting; changing the pepper invalidates existing password hashes and recovery codes. Secret rotation requires an explicit migration plan.

Email/password login is explicitly requested by the owner. Passwords are HMAC-prehashed with a secret pepper and stored using salted bcrypt cost 12; the prehash avoids bcrypt's input-length truncation. JWTs use HS256, fixed issuer/audience, expiry checks and server-side revocable session records. Session cookies use `__Host-`, Secure, HttpOnly and SameSite=Lax. Default sessions last 12 hours; Remember Me lasts 7 days. No auth tokens are stored in localStorage.

State-changing authentication and account requests require a same-origin Origin and bounded JSON bodies. Persistent account/IP rate limits protect sign-in and recovery. Password changes and recovery revoke previous sessions. Recovery codes are 256-bit random values, shown once and stored only as keyed hashes; using a code replaces it. Email verification and email-based reset are not configured; the app clearly labels this and uses recovery codes instead.

ChatGPT authentication remains dispatch-owned. `/api/auth/chatgpt` exchanges a platform-authenticated identity for an app session. Existing records stay under their original stable user key. Legacy progress can be linked during registration only to the verified current platform identity with the same email. Email matches never auto-link accounts. The Sites access policy remains private and is separate from app login; it must be explicitly changed before visitors without platform access can reach the app.

`My Account` supports name/goal edits, daily study targets, all-time score/topic analytics, an export of profile and up to 500 completed attempt summaries, active sessions, password changes and recovery-code replacement. Password hashes, recovery hashes and session tokens are excluded from these responses. No production account credentials are created by tests.

Run `node tests/auth-check.mjs`, `node tests/account-check.mjs`, `node tests/routes-check.mjs` and the TypeScript check. Browser QA remains unavailable because the supported browser-control skill is absent. Embedded visitors are directed to a full browser tab for first-party secure-cookie login.
