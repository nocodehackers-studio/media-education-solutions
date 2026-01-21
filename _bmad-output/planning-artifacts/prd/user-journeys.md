# User Journeys

## Journey 1: Jeb - From Chaos to Control

Jeb runs Media Education Solutions and just landed three new contest clients in the same month. In the old days, this would mean spreadsheets, email chains, and manually sending video files to judges. He'd be up late coordinating everything, and inevitably someone would ask "did you get my submission?" or a judge would email "where do I find the videos?"

This time, Jeb logs into the platform and creates all three contests in under an hour. He defines categories, sets deadlines, and assigns judges by email. After saving each contest, he clicks "Generate Codes" to create 50 participant codes. He checks the code list — 50 fresh codes, all marked "Unused." Later, when more participants register than expected, he simply clicks the button again to generate another batch.

For the big surfing contest expecting 200 participants, he clicks "Generate More Codes" three times. Now he has 200 codes ready. He exports the list and sends it to the event organizer: "Distribute one per participant."

Over the next few weeks, Jeb checks his dashboard between meetings. He glances at the code list — 147 of 200 now show "Used." Submission counts are climbing, judge progress bars are filling up ("12/20 reviewed"), and he hasn't answered a single "how do I...?" email. When the deadline crunch hits and 50 participants upload in the final 10 minutes, he watches the numbers tick up without a single failure.

The breakthrough moment: all three contests finish the same week. Jeb generates winner pages, the system emails the Teachers/Coaches, and he's done. What used to consume his evenings now takes a glance at a dashboard.

## Journey 2: Marcus - The Reluctant Judge

Marcus is a professional photographer who's been roped into judging a youth photo contest by a friend. He's skeptical — the last time he judged something online, it was a nightmare of downloading files and filling out spreadsheets. He almost said no.

Then he gets the judge invite email. One click, and he's looking at a clean dashboard: "2 categories assigned. 0 of 35 submissions reviewed." No downloads. No spreadsheets. He clicks into the first category and sees thumbnails of photos, each labeled with just a participant code — no names, no schools, no bias.

He clicks a photo. It fills his screen beautifully. Below it: a simple rating scale (Developing Skills → Master Creator) and a text box for feedback. He rates it, writes two sentences, hits "Next." The progress bar updates: "1 of 18 reviewed."

Marcus finds his rhythm. Coffee in hand, he works through submissions in 45-minute sessions over three days. When he's done, he drags his top 3 into order and clicks "Mark Complete." A confirmation appears. He closes his laptop and thinks: "That was... actually fine."

## Journey 3: Sofia - Racing the Deadline

Sofia is 16 and has spent three weeks editing a surf video for a competition. Her coach gave her a participant code and told her the deadline is Friday at midnight. It's Friday at 11:42 PM.

She goes to the contest site, enters the contest code and her participant code, and immediately sees the categories. "Video - Open Division" shows a green "Open" badge. She clicks it.

The form asks for her name, school, and coach's info. She fills it in quickly. Then the upload button. Her video is 380MB. She holds her breath and drags the file. A progress bar appears — 23%... 47%... 78%... 100%. "Upload complete. Processing video."

A confirmation screen appears with a thumbnail of her video. She can preview it. It works. The submit button is right there. She clicks it.

11:51 PM. Done. She screenshots the confirmation and texts her coach: "Made it."

## Journey 4: Sofia Returns - The Feedback

Three weeks later, Sofia's coach forwards her an email: "Contest results and feedback are now available." She logs in with the same codes she used before.

The interface looks different now. Her submission shows a badge: "Reviewed." She clicks it and sees:

- **Rating:** Proficient Creator (5-6)
- **Feedback:** "Strong storytelling and good use of slow motion in the barrel sequence. Audio mixing could be tighter — the music overpowers the wave sounds in the middle section. Keep shooting."

She reads it twice. It stings a little — she worked hard on that audio — but it's specific. She knows exactly what to improve for next time. She screenshots the feedback and sends it to her coach.

## Journey 5: Coach Rivera - The Communication Bridge

Coach Rivera runs the surf program at a local high school. Jeb emails him 25 participant codes and instructions: "Distribute one code per student. Deadline is Friday."

Coach Rivera doesn't log into anything. He prints the codes, hands them out, and reminds students about the deadline during practice. He forgets about it.

Three weeks later, an email lands: "Contest results are ready. Please inform your participants they can log in to view feedback."

He forwards the email to his students' group chat: "Results are in. Log in with your code to see feedback." His job is done.

## Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| **Jeb - Super Admin** | Contest CRUD, category management, judge assignment, auto-generated participant codes (50 per contest), batch code generation, code list with Used/Unused status, dashboard with submission counts and judge progress, contest lifecycle control, winner page generation |
| **Marcus - Judge** | Judge authentication, assigned contests/categories dashboard, anonymous submission view (code only), media display (photos full-screen), rating scale input, feedback text entry, progress tracking, top 3 drag-and-drop ranking, mark category complete |
| **Sofia - Participant Submit** | Participant login (contest code + participant code), category list with open/closed status, submission form (personal info + T/L/C info), large file upload with progress indicator, upload confirmation with preview |
| **Sofia - Participant Feedback** | Post-contest login, submission status display, rating and feedback view |
| **Coach Rivera - T/L/C** | Email notification when contest finishes (no platform login required) |
