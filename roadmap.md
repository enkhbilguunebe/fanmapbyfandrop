# FanMap upgrade

## Judges' presentation refresh
- [x] Restyle settings to the supplied grouped profile reference while preserving controls.
- [x] Add labeled simulated friend locations, consent banner, meeting proposal and directions; refresh Find friends icon.
- [x] Populate varied artist attendance, eight or more letters, Olivia friends/chats and artist messages.
- [x] Use distinct artist pictures and uploaded passport stamps with pale backgrounds.
- [x] Verify presentation flows and existing tests.

Presentation checks: Olivia has seven demo shows across five artists, five populated friend threads and three sample artist announcements. Settings and simulated consent/meeting/directions tested; new demo chat and fan letter read back. Jasper's 40 sample letters and newest sorting render after actual demo sign-in. Mobile settings have no horizontal overflow. All 11 tests pass. Presentation content is labeled fictional, kept in memory, and never grants Cloud permissions; the public Find friends password is `fanmap`, not an account credential.

- [x] Enable Cloud and secure sign-in, profiles, demo accounts and role authorization.
- [x] Connect shared concert attendance, activities, artist moderation and targeted messages.
- [x] Refresh four fan pages, global account settings, Friends/Artists messaging and loyalty.
- [x] Fix map lifecycle, camera persistence, search and concert sheets.
- [x] Add per-concert saved AI guide with verified-information boundaries.
- [x] Add expiring personal QR connections, friend requests and camera scanning.
- [x] Add consent-based live location, step-up authentication, 30-minute server expiration and meeting points.
- [x] Test account-to-account flows, permissions, uploads and mobile layouts.

Validation: profile persistence, seven-stamp passport, targeted artist announcement, accepted-friend chat, saved AI conversation, reel upload/approval/vote, map styles/navigation, and one-way location consent/marker removal were exercised. Six automated tests pass. Physical camera scanning and background behavior require real-device verification; live venue facts and ticket-provider integration remain unavailable, and concerts/codes are labeled fictional demos.