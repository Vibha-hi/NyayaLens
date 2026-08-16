export type CourtLevel = "Supreme Court" | "High Court";

export interface Precedent {
  id: string;
  rank: number;
  title: string;
  court: CourtLevel;
  year: "2023" | "2022" | "2021" | "2020";
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

export const YEARS = ["2023", "2022", "2021", "2020"] as const;

export const COURTS = ["Supreme Court", "High Court"] as const;

export const PRECEDENTS: Precedent[] = [
  {
    id: "demo-01",
    rank: 1,
    title: "Demo Precedent 01 — Bail After Completion of Investigation",
    court: "High Court",
    year: "2023",
    citation: "DEMO-HC-2023-001",
    relevance: 94,
    posture: "Regular bail application",
    legalIssues: ["Regular Bail", "Documentary Evidence", "Investigation Complete"],
    filterIssues: ["Regular Bail", "Documentary Evidence"],
    matchedEvidence:
      "Continued custody was considered unnecessary after completion of the investigation where the material relied upon was primarily documentary.",
    highlightPhrases: ["completion of the investigation", "primarily documentary"],
    outcome: "Bail granted subject to attendance and non-interference conditions.",
    whyItMatched: [
      "Investigation completed",
      "Evidence primarily documentary",
      "No recorded absconding risk",
      "Continued custody questioned",
    ],
    explanation: {
      sharedFacts: "Investigation completed; evidence primarily documentary; no recorded absconding risk.",
      sharedLegalIssues: "Regular Bail, Documentary Evidence, Investigation Complete",
      proceduralPosture: "Regular bail application",
      matchingTerms: ["investigation complete", "documentary evidence", "regular bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "demo-02",
    rank: 2,
    title: "Demo Precedent 02 — Prolonged Pre-Trial Detention",
    court: "Supreme Court",
    year: "2022",
    citation: "DEMO-SC-2022-002",
    relevance: 91,
    posture: "Appeal against rejection of bail",
    legalIssues: ["Prolonged Custody", "Delayed Trial", "Regular Bail"],
    filterIssues: ["Prolonged Custody", "Regular Bail"],
    matchedEvidence:
      "The length of custody and the limited possibility of an early trial were considered while assessing whether further detention was justified.",
    highlightPhrases: ["length of custody", "limited possibility of an early trial"],
    outcome: "Bail granted with conditions intended to secure appearance during trial.",
    whyItMatched: [
      "Prolonged pre-trial custody",
      "Trial unlikely to conclude soon",
      "Investigation substantially complete",
      "Conditional release considered sufficient",
    ],
    explanation: {
      sharedFacts:
        "Prolonged pre-trial custody; trial unlikely to conclude soon; investigation substantially complete.",
      sharedLegalIssues: "Prolonged Custody, Delayed Trial, Regular Bail",
      proceduralPosture: "Appeal against rejection of bail",
      matchingTerms: ["prolonged custody", "regular bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "demo-03",
    rank: 3,
    title: "Demo Precedent 03 — Documentary Evidence and Custodial Necessity",
    court: "High Court",
    year: "2021",
    citation: "DEMO-HC-2021-003",
    relevance: 87,
    posture: "Post-charge-sheet bail application",
    legalIssues: ["Documentary Evidence", "Custodial Necessity", "Regular Bail"],
    filterIssues: ["Documentary Evidence", "Regular Bail"],
    matchedEvidence:
      "After filing of the charge sheet, the court examined whether continued detention served an investigative purpose when the principal evidence had already been collected.",
    highlightPhrases: ["filing of the charge sheet", "principal evidence had already been collected"],
    outcome: "Bail granted after finding no continuing investigative need for custody.",
    whyItMatched: [
      "Charge sheet filed",
      "Documentary evidence secured",
      "No further custodial investigation shown",
      "Conditions available to manage risk",
    ],
    explanation: {
      sharedFacts: "Charge sheet filed; documentary evidence secured; no further custodial investigation shown.",
      sharedLegalIssues: "Documentary Evidence, Custodial Necessity, Regular Bail",
      proceduralPosture: "Post-charge-sheet bail application",
      matchingTerms: ["documentary evidence", "investigation complete", "regular bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "demo-04",
    rank: 4,
    title: "Demo Precedent 04 — Conditions Against Witness Interference",
    court: "High Court",
    year: "2020",
    citation: "DEMO-HC-2020-004",
    relevance: 82,
    posture: "Regular bail application",
    legalIssues: ["Witness Interference", "Conditional Bail", "Court Attendance"],
    filterIssues: ["Witness Interference", "Regular Bail"],
    matchedEvidence:
      "The risk of interference was addressed through reporting, attendance and non-contact conditions instead of continued detention.",
    highlightPhrases: ["risk of interference", "non-contact conditions"],
    outcome: "Bail granted with reporting and witness non-contact conditions.",
    whyItMatched: [
      "Concern regarding witness contact",
      "Risk addressed using restrictions",
      "Court attendance conditions imposed",
      "No established flight risk",
    ],
    explanation: {
      sharedFacts: "Concern regarding witness contact; risk addressed using restrictions; no established flight risk.",
      sharedLegalIssues: "Witness Interference, Conditional Bail, Court Attendance",
      proceduralPosture: "Regular bail application",
      matchingTerms: ["witness interference", "regular bail"],
      relation: "Supports the submitted case",
    },
  },
  {
    id: "demo-05",
    rank: 5,
    title: "Demo Precedent 05 — Established Flight Risk",
    court: "Supreme Court",
    year: "2023",
    citation: "DEMO-SC-2023-005",
    relevance: 68,
    posture: "Appeal concerning refusal of bail",
    legalIssues: ["Flight Risk", "Witness Interference", "Bail Refusal"],
    filterIssues: ["Flight Risk", "Witness Interference"],
    matchedEvidence:
      "Specific material indicating flight risk and attempted interference distinguished the matter from cases where conditional release was considered sufficient.",
    highlightPhrases: ["flight risk", "attempted interference"],
    outcome: "Bail refused because the identified risks were supported by specific material.",
    whyItMatched: [
      "Same general bail issue",
      "Useful contrasting precedent",
      "Flight risk materially different",
      "Witness-interference concern supported by evidence",
    ],
    explanation: {
      sharedFacts: "Same general bail issue; flight risk materially different from the submitted case.",
      sharedLegalIssues: "Flight Risk, Witness Interference, Bail Refusal",
      proceduralPosture: "Appeal concerning refusal of bail",
      matchingTerms: ["flight risk", "witness interference"],
      relation: "Contrasts with the submitted case",
    },
  },
];

export const DEFAULT_QUERY =
  "The applicant seeks regular bail after prolonged custody. The investigation is complete and the prosecution relies mainly on documentary evidence. There is no allegation that the applicant may abscond or influence witnesses, and the trial is unlikely to conclude soon.";
