# Prompt: UI designs for the Prayer Warriors app

You are a senior mobile product designer. Design high-fidelity UI mockups for **Prayer Warriors**, a private mobile app for a Christian women's prayer fellowship of about 10 members in India. Members share prayer requests, pray for each other, share songs and scripture, read the Bible in English and Telugu, join group prayer calls, and see the group's small fund. One member is the admin.

Produce one mockup per screen listed below, at iPhone size (390 × 844 pt), plus a short note per screen on layout choices. Keep the app's existing brand, do not invent a new palette or new typefaces.

## Brand and feel
- Mood: calm, warm, devotional, like a well-set prayer book. Not a dashboard, not a social feed.
- Colors: forest green `#173E32` (primary), deep forest `#0E2A22`, gold `#B98224` (accent for rules, meta lines, active states), pale gold `#E7C46A`, cream `#FAF7F0` (page background), white `#FFFFFF` (surfaces), ink `#202521` (text), muted grey-green `#70756F`, hairline `#E6E0D5`. Soft tints used sparingly: sage `#DCE9DF`, blush `#F6E2DE`, honey `#F6E9CB`, rose `#D99A9A` / deep rose `#A8514D` for urgent or destructive.
- Type: Montserrat only (bold for headings, italic for scripture and testimonies, regular, medium and semibold for everything else). Telugu text uses Noto Serif Telugu and Noto Sans Telugu.
- Layout rules: 16 pt side margins; lists are hairline-separated rows on cream, not bordered cards; at most one boxed, emphasized element per screen; sentence case labels, no all-caps; no arrows in copy; buttons say what they do ("Post request", "Record contribution").
- Navigation: bottom tab bar with Home, Prayer, Community, Resources, Funds. Secondary screens open as modals or pushed pages with a serif title in the header. A bell with an unread count and a profile avatar sit in every tab header.

## Screens

### 1. Welcome (signed out)
Deep forest background. Brand mark (thin gold ring with a slender cross), app name in large cream serif, the verse "For where two or three gather in my name, there am I with them." Matthew 18:20 in italic, one cream "Sign in" button, small note "Membership is by invitation from your group admin."

### 2. Sign in
Heading "Sign in", helper "Use the email your group admin added." Email and password fields, "Sign in" button, "Forgot your password?" link.

### 3. Forgot password
Email field, "Send reset link" button, confirmation state after sending.

### 4. Account setup (first sign-in)
Asks for display name and optional mobile number, "Continue" button.

### 5. Home
Date line, greeting "Good morning, {first name}", bell with unread count and avatar on the right. Verse of the day set large in italic serif with a short gold rule and the reference (English or Telugu). "Quick actions": four tiles (Prayer, Call, Song, Word). "Prayer requests" section with the top three requests as rows (title, author, category dot, urgent flag, praying count) and "See all". "Recently shared" with three rows (icon disc, title, type and sharer). "Group prayer" box in forest green with the next call's title and time and a Join or View button.

### 6. Prayer (tab)
Underline tabs "Active" and "Answered", a small "Journal" link on the same line. Each request is a row: meta line (category dot, "Urgent" in deep rose), title in serif, two lines of detail, then "{author} · {n} praying" and an "I'm praying" pill that becomes a filled "Praying" pill. Round forest floating button with a gold plus for a new request. Empty state: "No requests yet / Share what is on your heart and the group will pray with you."

### 7. Prayer request detail
Meta line, title in large serif, "{author} · {date}", the full description, an "I'm praying / You're praying" button, a section "{n} members are praying" with names. If answered: a gold side-rule block with "Answered {date}" and the testimony in italic serif. The author or admin sees "Mark as answered" which reveals a testimony field.

### 8. New prayer request (modal)
Helper "Everyone in the group will see this and can pray with you." Fields: "What can we pray for?", "Details (optional)" multi-line, category chips (Family, Personal, Work, Spiritual, Relationships, Other), an "Urgent" toggle row with explanation "Shown first, with an Urgent tag.", "Post request" button.

### 9. My private journal (list)
Private notes only the member can see. Rows: meta line (category, "Answered"), date on the right, title, two lines of body. Button to add an entry. Empty state explaining the journal is private.

### 10. Journal entry (modal)
Title, body multi-line, category chips, "Mark as answered" toggle with answered date, save and delete.

### 11. Community (tab)
"Group calls" heading with "History" link and, for admins, a compact "Schedule" pill. The next call as the one boxed element (honey while scheduled, sage while live): time or "Happening now", title, "{n} joined", a "Join" or "Details" pill. Then "{n} members" heading with a compact "Add member" pill for admins, and member rows (initial in a tinted circle, name, "Admin" under admins).

### 12. Add member (modal, admin)
Helper "They will get a starting password to sign in with, which you share with them." Fields: Name, Email, Mobile number (optional). After adding: a success view showing the starting password with a copy action and "Done".

### 13. Schedule a call (modal, admin)
Helper "Members can join from 15 minutes before the start time until you end the call." Fields: Title, Date, Time. "Schedule call" button.

### 14. Call lobby and in-call
Lobby: call title in large serif, time, a gold side-rule status block ("Scheduled" / "Happening now" / "Ended", who is on the call), mic and camera toggles, a "Join call" button (disabled until 15 minutes before), admin "End call" and "Cancel call". In-call: grid of participant tiles with name and speaking indicator, controls for mute, camera, speaker, leave; admin end.

### 15. Call history
Rows: status ("Ended" / "Cancelled"), date, title, "{n} joined".

### 16. Resources (tab)
Underline tabs "Songs", "Scripture", "Prayers" with a "Bible" link on the same line. A pill search field. Rows: title in serif, gold reference (e.g. Psalm 46:10 or artist), body preview (scripture in italic serif), meta "Shared by {name} · Link". Floating button to share. Empty states per tab.

### 17. Resource detail
Meta line (type dot, "Shared by {name}"), title in large serif, gold reference, date. For songs a "Play" button when a link exists. Scripture body as a gold side-rule block in italic serif; other bodies as plain text. Optional note with a speech-bubble icon. "Remove" for the sharer or admin with a confirm step.

### 18. Share something (modal)
Type chips (Song, Scripture, Prayer). Fields change by type: song = title, artist, link, a line of lyrics; scripture = reference, verse text, link; prayer = title, prayer text. "Share" button.

### 19. Bible home
Underline tabs "English" and "తెలుగు", pill "Search the Bible", a "Continue reading" honey box with the last book and chapter, then "Old Testament" and "New Testament" headings with book names as small tonal tiles.

### 20. Bible book (chapters)
Book name, "Choose a chapter", a grid of numbered square tiles.

### 21. Bible chapter reader
Breadcrumbs "Books › Genesis", a text-size toggle, language tabs. Verses run as continuous text with small gold verse numbers. Tapping a verse highlights it in honey and reveals the same verse in the other language plus "Copy", "Share", "Post to group". "Previous" and "Next" chapter controls at the bottom.

### 22. Bible search
Search field, match count, result rows with "Book chapter:verse" in green and the verse text with the match in bold.

### 23. Funds (tab)
A forest green box: "Current balance" with the amount in large serif (Indian grouping, e.g. ₹48,500), "September collected" and "September expenses" beneath. For admins, compact pills "Record contribution" and "Record expense". Links "Monthly report" and "Change history". "Recent transactions" heading over rows: arrow disc (sage for money in, blush for money out), name or payee, "Cash · 8 Sep", amount right-aligned in green or deep rose.

### 24. Contribution (modal, admin)
Member chips, Amount (₹), Date, Payment method chips (Cash, Bank, Other), Reference, Note. "Record contribution". When editing: "Reason for this change" and a delete step.

### 25. Expense (modal, admin)
Category chips (Hall, Food, Transport, Charity, Event, Supplies, Other), Amount, Paid to, Description, Date. "Record expense". Same edit and delete rules.

### 26. Monthly report
Month picker, totals for collected, spent and balance, breakdown by member and by category, "Export CSV".

### 27. Change history (admin)
Audit rows: who changed what, when, before and after values, reason.

### 28. Notifications
"{n} new" with "Mark all read" and a settings icon. Rows: tinted icon disc by type, title ("New prayer request", "{name} is praying for you", "Group call scheduled", "Contribution recorded"), body, "7 min ago", gold dot when unread. Empty state "You're all caught up".

### 29. Notification settings
Six switches with one-line descriptions: New prayer requests, Someone is praying for you, Answered prayers, Group calls, Songs, scripture and prayers, Funds. Note that the phone reminds 10 minutes before a call.

### 30. Profile
Large initial in a forest circle, name in serif, email, a "Notification settings" row, "Sign out".

## Deliverables
For each screen: the mockup, then 2–3 sentences on hierarchy and spacing. Also propose one consistent set of components (buttons, chips, inputs, rows, meta line, section header, floating action button, empty state) with sizes and states (default, pressed, disabled, error). Show at least one screen with Telugu content. Keep everything within the palette and type above.
