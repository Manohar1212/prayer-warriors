# Prayer Warriors — Mobile App Product & Technical Plan

## Product Overview

Prayer Warriors is a private Christian women’s fellowship app for a small group of approximately 10 members.

Core capabilities:

- Private group communication
- Prayer requests and prayer support
- Group audio/video conference calls
- Song and worship-resource sharing
- Scripture sharing
- Personal prayer journaling
- Offline contribution and expense tracking
- Transparent financial reporting
- Admin/member management
- Push notifications

### Product philosophy

The app should feel like a **private prayer circle**, not a social-media platform.

The experience should be:

- Peaceful
- Trustworthy
- Feminine but not overly decorative
- Christian
- Premium
- Simple
- Easy for non-technical users

---

# 1. Recommended Technology Stack

| Area | Technology |
|---|---|
| Mobile | React Native + Expo |
| Language | TypeScript |
| Navigation | Expo Router |
| UI | NativeWind + custom design system |
| Backend | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Audio/Video | LiveKit |
| Push Notifications | Expo Notifications + FCM/APNs |
| Admin Web App | Next.js + TypeScript |
| Admin Hosting | Vercel |
| Mobile Builds | Expo EAS |
| Error Monitoring | Sentry |
| Analytics | PostHog or Firebase Analytics |
| Source Control | Git + GitHub |

---

# 2. High-Level Architecture

```text
                         PRAYER WARRIORS
                               |
             +-----------------+-----------------+
             |                 |                 |
             v                 v                 v
      React Native         Next.js Admin      LiveKit
       Mobile App          Web Dashboard     Audio/Video
             |
             v
          Supabase
     +-------+--------+---------+
     |       |        |         |
     v       v        v         v
   Auth   PostgreSQL Storage  Realtime
     |
     v
 Push Notifications
```

### Responsibilities

**React Native / Expo**
- Member-facing mobile app
- Navigation
- UI
- Camera/microphone permissions
- Notifications
- Local caching

**Supabase**
- Authentication
- Database
- Storage
- Realtime
- Server-side functions
- Authorization

**LiveKit**
- Group audio/video calls
- Participant management
- Call rooms

**Next.js**
- Admin dashboard
- Financial management
- Reports
- Member management
- Resource/content management

---

# 3. User Roles

## Admin

Admin can:

- Invite members
- Deactivate/remove members
- Manage group information
- Schedule calls
- Manage resources
- Manage financial records
- Add/edit expenses
- Add/edit contributions
- Generate reports
- View audit logs
- Manage notifications

## Member

Members can:

- View group
- View other members
- Create prayer requests
- Respond “I’m Praying”
- Mark prayers as answered
- Join group calls
- Share songs
- Share scripture
- Share permitted documents
- Maintain private prayer journal
- View permitted financial information
- Submit contribution records

### Security rule

Authorization must be enforced by the backend/database, not only by hiding buttons in the UI.

Use Supabase Row Level Security (RLS).

---

# 4. Main Mobile Navigation

Use five primary tabs:

```text
Home | Prayer | Community | Resources | Funds
```

Profile/settings should be accessible from the top-right avatar.

Avoid a crowded navigation bar.

---

# 5. Screen Inventory

## Authentication

1. Splash Screen
2. Welcome Screen
3. Login
4. OTP Verification
5. Invitation / Join Group
6. Account Setup

## Main Application

7. Home
8. Prayer Requests
9. Prayer Request Detail
10. Create Prayer Request
11. Community / Members
12. Member Profile
13. Group Call Lobby
14. Active Group Call
15. Call History
16. Resources
17. Resource Detail
18. Add Resource
19. Scripture Detail
20. Prayer Journal
21. Funds Dashboard
22. Contribution Detail
23. Add Contribution
24. Expense Detail
25. Add Expense
26. Financial Report
27. Notifications
28. Profile / Settings

---

# 6. Home Screen

The Home screen should be a calm summary of the group.

Components:

- Greeting
- Today's scripture
- Upcoming group call
- Recent prayer requests
- Recent shared resources
- Quick actions
- Notification indicator

Quick actions:

```text
Prayer Request
Join Call
Share Song
Share Scripture
```

Example:

```text
Good evening
Prayer Warriors

Today's Scripture
"The prayer of a righteous person is powerful..."
James 5:16

Quick Actions
[ Prayer ] [ Call ]
[ Song ]   [ Word ]

Recent Prayer Requests
...

Upcoming Group Prayer
Today · 7:00 PM
[ Join Call ]
```

---

# 7. Prayer Module

Prayer is one of the primary features.

## Prayer Request

Fields:

- Title
- Description
- Category
- Urgency
- Visibility
- Created date
- Status

Categories:

- Family
- Personal
- Work
- Spiritual
- Relationships
- Other

Statuses:

```text
Active
Answered
Archived
```

## “I’m Praying”

When a member taps **I’m Praying**, store:

```text
prayer_request_id
member_id
prayed_at
```

Display:

> 7 members are praying for you.

Do not treat this as a normal social-media like.

## Answered Prayer

Members can mark a request as answered.

Optional:

- Testimony
- Date answered
- Image/document

---

# 8. Private Prayer Journal

Each member gets a private journal.

**Prayer Journal is private by default.**

Example:

```text
My Prayer Journal

September 2026

Family
Career
Spiritual Growth
Friends

Answered Prayers

New opportunity
Safe journey
Family breakthrough
```

Database authorization must ensure other members cannot access another member’s journal.

---

# 9. Community

Because the group is small, the community should feel intimate rather than social-media-like.

Display:

- Member photo
- Name
- Optional availability state
- Call button
- Profile

Example:

```text
Prayer Warriors

10 Members

Sarah    Mary    Anna
Ruth     Grace   Esther
...
```

Avoid:

- Follower counts
- Popularity metrics
- Public likes
- Competitive social features

---

# 10. Conference Calling

Use **LiveKit** instead of implementing WebRTC infrastructure from scratch.

## Call features

### V1

- Group audio call
- Optional video
- Mute/unmute
- Camera on/off
- Speaker
- Participant list
- Leave call
- Call room
- Call history

## Call flow

```text
Scheduled Call
      |
      v
Call Reminder
      |
      v
Call Lobby
      |
      v
Join LiveKit Room
      |
      v
Group Call
      |
      v
Leave
      |
      v
Call History
```

For approximately 10 members, this architecture is suitable.

Start audio-first if desired and add video once the core call flow is reliable.

---

# 11. Resources Module

Create three major categories:

```text
Songs
Scripture
Prayers
```

Optional future categories:

- Sermons
- PDFs
- Devotionals
- Images
- Announcements

## Songs

Members can share:

- Song title
- Artist
- YouTube link
- Spotify link
- Audio file when rights allow
- Lyrics when permitted
- Personal note

### Copyright

Do not automatically redistribute copyrighted music.

Prefer legitimate platform links unless the group owns or has permission to distribute the audio.

## Scripture

Members can share:

- Bible verse
- Reference
- Personal note

Features:

- Save
- Share with group
- Search
- Recently shared

---

# 12. Funds / Financial Ledger

The initial finance system should be an **offline accounting and transparency system**, not a payment gateway.

The app records money collected or spent offline.

## Funds Dashboard

```text
Funds Dashboard

Current Balance
₹48,500

This Month

Collected     ₹25,000
Expenses       ₹8,500
----------------------
Balance       ₹16,500

Recent Transactions

+ ₹5,000  Sarah
+ ₹2,000  Mary
- ₹3,500  Hall
- ₹2,000  Food
```

---

# 13. Contributions

Fields:

```text
Member
Amount
Date
Payment Method
Reference
Note
Receipt
Created By
```

Payment methods:

- Cash
- Bank Transfer
- Other

Example:

```text
Add Contribution

Member
Sarah

Amount
₹5,000

Date
07 Sep 2026

Payment Method
Cash

Reference
September contribution

[ Save ]
```

---

# 14. Expenses

Fields:

```text
Category
Amount
Paid To
Date
Description
Receipt
Created By
```

Suggested categories:

- Hall
- Food
- Transport
- Charity
- Event
- Supplies
- Other

---

# 15. Financial Reports

Monthly report:

```text
September 2026

Opening Balance     ₹32,000

Contributions
Sarah                ₹5,000
Mary                 ₹3,000
Anna                 ₹2,000
----------------------------
Total                ₹10,000

Expenses
Hall                 ₹3,500
Food                 ₹2,000
Transport            ₹1,000
----------------------------
Total                 ₹6,500

Closing Balance      ₹35,500
```

Allow:

- Monthly report
- Date-range report
- Contribution report
- Expense report
- Member contribution report
- PDF export
- CSV/Excel export

---

# 16. Financial Audit Trail

Every financial change should record:

```text
created_at
created_by
updated_at
updated_by
```

Also maintain a separate audit table.

Example:

```text
Expense #1024

Amount: ₹3,500
Category: Hall

Created by: Sarah
07 Sep 2026 · 6:32 PM

Modified by: Mary
07 Sep 2026 · 6:45 PM

Reason:
Corrected amount
```

Avoid silently overwriting financial history.

---

# 17. Notifications

Push notifications should cover:

- New prayer request
- Someone is praying for your request
- Prayer request answered
- Group call reminder
- New song
- New scripture
- New announcement
- Contribution recorded
- Expense recorded

Add notification preferences so members can control non-critical notifications.

---

# 18. Authentication Strategy

This is a private group.

Do not build an open public signup experience.

Preferred flow:

```text
Admin
 |
 | Invite
 v
Member receives invitation
 |
 v
Login / OTP
 |
 v
Create profile
 |
 v
Join Prayer Warriors
```

Recommended initial authentication:

**Phone OTP or email OTP**

---

# 19. Database Schema

Recommended initial tables:

```text
profiles
groups
group_members

prayer_requests
prayer_responses
prayer_updates

prayer_journal

resources
resource_categories

calls
call_participants

contributions
expenses
financial_categories
financial_audit_logs

notifications
device_tokens
```

## profiles

```text
id
user_id
display_name
avatar_url
phone
email
created_at
updated_at
```

## groups

```text
id
name
description
created_by
created_at
updated_at
```

## group_members

```text
id
group_id
user_id
role
status
joined_at
```

Roles:

```text
admin
member
```

---

# 20. Prayer Tables

## prayer_requests

```text
id
group_id
user_id
title
description
category
urgency
visibility
status
created_at
updated_at
answered_at
```

## prayer_responses

```text
id
prayer_request_id
user_id
response_type
created_at
```

Initially:

```text
response_type = praying
```

---

# 21. Resources Tables

## resources

```text
id
group_id
created_by
category_id
title
description
resource_type
url
storage_path
created_at
updated_at
```

resource_type:

```text
song
scripture
prayer
document
link
```

---

# 22. Call Tables

## calls

```text
id
group_id
title
scheduled_at
started_at
ended_at
room_name
created_by
status
```

## call_participants

```text
id
call_id
user_id
joined_at
left_at
```

---

# 23. Finance Tables

## contributions

```text
id
group_id
member_id
amount
payment_method
reference
note
receipt_path
transaction_date
created_by
created_at
updated_at
```

## expenses

```text
id
group_id
category_id
amount
paid_to
description
receipt_path
transaction_date
created_by
created_at
updated_at
```

## financial_audit_logs

```text
id
group_id
user_id
entity_type
entity_id
action
old_values
new_values
reason
created_at
```

---

# 24. Security

Use Supabase Row Level Security.

Rules should include:

### Members

Can:

- Read permitted group data
- Create their own prayer requests
- Update their own prayer requests according to policy
- Respond to prayer requests
- Access their own journal
- Create permitted resources

### Admin

Can:

- Manage members
- Manage group
- Manage calls
- Manage resources
- Manage financial records
- View financial audit logs
- Generate reports

### Private journal

A member can only read/write their own journal.

### Financial records

Financial permissions should be explicitly defined.

Recommended default:

- Members can read transaction summaries.
- Only admins can edit/delete financial records.
- All changes are audited.

---

# 25. File Storage

Recommended storage structure:

```text
profiles/
songs/
documents/
scriptures/
receipts/
```

Receipts should be stored in a private bucket.

Use signed URLs where necessary.

---

# 26. Design System

## Visual direction

Primary:

**Deep Forest Green**

Secondary:

**Warm Gold**

Background:

**Warm Ivory / Cream**

Accent:

**Soft Rose / Dusty Pink**

## Typography

Display:

**Elegant serif**

UI:

**Modern sans-serif**

Possible pairing:

```text
Playfair Display
+
Inter
```

The logo can be detailed and elegant.

The application UI should be simpler.

Do not repeat the detailed logo illustration everywhere.

## UI principles — Do

- Generous whitespace
- Rounded cards
- Soft shadows
- Subtle gold accents
- Calm transitions
- Clear icons
- Readable text
- Large touch targets

## Avoid

- Overly decorative screens
- Excessive gradients
- Excessive gold
- Social-media engagement metrics
- Crowded navigation
- Tiny typography
- Too many animations

## Suggested color tokens

```text
primary:      #173E32
primaryDark:  #0E2A22
gold:         #B98224
goldLight:    #E7C46A
cream:        #FAF7F0
surface:      #FFFFFF
rose:         #D99A9A
text:         #202521
textMuted:    #70756F
border:       #E6E0D5
```

---

# 27. Logo System

Current brand direction:

- Serene praying woman
- Christian cross
- Circular/halo element
- Gold/brown treatment
- Clean wordmark
- No leaves

Create variants:

```text
Full Logo
Icon Only
Horizontal Logo
Monochrome Logo
Dark Background Logo
Light Background Logo
```

The logo should work for:

- App icon
- Splash screen
- Website
- Admin dashboard
- Social media
- Printed documents
- PDF reports
- App Store
- Google Play

---

# 28. Admin Dashboard

Build a separate web dashboard.

Example:

```text
PRAYER WARRIORS ADMIN

Members              10
Active Requests       8
Upcoming Calls        2
Current Balance  ₹48,500

Recent Activity

Quick Actions
Add Member
Add Expense
Add Contribution
Schedule Call
Generate Report
```

Admin navigation:

```text
Dashboard
Members
Prayer Requests
Resources
Calls
Contributions
Expenses
Reports
Audit Logs
Settings
```

---

# 29. Development Phases

## Phase 1 — Foundation

Build:

- Expo project
- TypeScript
- Expo Router
- Design system
- Supabase project
- Database migrations
- Authentication
- Environment configuration
- Basic CI/CD

Deliverable:

**App can authenticate and navigate.**

## Phase 2 — Group & Profiles

Build:

- Member profiles
- Group membership
- Admin/member roles
- Invite flow
- Community screen

Deliverable:

**Private 10-member community works.**

## Phase 3 — Prayer

Build:

- Prayer requests
- Request detail
- I’m Praying
- Answered prayers
- Prayer journal
- Realtime updates

Deliverable:

**Complete prayer workflow.**

## Phase 4 — Resources

Build:

- Songs
- Scripture
- Prayers
- Resource upload/link
- Storage integration

Deliverable:

**Private resource library.**

## Phase 5 — Group Calling

Build:

- Call scheduling
- Call lobby
- LiveKit integration
- Audio/video
- Participants
- Call history
- Push reminders

Deliverable:

**Reliable 10-member group calls.**

## Phase 6 — Finance

Build:

- Funds dashboard
- Contributions
- Expenses
- Categories
- Receipts
- Balance calculations
- Audit logs

Deliverable:

**Transparent group accounting.**

## Phase 7 — Reports

Build:

- Monthly reports
- Date filters
- Contribution reports
- Expense reports
- PDF export
- CSV/Excel export

Deliverable:

**Clear financial reporting.**

## Phase 8 — Admin

Build:

- Admin authentication
- Member management
- Prayer management
- Resource management
- Call management
- Finance management
- Reports
- Audit logs

Deliverable:

**Complete administration system.**

## Phase 9 — QA & Launch

Test:

- Authentication
- Permissions/RLS
- Prayer workflows
- Notifications
- File uploads
- Calls
- Financial calculations
- Audit logs
- Poor-network conditions
- Android
- iOS
- Different screen sizes

Then:

- Production Supabase
- Production admin
- Android build
- iOS build
- Error monitoring
- Analytics
- Backups

---

# 30. MVP Priority

## Must Have

```text
Authentication
Members
Home
Prayer Requests
I’m Praying
Group Calls
Songs
Scripture
Funds
Contributions
Expenses
Notifications
```

## Should Have

```text
Prayer Journal
Answered Prayers
Receipts
Reports
Audit Logs
Admin Dashboard
```

## Later

```text
Advanced analytics
Daily devotionals
AI prayer assistance
Public communities
Multiple prayer groups
Advanced event management
Payment gateway
Chat
```

---

# 31. Important Product Decision

Do not introduce a payment gateway in V1 unless the client specifically needs online payments.

The current requirement is:

**Collect funds offline + maintain a clear account.**

Therefore V1 should focus on:

```text
Record
+
Track
+
Verify
+
Report
```

rather than:

```text
Collect online payments
```

This keeps V1 simpler and reduces financial/payment complexity.

---

# 32. Future Scalability

Although the first group has approximately 10 members, structure the database around:

```text
User
  |
  +--- Group A
  |
  +--- Group B
  |
  +--- Group C
```

Do not hard-code the assumption that there is only one group.

This allows the app to eventually support multiple Prayer Warriors groups without redesigning the database.

---

# 33. Claude Code Development Strategy

Implement the application feature-by-feature.

**Do not ask Claude Code to build the entire application in one prompt.**

Each feature should be:

1. Implemented
2. Tested
3. Reviewed
4. Security-checked
5. Committed
6. Then followed by the next feature

Recommended sequence:

```text
1. Project setup
2. Design system
3. Supabase schema
4. Authentication
5. Group/member management
6. Home
7. Prayer module
8. Resources
9. Notifications
10. LiveKit calls
11. Finance
12. Reports
13. Admin dashboard
14. Security/RLS review
15. Testing
16. Production deployment
```

---

# 34. Suggested Repository Structure

```text
prayer-warriors/
│
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── services/
│   │   └── types/
│   │
│   └── admin/
│       ├── app/
│       ├── components/
│       ├── features/
│       ├── lib/
│       └── types/
│
├── packages/
│   ├── ui/
│   ├── types/
│   └── config/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── security.md
│   └── product.md
│
└── README.md
```

---

# 35. Definition of Done

A feature is not complete until:

- UI is implemented
- Loading state exists
- Empty state exists
- Error state exists
- Backend validation exists
- RLS/security rules exist
- Responsive layout is checked
- Android is tested
- iOS is tested where applicable
- Accessibility is considered
- Notifications work where required
- Database migration exists
- TypeScript has no errors
- Important logic is tested
- Code is committed

---

# 36. Final Product Recommendation

Build V1 as a **private, invite-only 10-member prayer community**.

The strongest product pillars are:

1. **Prayer** — requests, praying responses, answered prayers
2. **Fellowship** — members and group calls
3. **Resources** — songs, scripture and prayers
4. **Accountability** — transparent offline fund tracking
5. **Trust** — permissions, audit logs and private journals

The product should feel less like a social network and more like a **beautiful private digital prayer room**.

Start with the architecture and security correctly, then build each module incrementally.
