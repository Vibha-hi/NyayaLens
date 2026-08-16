export type CourtLevel = "Supreme Court" | "High Court";

export type LegalCategory =
  | "All"
  | "Murder & Violent Crime"
  | "Property & Land Dispute"
  | "Bail & Personal Liberty"
  | "Cybercrime & IT Act"
  | "Domestic Violence & Family"
  | "Fraud & Economic Offences";

export interface CategoryInfo {
  id: LegalCategory;
  label: string;
  shortLabel: string;
  badgeColor: string;
  iconName: string;
  description: string;
  sampleQuery: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "All",
    label: "All Categories",
    shortLabel: "All",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    iconName: "Scale",
    description: "Browse all recent legal precedents across all domains.",
    sampleQuery: "The applicant seeks regular bail after prolonged custody. The investigation is complete and the prosecution relies mainly on documentary evidence.",
  },
  {
    id: "Murder & Violent Crime",
    label: "Murder & Violent Crime",
    shortLabel: "Murder / Crime",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    iconName: "ShieldAlert",
    description: "Homicide (IPC 302/BNS 103), culpable homicide, circumstantial evidence, and chain of custody.",
    sampleQuery: "Circumstantial evidence murder trial where last seen theory is alleged without corroborating forensic DNA or weapon recovery. Seeking acquittal precedent based on benefit of doubt.",
  },
  {
    id: "Property & Land Dispute",
    label: "Property & Land Dispute",
    shortLabel: "Property Dispute",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    iconName: "Building2",
    description: "Title declarations, adverse possession, ancestral partition, easement rights, and mutation challenges.",
    sampleQuery: "Suit for declaration of ownership based on 12-year adverse possession over agricultural ancestral property without registered sale deed against co-heirs.",
  },
  {
    id: "Bail & Personal Liberty",
    label: "Bail & Personal Liberty",
    shortLabel: "Bail / Liberty",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    iconName: "KeyRound",
    description: "Regular bail under Sec 439, anticipatory bail, statutory default bail, and custody duration.",
    sampleQuery: "The applicant seeks regular bail after prolonged custody of over 18 months. Charge sheet filed, primarily documentary evidence, and no flight risk.",
  },
  {
    id: "Cybercrime & IT Act",
    label: "Cybercrime & IT Act",
    shortLabel: "Cybercrime",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    iconName: "ShieldCheck",
    description: "Phishing, unauthorized server access, Sec 65B IT Act electronic evidence certificates, and data theft.",
    sampleQuery: "Admissibility of WhatsApp chat exports and digital server logs without Section 65B(4) Indian Evidence Act mandatory certificate during cyber fraud trial.",
  },
  {
    id: "Domestic Violence & Family",
    label: "Domestic Violence & Family",
    shortLabel: "Domestic Violence",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    iconName: "HeartHandshake",
    description: "Protection of Women from Domestic Violence Act, interim maintenance, shared household rights, and 498A.",
    sampleQuery: "Interim maintenance order under Section 12 DV Act challenged by husband citing independent income of wife and shared household residency claims.",
  },
  {
    id: "Fraud & Economic Offences",
    label: "Fraud & Economic Offences",
    shortLabel: "Economic Fraud",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconName: "Banknote",
    description: "PMLA money laundering, corporate fraud, GST evasion, banking scams, and Sec 420 IPC cheating.",
    sampleQuery: "Application for bail under Prevention of Money Laundering Act (PMLA) Section 45 twin conditions where scheduled predicate offence proceedings have been stayed.",
  },
];

export interface RecentCase {
  id: string;
  title: string;
  citation: string;
  court: CourtLevel;
  date: string;
  daysAgo: string;
  category: LegalCategory;
  bench: string;
  summary: string;
  keyTakeaway: string;
  statute: string;
  status: "Decided" | "Landmark Precedent" | "Bail Granted" | "Rule Settled";
  badgeTheme: "red" | "blue" | "amber" | "green" | "purple" | "rose";
  searchableDescription: string;
}

export const RECENT_CASES: RecentCase[] = [
  {
    id: "recent-01",
    title: "State of Maharashtra v. Rajeshwar & Ors.",
    citation: "2025 SCC OnLine SC 412",
    court: "Supreme Court",
    date: "12 Feb 2025",
    daysAgo: "Recent",
    category: "Murder & Violent Crime",
    bench: "Hon'ble Bench of 3 Judges",
    summary:
      "The Supreme Court reiterated that in murder cases relying purely on circumstantial evidence, the 'last seen together' theory alone cannot sustain a conviction without independent corroborating evidence of motive and physical proximity to the crime scene.",
    keyTakeaway: "Last seen evidence must be supported by an unbroken chain of circumstantial evidence.",
    statute: "Section 302 IPC / Section 103 BNS",
    status: "Landmark Precedent",
    badgeTheme: "rose",
    searchableDescription:
      "Murder appeal resting entirely on circumstantial evidence and 'last seen' theory without recovery of weapon or forensic matching. Seeking precedents on chain of circumstantial evidence.",
  },
  {
    id: "recent-02",
    title: "K. R. Ramanathan v. Sundarambal & Anr.",
    citation: "2025 SCC OnLine Mad 189",
    court: "High Court",
    date: "08 Feb 2025",
    daysAgo: "This Week",
    category: "Property & Land Dispute",
    bench: "Madras High Court (Division Bench)",
    summary:
      "The High Court held that uninterrupted possession of co-ancestral land for over 30 years does not constitute adverse possession against other co-owners unless clear, open, and hostile ouster is specifically pleaded and proven with documentary evidence.",
    keyTakeaway: "Possession by one co-heir is deemed possession by all co-heirs absent clear proof of ouster.",
    statute: "Limitation Act, 1963 — Article 65",
    status: "Decided",
    badgeTheme: "amber",
    searchableDescription:
      "Ancestral property partition suit where defendant co-owner claims exclusive title via adverse possession for 25 years without registered partition deed.",
  },
  {
    id: "recent-03",
    title: "Vikas Aggarwal v. Directorate of Enforcement",
    citation: "2025 SCC OnLine Del 341",
    court: "High Court",
    date: "04 Feb 2025",
    daysAgo: "Recent",
    category: "Fraud & Economic Offences",
    bench: "Delhi High Court (Single Judge)",
    summary:
      "Granted bail in a multi-crore PMLA matter on grounds of prolonged incarceration exceeding 2 years without trial commencement, holding that right to speedy trial under Article 21 overrides statutory bail restrictions in economic offences.",
    keyTakeaway: "Article 21 right to speedy trial applies to PMLA proceedings when trial cannot conclude within reasonable timeframe.",
    statute: "Prevention of Money Laundering Act (PMLA) Sec 45",
    status: "Bail Granted",
    badgeTheme: "green",
    searchableDescription:
      "Applicant detained under PMLA Section 45 for over 20 months with more than 150 witnesses remaining. Seeking bail on grounds of delay in trial and personal liberty.",
  },
  {
    id: "recent-04",
    title: "Pooja Sharma v. Rohit Sharma & Ors.",
    citation: "2025 SCC OnLine Bom 276",
    court: "High Court",
    date: "28 Jan 2025",
    daysAgo: "2 weeks ago",
    category: "Domestic Violence & Family",
    bench: "Bombay High Court",
    summary:
      "Clarified that an aggrieved woman is entitled to seek right of residence and interim monetary relief under Section 19 of the DV Act even if the matrimonial home is exclusively owned by the father-in-law, provided it served as the shared household.",
    keyTakeaway: "Shared household rights under DV Act extend to premises lived in jointly regardless of ownership titles.",
    statute: "DV Act Section 12 & 19",
    status: "Decided",
    badgeTheme: "rose",
    searchableDescription:
      "Interim residence application under Domestic Violence Act Section 19 where in-laws claim exclusive property ownership and seek eviction of the daughter-in-law.",
  },
  {
    id: "recent-05",
    title: "Aman Verma v. Cyber Crime Cell & Anr.",
    citation: "2025 SCC OnLine Kar 502",
    court: "High Court",
    date: "22 Jan 2025",
    daysAgo: "3 weeks ago",
    category: "Cybercrime & IT Act",
    bench: "Karnataka High Court",
    summary:
      "Quashed electronic evidence in a cyber extortion prosecution where digital hard drives and server logs were admitted into trial without the mandatory certification prescribed under Section 65B(4) of the Evidence Act.",
    keyTakeaway: "Electronic evidence without Section 65B compliance is strictly inadmissible in criminal trials.",
    statute: "Information Technology Act Sec 66D / Evidence Act Sec 65B",
    status: "Rule Settled",
    badgeTheme: "purple",
    searchableDescription:
      "Challenge to electronic records and cloned drive forensic reports produced by cyber police without mandatory Section 65B certificate.",
  },
  {
    id: "recent-06",
    title: "Mohd. Shakeel v. State (NCT of Delhi)",
    citation: "2025 SCC OnLine SC 128",
    court: "Supreme Court",
    date: "15 Jan 2025",
    daysAgo: "Last month",
    category: "Bail & Personal Liberty",
    bench: "Hon'ble Supreme Court of India",
    summary:
      "Reaffirmed that prolonged pre-trial incarceration without framing of charges violates Article 21, directing trial courts across states to strictly adhere to Satender Kumar Antil bail reform guidelines for non-heinous offences.",
    keyTakeaway: "Pre-trial detention should not become punitive when prosecution delays filing supplementary charges.",
    statute: "Section 439 CrPC / Section 483 BNSS",
    status: "Bail Granted",
    badgeTheme: "blue",
    searchableDescription:
      "The applicant seeks regular bail after prolonged custody. The investigation is complete and the prosecution relies mainly on documentary evidence without any risk of tampering.",
  },
];

export interface Precedent {
  id: string;
  rank: number;
  title: string;
  court: CourtLevel;
  year: string;
  category: LegalCategory;
  citation: string;
  relevance: number;
  posture: string;
  legalIssues: string[];
  /** Filterable legal-issue tags used by the filter panel. */
  filterIssues: string[];
  matchedEvidence: string;
  /** Phrases inside matchedEvidence that should be highlighted. */
  highlightPhrases: string[];
  outcome: string;
  whyItMatched: string[];
  explanation: {
    sharedFacts: string;
    sharedLegalIssues: string;
    proceduralPosture: string;
    matchingTerms: string[];
    relation: "Supports the submitted case" | "Contrasts with the submitted case";
  };
}

export const FILTER_ISSUES = [
  "Regular Bail",
  "Prolonged Custody",
  "Documentary Evidence",
  "Witness Interference",
  "Flight Risk",
] as const;

export const YEARS = ["2022", "2020", "2012"] as const;

export const COURTS = ["Supreme Court", "High Court"] as const;

export const PRECEDENTS: Precedent[] = [
  {
    id: "case-01",
    rank: 1,
    title: "Sanjay Chandra v. Central Bureau of Investigation",
    court: "Supreme Court",
    year: "2012",
    category: "Bail & Personal Liberty",
    citation: "(2012) 1 SCC 40",
    relevance: 94,
    posture: "Regular bail application in economic offence",
    legalIssues: ["Regular Bail", "Documentary Evidence", "Investigation Complete"],
    filterIssues: ["Regular Bail", "Documentary Evidence"],
    matchedEvidence:
      "The Supreme Court held that continued custody was unnecessary once the investigation was complete and the material relied upon was primarily documentary in nature. The Court observed that the object of bail is to secure appearance at trial, not to punish the accused before conviction.",
    highlightPhrases: ["investigation was complete", "primarily documentary"],
    outcome: "Bail granted subject to conditions including attendance at trial and non-interference with witnesses.",
    whyItMatched: [
      "Investigation completed and charge sheet filed",
      "Evidence primarily documentary in nature",
      "No recorded absconding risk established",
      "Continued custody questioned as disproportionate",
    ],
    explanation: {
      sharedFacts: "Investigation completed; evidence primarily documentary; no recorded absconding risk; bail is the rule and jail the exception.",
      sharedLegalIssues: "Regular Bail, Documentary Evidence, Investigation Complete",
      proceduralPosture: "Regular bail application under Section 439 CrPC",
      matchingTerms: ["investigation complete", "documentary evidence", "regular bail", "bail is the rule"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "case-02",
    rank: 2,
    title: "Satender Kumar Antil v. Central Bureau of Investigation",
    court: "Supreme Court",
    year: "2022",
    category: "Bail & Personal Liberty",
    citation: "(2022) 10 SCC 51",
    relevance: 91,
    posture: "Appeal against rejection of bail — bail reform guidelines",
    legalIssues: ["Prolonged Custody", "Delayed Trial", "Regular Bail"],
    filterIssues: ["Prolonged Custody", "Regular Bail"],
    matchedEvidence:
      "The Supreme Court issued comprehensive bail guidelines, emphasising that the length of custody and the limited possibility of an early trial must be considered while assessing whether further detention is justified. The Court directed compliance with the principle that bail is the rule and jail is the exception.",
    highlightPhrases: ["length of custody", "limited possibility of an early trial"],
    outcome: "Bail guidelines issued directing courts to prevent unnecessary pre-trial detention and ensure timely disposal of bail applications.",
    whyItMatched: [
      "Prolonged pre-trial custody addressed",
      "Trial unlikely to conclude soon recognised as a factor",
      "Investigation substantially complete",
      "Conditional release considered sufficient safeguard",
    ],
    explanation: {
      sharedFacts:
        "Prolonged pre-trial custody; trial unlikely to conclude soon; investigation substantially complete; comprehensive bail reform guidelines issued.",
      sharedLegalIssues: "Prolonged Custody, Delayed Trial, Regular Bail",
      proceduralPosture: "Appeal against rejection of bail — leading to bail reform guidelines",
      matchingTerms: ["prolonged custody", "regular bail", "bail is the rule"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "case-03",
    rank: 3,
    title: "Bikramjit Singh v. State of Punjab",
    court: "Supreme Court",
    year: "2020",
    category: "Bail & Personal Liberty",
    citation: "(2020) 10 SCC 616",
    relevance: 87,
    posture: "Default bail application under Section 167(2) CrPC",
    legalIssues: ["Documentary Evidence", "Custodial Necessity", "Regular Bail"],
    filterIssues: ["Documentary Evidence", "Regular Bail"],
    matchedEvidence:
      "The Supreme Court held that after the statutory period for filing a charge sheet has expired, the court must examine whether continued detention serves any investigative purpose, especially when the principal evidence is documentary and has already been collected. The right to default bail was affirmed as a fundamental right under Article 21.",
    highlightPhrases: ["filing a charge sheet", "principal evidence is documentary and has already been collected"],
    outcome: "Default bail recognised as an indefeasible fundamental right when charge sheet is not filed within the statutory period.",
    whyItMatched: [
      "Charge sheet filing timeline examined",
      "Documentary evidence already secured",
      "No further custodial investigation purpose shown",
      "Conditions available to manage any residual risk",
    ],
    explanation: {
      sharedFacts: "Charge sheet timelines examined; documentary evidence secured; no further custodial investigation shown necessary.",
      sharedLegalIssues: "Documentary Evidence, Custodial Necessity, Regular Bail, Default Bail",
      proceduralPosture: "Default bail application under Section 167(2) CrPC",
      matchingTerms: ["documentary evidence", "investigation complete", "regular bail", "default bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "case-04",
    rank: 4,
    title: "Sushila Aggarwal v. State (NCT of Delhi)",
    court: "Supreme Court",
    year: "2020",
    category: "Bail & Personal Liberty",
    citation: "(2020) 5 SCC 1",
    relevance: 82,
    posture: "Constitution Bench — anticipatory bail conditions",
    legalIssues: ["Witness Interference", "Conditional Bail", "Court Attendance"],
    filterIssues: ["Witness Interference", "Regular Bail"],
    matchedEvidence:
      "The Constitution Bench held that the risk of witness interference should be addressed through reporting, attendance and non-contact conditions rather than refusing bail altogether. Anticipatory bail can continue until the end of the trial with appropriate protective conditions.",
    highlightPhrases: ["risk of witness interference", "non-contact conditions"],
    outcome: "Anticipatory bail held to continue until end of trial with reporting and witness non-contact conditions.",
    whyItMatched: [
      "Concern regarding witness contact directly addressed",
      "Risk managed using bail restrictions instead of custody",
      "Court attendance conditions imposed as safeguard",
      "No established flight risk found necessary for refusal",
    ],
    explanation: {
      sharedFacts: "Concern regarding witness contact; risk addressed using bail restrictions rather than custody; no established flight risk.",
      sharedLegalIssues: "Witness Interference, Conditional Bail, Court Attendance, Anticipatory Bail",
      proceduralPosture: "Constitution Bench reference on anticipatory bail conditions",
      matchingTerms: ["witness interference", "regular bail", "conditional bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "case-05",
    rank: 5,
    title: "P. Chidambaram v. Directorate of Enforcement",
    court: "Supreme Court",
    year: "2020",
    category: "Fraud & Economic Offences",
    citation: "(2020) 13 SCC 791",
    relevance: 68,
    posture: "Appeal concerning refusal of bail in economic offence",
    legalIssues: ["Flight Risk", "Witness Interference", "Bail Refusal"],
    filterIssues: ["Flight Risk", "Witness Interference"],
    matchedEvidence:
      "The Supreme Court observed that specific material indicating flight risk and attempted interference with witnesses distinguished the matter from ordinary bail cases. Economic offences constitute a class apart, and the gravity of the charge and material demonstrating risk of evidence tampering were held to justify continued custody.",
    highlightPhrases: ["flight risk", "attempted interference"],
    outcome: "Bail initially refused as the identified risks of flight and witness tampering were supported by specific material on record.",
    whyItMatched: [
      "Same general bail issue but contrasting outcome",
      "Useful contrasting precedent for risk assessment",
      "Flight risk materially different — supported by evidence",
      "Witness-interference concern supported by specific material",
    ],
    explanation: {
      sharedFacts: "Same general bail issue; flight risk materially different from the submitted case; economic offences treated as a class apart.",
      sharedLegalIssues: "Flight Risk, Witness Interference, Bail Refusal, Economic Offences",
      proceduralPosture: "Appeal concerning refusal of bail in PMLA proceedings",
      matchingTerms: ["flight risk", "witness interference", "bail refusal"],
      relation: "Contrasts with the submitted case",
    },
  },
];

export const DEFAULT_QUERY =
  "The applicant seeks regular bail after prolonged custody. The investigation is complete and the prosecution relies mainly on documentary evidence. There is no allegation that the applicant may abscond or influence witnesses, and the trial is unlikely to conclude soon.";

