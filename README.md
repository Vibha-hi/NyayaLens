# Case Finder AI

Create a polished, responsive, single-page prototype website called “Citizen Legal AI”.

The website is a hardcoded demonstration of a legal precedent retrieval system. A user enters a natural-language case description, and the interface returns similar court precedents with evidence explaining why each result matched.

Important constraints:

This is a frontend-only prototype.

Use React, TypeScript and Tailwind CSS.

Store all sample results in a local TypeScript data file.

Do not add a backend, database, authentication or external API.

Do not add features or pages that are not specified below.

Do not add a chatbot, legal advice, case-outcome prediction, admin panel, analytics dashboard, pricing section, testimonials, blog, login page or user profile.

Do not use real case names or fabricated official citations.

Clearly label all records and scores as fictional demonstration data.

Do not claim that the website is officially affiliated with SIH, the Ministry of Law and Justice or any court.

DESIGN DIRECTION

The website must look like a deliberately designed government/legal research tool, not a generic AI-generated startup website.

Use:

Background: warm off-white #F7F5F0

Primary navy: #102A43

Secondary blue: #286FAE

Muted teal: #218A8D

Restrained saffron accent: #C88A22

Main text: #1F2937

Muted text: #64748B

Border: #D8DEE6

White surfaces only where necessary

Serif font for major headings and a clean sans-serif font for interface text

Maximum content width of approximately 1280px

Small 6–10px border radius

Thin borders and very subtle shadows

Generous but controlled spacing

Clear visual hierarchy and readable typography

Avoid:

Gradients

Glassmorphism

Neon colours

Large decorative illustrations

AI sparkle icons

Robot, gavel or courthouse stock images

Abstract blobs

Oversized hero sections

Excessive cards

Floating elements

Unnecessary animations

Marketing language such as “revolutionary”, “game-changing” or “AI-powered justice”

Excessive icons; use only simple Lucide icons where they improve usability

PAGE STRUCTURE

TOP HEADER

Create a simple 68–72px header.

Left side:

Small document-search icon

Product name: “Citizen Legal AI”

Subtitle beneath or beside it: “Precedent Retrieval Prototype”

Right side:

Small outlined badge: “Demonstration Only”

Do not add navigation links.

INTRODUCTION AND SEARCH AREA

Heading:

“Find Similar Legal Precedents”

Supporting text:

“Describe the facts, legal issues and procedural situation of a case to retrieve similar demonstration precedents.”

Below it, add a large multi-line textarea labelled:

“Case description”

Prefill it with:

“The applicant seeks regular bail after prolonged custody. The investigation is complete and the prosecution relies mainly on documentary evidence. There is no allegation that the applicant may abscond or influence witnesses, and the trial is unlikely to conclude soon.”

Textarea placeholder:

“Describe the relevant facts, legal issues, applicable sections and relief requested…”

Below the textarea, show three short input hints:

Include important facts

Mention relevant sections

Describe the relief requested

Add a primary button:

“Search Similar Cases”

Add a secondary text button:

“Clear”

Search behaviour:

Disable the Search button when the textarea is empty.

On clicking Search, show a restrained loading skeleton for approximately 600 milliseconds.

Then display the five hardcoded results.

Do not call any external service.

Any non-empty query may return the same demonstration results.

Below the search button, show this disclaimer in small text:

“Prototype for legal research assistance only. Results must be verified from the original judgment and must not be treated as legal advice.”

MAIN RESULTS LAYOUT

After searching, use a two-column desktop layout:

Left column: 250–270px filter panel

Right column: result list

On mobile, place filters inside a collapsible “Filters” section above the results.

FILTER PANEL

Title:

“Refine Results”

Include only these functional filters:

Court level:

All Courts

Supreme Court

High Court

Year:

All Years

2023

2022

2021

2020

Legal issue:

Regular Bail

Prolonged Custody

Documentary Evidence

Witness Interference

Flight Risk

Add a small “Reset filters” button.

The filters must work locally by filtering the hardcoded dataset.

RESULT HEADER

Show:

“5 Similar Precedents”

Under it, show:

“Ranked using semantic similarity and legal-term matching”

On the right, show a static compact label:

“Hybrid relevance”

Do not add additional sorting options.

PRECEDENT RESULT DESIGN

Display results as a clean vertical list. Do not make every field look like a separate card.

Each result must contain:

Rank number

Case title

“Fictional demo record” badge

Court level

Year

Demonstration citation

Demo relevance percentage

Procedural posture

Matched legal issues

Short matched evidence passage

Outcome highlight

Expandable “Why it matched” section

“Demo source” button

The relevance value must always be labelled “Demo relevance” so that it is not presented as a real measured result.

The “Demo source” button should be visually present but disabled, with a tooltip:

“Connect the verified original judgment URL in the production system.”

HARDCODED RESULT DATA

Use only the following five records. Do not invent additional records, names, citations, facts or outcomes.

RESULT 1

Title:
“Demo Precedent 01 — Bail After Completion of Investigation”

Court:
“High Court”

Year:
“2023”

Citation:
“DEMO-HC-2023-001”

Demo relevance:
94%

Procedural posture:
“Regular bail application”

Legal issues:

Regular Bail

Documentary Evidence

Investigation Complete

Matched evidence:

“Continued custody was considered unnecessary after completion of the investigation where the material relied upon was primarily documentary.”

Outcome highlight:

“Bail granted subject to attendance and non-interference conditions.”

Why it matched:

Investigation completed

Evidence primarily documentary

No recorded absconding risk

Continued custody questioned

RESULT 2

Title:
“Demo Precedent 02 — Prolonged Pre-Trial Detention”

Court:
“Supreme Court”

Year:
“2022”

Citation:
“DEMO-SC-2022-002”

Demo relevance:
91%

Procedural posture:
“Appeal against rejection of bail”

Legal issues:

Prolonged Custody

Delayed Trial

Regular Bail

Matched evidence:

“The length of custody and the limited possibility of an early trial were considered while assessing whether further detention was justified.”

Outcome highlight:

“Bail granted with conditions intended to secure appearance during trial.”

Why it matched:

Prolonged pre-trial custody

Trial unlikely to conclude soon

Investigation substantially complete

Conditional release considered sufficient

RESULT 3

Title:
“Demo Precedent 03 — Documentary Evidence and Custodial Necessity”

Court:
“High Court”

Year:
“2021”

Citation:
“DEMO-HC-2021-003”

Demo relevance:
87%

Procedural posture:
“Post-charge-sheet bail application”

Legal issues:

Documentary Evidence

Custodial Necessity

Regular Bail

Matched evidence:

“After filing of the charge sheet, the court examined whether continued detention served an investigative purpose when the principal evidence had already been collected.”

Outcome highlight:

“Bail granted after finding no continuing investigative need for custody.”

Why it matched:

Charge sheet filed

Documentary evidence secured

No further custodial investigation shown

Conditions available to manage risk

RESULT 4

Title:
“Demo Precedent 04 — Conditions Against Witness Interference”

Court:
“High Court”

Year:
“2020”

Citation:
“DEMO-HC-2020-004”

Demo relevance:
82%

Procedural posture:
“Regular bail application”

Legal issues:

Witness Interference

Conditional Bail

Court Attendance

Matched evidence:

“The risk of interference was addressed through reporting, attendance and non-contact conditions instead of continued detention.”

Outcome highlight:

“Bail granted with reporting and witness non-contact conditions.”

Why it matched:

Concern regarding witness contact

Risk addressed using restrictions

Court attendance conditions imposed

No established flight risk

RESULT 5

Title:
“Demo Precedent 05 — Established Flight Risk”

Court:
“Supreme Court”

Year:
“2023”

Citation:
“DEMO-SC-2023-005”

Demo relevance:
68%

Procedural posture:
“Appeal concerning refusal of bail”

Legal issues:

Flight Risk

Witness Interference

Bail Refusal

Matched evidence:

“Specific material indicating flight risk and attempted interference distinguished the matter from cases where conditional release was considered sufficient.”

Outcome highlight:

“Bail refused because the identified risks were supported by specific material.”

Why it matched:

Same general bail issue

Useful contrasting precedent

Flight risk materially different

Witness-interference concern supported by evidence

EXPANDABLE “WHY IT MATCHED” PANEL

Each result must have an accessible expand/collapse control labelled:

“Why it matched”

When expanded, show:

Shared facts

Shared legal issues

Procedural posture

Exact matching legal terms

Whether the precedent supports or contrasts with the submitted case

Do not generate explanations dynamically. Use only the hardcoded explanations above.

Open the first result’s explanation by default. Keep the others collapsed.

RESULT EVIDENCE STYLE

The matched evidence passage should appear inside a light neutral evidence area with a thin left blue border.

Highlight only important phrases such as:

“investigation complete”

“documentary evidence”

“prolonged custody”

“flight risk”

“witness interference”

Do not highlight entire paragraphs.

TECHNICAL TRANSPARENCY STRIP

Above the result list, add one small restrained information strip containing:

“Prototype retrieval flow: case description → semantic and legal-term matching → fused ranking → source-linked evidence”

Do not add a large architecture diagram or detailed technical documentation to this website.

EMPTY AND NO-RESULT STATES

Before searching, show a simple empty state:

“Enter a case description to begin searching the demonstration records.”

Do not use an illustration.

If active filters remove every result, show:

“No demonstration records match the selected filters.”

Include a “Reset filters” button.

FOOTER

Use a minimal footer separated by a thin border.

Show only:

“Citizen Legal AI — Precedent Retrieval Prototype”

And:

“Demonstration records are fictional. Human legal verification is required.”

Do not add social-media links, contact information, institution names or additional navigation.

ACCESSIBILITY AND RESPONSIVENESS

Use semantic HTML.

Associate labels with all inputs.

Ensure full keyboard navigation.

Provide visible focus states.

Use sufficient colour contrast.

Use ARIA attributes for expandable panels and disabled source controls.

Make the interface responsive for desktop, tablet and mobile.

Do not hide essential evidence or disclaimers on smaller screens.

FINAL OUTPUT REQUIREMENTS

Build only this single-page prototype.

Keep all text concise and professional.

Do not add any content that is not explicitly provided in this prompt.

Do not replace the fictional records with real cases.

Do not add new features to make the website appear more complete.

Prioritize a reliable search interaction, functional filters, clean evidence presentation and the “Why it matched” experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/59548ad3-f32b-4a87-af08-1e4c9c4e3064).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
