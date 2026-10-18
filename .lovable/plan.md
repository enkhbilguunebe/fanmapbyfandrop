# FanMap upgrade

## Goal
Upgrade the existing FanMap—not rebuild it—into a connected, mobile-first concert experience. Preserve Map, Photos, Chat and Loyalty as the only four fan tabs, with a separate artist workspace.

Lovable Cloud is now connected, and email/password sign-in is enabled. Existing screens still use the original demonstration data until the account and shared-data work below is implemented.

## 1. Accounts and shared data
- Add a branded sign-in, sign-up, forgot-password and password-reset experience. Signed-out users see sign-in before their personal pages.
- Add persistent profiles, separate protected roles, preferences and private media storage.
- Create the three labeled demonstration identities: Alex Morgan (new fan), Jasper Vale (artist/manager) and Olivia Chen (returning fan).
- Olivia starts with exactly seven verified attendances, at least five for Jasper's demo artist. Alex starts with no attendances.
- Replace client-side role switching with authenticated sessions. Demonstration shortcuts must be confined to synthetic demo accounts and demo content, never grant access to real users' data or unrestricted artist privileges.
- Keep existing fictional concerts and memories, while separating them from real account data. Make demonstration check-in limitations explicit.

## 2. Four-page design and account settings
- Retain charcoal foundations and baby-blue branding; add restrained teal verification, gold achievements and coral activity highlights.
- Use consistent top bars with personal QR on the left and profile avatar on the right, plus the floating four-tab navigation.
- Add Account & Settings: profile editing, avatar upload/crop/reposition/removal, unique usernames, bio, validated social links, public-profile preview, account details, password changes and sign-out.
- Add preferences for notifications, announcements, profile visibility and friend requests; location stays off by default.
- Add own-content management, personal-data export and account-deletion requests with clear confirmations.

## 3. Map reliability and performance
- Measure the current map before changing its behavior.
- Keep one map instance per mounted map, update callbacks safely and clean up listeners, markers and pending work.
- Preserve camera position across tab navigation and layer changes, without losing the selected concert.
- Debounce search, reduce unnecessary marker recreation and animation, and retain clustering and the three map styles.
- Verify pin selection, movement, layer switching and camera restoration on mobile and desktop. Report measured results without claiming representative-device performance from desktop simulation alone.

## 4. Concert activities and photos
- Enforce concert eligibility on the server: upcoming activities allow verified ticket holders; historical attendee-only content requires attendance.
- Ticket verification never creates attendance. Check-in uses server-controlled concert windows and atomic duplicate prevention.
- Reel Battle: camera/upload, playable preview, strict 10-second validation, actual private storage, moderation status, approved browsing and one vote per eligible fan. Closed events remain read-only for submissions.
- Predict the Night: saved answers, review and submission, deadline/submission locking, historical results and points only from organizer-confirmed outcomes.
- Letters: posting, liking/unliking, replies, editing/deleting own letters, sorting and persisted reporting; authorized artist featuring and replies.
- Photos and media access follow attendance and recipient eligibility, including authorization when sharing media in chats.

## 5. Friends, artist messages and loyalty
- Redesign Chat with prominent Friends | Artists segments, separate search state, avatars, timestamps, unread indicators and meaningful empty states.
- Add persistent accepted-friend conversations, groups and permitted event/photo sharing.
- Official artist channels remain fan read-only, with authorized audio/video playback and subscription controls.
- Connect Jasper's audience filters, recipient previews, targeted messages and exclusive media to actual shared attendance and opt-in records.
- Refresh Loyalty with identity, verified statistics, progression, collectible passport stamps, artist-specific attendance, badges and authorized rewards. Never infer consecutive tours without supporting records or imply guaranteed VIP/backstage rewards.

## 6. Saved per-concert AI guide
- Add a floating help control in upcoming/active concert sheets, opening an expandable conversation with suggestions and directions.
- Keep a **separate saved conversation for each concert**, as selected. Each has a stable page URL and remains available after closing or reloading; concert context and full message history accompany every request.
- Use real streamed AI responses through a secure server boundary, with readable formatted answers, thinking/loading states, cancellation and explicit errors.
- Provide only verified event facts. Without verified transit, gate, venue-policy or safety data, state the limitation and link reliable navigation or official information rather than inventing answers.

## 7. QR friendship connections
- Add a large personal QR containing only an expiring opaque connection token, plus profile preview and regeneration.
- Support real rear-camera scanning, permission/error states and manual username fallback.
- Require authenticated eligible verified fans on both sides. Persist requests, acceptance/rejection and duplicate/blocked-user checks; accepted connections appear in both Friends lists.

## 8. Temporary live location and meeting points
- Provide entry points from Map and accepted-friend chats without another main tab.
- Require fresh account reauthentication and explicit sharing consent before requesting foreground location permission.
- Let recipients accept viewing without sending their own coordinates. Reciprocal sharing requires independent consent and reauthentication.
- Fix expiration on the server at no later than 30 minutes after activation; never extend it through updates or renew automatically.
- Authorize every coordinate read/update. Exclude artists/managers, blocked users, declined requests and expired/stopped sessions.
- Show accuracy, last-update time, stale markers and the foreground-only limitation. Stop tracking when inactive; revoke viewing immediately on stop and remove transient coordinates promptly without movement history.
- Add proposed and mutually accepted meeting points with external directions. Do not invent safe entrances or routes through restricted venue areas.

## Technical approach
- Preserve TanStack Start, existing reusable UI components and maplibre-gl v4; keep the map lazy and browser-only.
- Use Cloud database permissions plus authenticated server functions for account-scoped data and privileged actions. Roles live separately from editable profiles.
- Keep model calls, credentials and private media authorization server-side. Streaming uses a dedicated HTTP boundary and the documented Lovable AI Gateway contract.
- Migrate existing screens incrementally onto account-scoped shared data rather than trusting or importing browser-stored demo roles, tickets or stamps.
- Use versioned validation for any retained local presentation settings. Use realtime subscriptions only where needed, with teardown and permission checks.
- Add small concrete rule tests for eligibility, deadlines, duplicate votes/check-ins, recipient filtering, QR expiration, blocked users, independent consent and 30-minute location expiration.

## Acceptance checks
- Sign in, sign out, sign up and complete password recovery; profile/avatar/preferences save and restore.
- All four pages, settings and concert sheets work on mobile and desktop; no overlapping controls or runtime errors.
- Jasper sends exclusive content to fans with five or more verified artist attendances: Olivia receives it after reload; Alex does not.
- Alex verifies a demo ticket and gains no stamp until an authorized check-in; the new attendance appears in Loyalty and Jasper's audience.
- Olivia posts a letter; Jasper reads and responds to that same saved letter.
- Upload and play a valid reel; reject a clip longer than 10 seconds and duplicate voting; closed predictions cannot change.
- Create two per-concert AI conversations, ask questions, switch/reload and confirm isolated histories and actual streamed responses.
- Connect two eligible fans by QR, accept the request and verify both Friends lists and message delivery.
- Exercise one-way and reciprocal location consent, step-up verification, stale status, stop, block and server expiration; confirm denied coordinate access after ending.

## External limits
Real ticket-provider verification, venue check-in hardware, live transit and official entrance data require their respective services or supplied authoritative data. Until connected, their demonstrations stay clearly labeled and never pretend to establish real-world attendance or safety facts. Browser live location works only while the app remains active with permission.