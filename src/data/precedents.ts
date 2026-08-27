export type CourtLevel = "Supreme Court" | "High Court";

export type LegalCategory = "All" | "Bail & Personal Liberty" | "Fraud & Economic Offences";

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
    label: "Imported Corpus",
    shortLabel: "All",
    badgeColor: "bg-muted text-muted-foreground border-border",
    iconName: "Scale",
    description: "Search every indexed Supreme Court and High Court judgment in the local corpus.",
    sampleQuery:
      "During a confrontation, the accused caused the death of another person after claiming that the deceased had attacked first. The defence argues that the accused acted to protect himself from an immediate threat and did not intend to cause an unlawful killing",
  },
  {
    id: "Bail & Personal Liberty",
    label: "Bail & Personal Liberty",
    shortLabel: "Bail / Liberty",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    iconName: "KeyRound",
    description: "Regular bail, anticipatory bail, default bail, custody duration and Article 21.",
    sampleQuery:
      "The applicant seeks regular bail after prolonged custody. The charge sheet has been filed, the evidence is documentary, and there is no flight risk or allegation of witness interference.",
  },
  {
    id: "Fraud & Economic Offences",
    label: "Economic Offence Bail",
    shortLabel: "Economic Bail",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconName: "Banknote",
    description:
      "Contrasting bail principles in financial-crime and money-laundering investigations.",
    sampleQuery:
      "The applicant requests anticipatory bail in a PMLA money-laundering investigation where the agency argues that custodial interrogation is required and the investigation remains active.",
  },
];

export interface Precedent {
  id: string;
  rank: number;
  title: string;
  court: string;
  year: string;
  judgmentDate?: string;
  category: string;
  citation: string;
  posture: string;
  legalIssues: string[];
  filterIssues: string[];
  matchedEvidence: string;
  caseSummary: string;
  highlightPhrases: string[];
  outcome: string;
  matterStatus: string;
  trialStatus: string;
  winner: string;
  caseStage: string;
  caseStageConfidence: string;
  caseStageEvidence: string;
  outcomeRelief: string;
  outcomeEvidence: string;
  relevanceBasis: string[];
  authorityScore: number;
  authorityBasis: string[];
  benchStrength: string;
  whyItMatched: string[];
  explanation: {
    sharedFacts: string;
    sharedLegalIssues: string;
    proceduralPosture: string;
    matchingTerms: string[];
    relation: string;
  };
  sourceUrl: string;
  evidenceLocator: { section: string; paragraph: string };
  reasonCodes: string[];
  denseRank?: number | null;
  lexicalRank?: number | null;
  retrievalScore: number;
  partyDetails?: PartyInfo;
}

export interface PartyInfo {
  appellantName: string;
  appellantRole: string;
  appellantAbout: string;
  respondentName: string;
  respondentRole: string;
  respondentAbout: string;
}

export function extractPartyDetails(precedent: Precedent): PartyInfo {
  if (precedent.partyDetails) {
    return precedent.partyDetails;
  }

  const title = precedent.title || "";
  const splitPattern = /\s+(?:v\.?|vs\.?|v\/s|versus|Versus)\s+/i;
  const parts = title.split(splitPattern);

  let rawAppellant = parts[0]?.trim() || "Applicant / Appellant";
  let rawRespondent = parts[1]?.trim() || "Respondent / State";

  rawAppellant = rawAppellant.replace(/^(?:Shri|Smt\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").trim();
  rawRespondent = rawRespondent.replace(/^(?:Shri|Smt\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").trim();

  if (parts.length === 1 && title.toLowerCase().startsWith("in re")) {
    rawAppellant = title.replace(/^in re:?\s*/i, "").trim();
    rawRespondent = "State / Suo Motu Proceeding";
  }

  let appellantRole = "Appellant / Applicant";
  const lowerCitation = (precedent.citation || "").toLowerCase();
  const lowerPosture = (precedent.posture || "").toLowerCase();
  const lowerWinner = (precedent.winner || "").toLowerCase();
  const lowerCategory = (precedent.category || "").toLowerCase();

  if (lowerCitation.includes("criminal appeal") || lowerPosture.includes("criminal appeal") || lowerPosture.startsWith("appeal")) {
    appellantRole = "Appellant (Accused / Moving Party)";
  } else if (lowerCitation.includes("slp") || lowerPosture.includes("special leave")) {
    appellantRole = "Petitioner / Appellant";
  } else if (lowerCitation.includes("writ") || lowerPosture.includes("writ")) {
    appellantRole = "Petitioner";
  } else if (lowerPosture.includes("bail") || lowerCategory.includes("bail")) {
    appellantRole = "Applicant / Accused";
  }

  let respondentRole = "Respondent (Opposing Party)";
  const lowerResp = rawRespondent.toLowerCase();
  if (
    lowerResp.includes("state") ||
    lowerResp.includes("union of india") ||
    lowerResp.includes("nct of delhi") ||
    lowerResp.includes("govt") ||
    lowerResp.includes("government")
  ) {
    respondentRole = "Respondent (State Prosecution)";
  } else if (
    lowerResp.includes("central bureau of investigation") ||
    lowerResp.includes("cbi") ||
    lowerResp.includes("directorate of enforcement") ||
    lowerResp.includes("enforcement directorate") ||
    lowerResp.includes("ed") ||
    lowerResp.includes("nia") ||
    lowerResp.includes("police") ||
    lowerResp.includes("ncb")
  ) {
    respondentRole = "Respondent (Investigating Agency)";
  } else if (
    lowerResp.includes("ltd") ||
    lowerResp.includes("limited") ||
    lowerResp.includes("pvt") ||
    lowerResp.includes("bank") ||
    lowerResp.includes("corp") ||
    lowerResp.includes("board") ||
    lowerResp.includes("authority")
  ) {
    respondentRole = "Respondent (Institutional Entity)";
  }

  let appellantAbout = "";
  if (precedent.id === "sc-bikramjit-singh-2020") {
    appellantAbout =
      "Accused-appellant in custody who moved the Supreme Court seeking statutory default bail under Section 167(2) CrPC upon expiry of the maximum statutory investigation window.";
  } else if (precedent.id === "sc-sanjay-chandra-2011") {
    appellantAbout =
      "Accused corporate executive who appealed against prolonged pre-trial custody in an economic-offence prosecution, asserting that pre-trial detention cannot be punitive.";
  } else if (precedent.id === "sc-satender-kumar-antil-2022") {
    appellantAbout =
      "Applicant/Petitioner challenging unwarranted arrests and pre-trial incarceration, which prompted the Supreme Court to lay down landmark pan-India bail guidelines.";
  } else if (precedent.id === "sc-sushila-aggarwal-2020") {
    appellantAbout =
      "Petitioner before the 5-judge Constitution Bench contending that anticipatory bail granted under Section 438 CrPC should operate without restrictive time limits.";
  } else if (precedent.id === "sc-p-chidambaram-2019" || precedent.id.includes("chidambaram")) {
    appellantAbout =
      "Applicant seeking anticipatory bail against custodial interrogation in a financial and money-laundering investigation under PMLA.";
  } else {
    const cleanPosture = precedent.posture ? precedent.posture.replace(/^appeal\s+(?:against|concerning|in)\s+/i, "") : "";
    const relief = lowerPosture.includes("anticipatory bail")
      ? "anticipatory bail protection"
      : lowerPosture.includes("default bail")
      ? "statutory default bail"
      : lowerPosture.includes("regular bail")
      ? "regular bail"
      : "judicial relief";

    const outcomeNote =
      lowerWinner.includes("applicant won") || lowerWinner.includes("appellant won") || lowerWinner.includes("petitioner won")
        ? " Successfully secured relief before the Court."
        : lowerWinner.includes("state won") || lowerWinner.includes("respondent succeeded")
        ? " Bail/relief was denied upon judicial evaluation."
        : "";

    appellantAbout = `The moving party seeking ${relief}${cleanPosture ? ` in relation to ${cleanPosture}` : ""}.${outcomeNote}`;
  }

  let respondentAbout = "";
  if (precedent.id === "sc-bikramjit-singh-2020") {
    respondentAbout =
      "State prosecuting authority representing law enforcement; contested the application of default bail and argued the requirement for special NIA court jurisdiction.";
  } else if (precedent.id === "sc-sanjay-chandra-2011") {
    respondentAbout =
      "Central investigative agency prosecuting the economic offence; opposed bail citing the magnitude of financial allegations and potential witness influence.";
  } else if (precedent.id === "sc-satender-kumar-antil-2022") {
    respondentAbout =
      "Central prosecuting agency participating in the formulation of systematic guidelines to streamline non-bailable warrants and routine jail remands.";
  } else if (precedent.id === "sc-sushila-aggarwal-2020") {
    respondentAbout =
      "State prosecution representing the National Capital Territory of Delhi; addressed procedural safeguards and conditions for anticipatory bail.";
  } else if (precedent.id === "sc-p-chidambaram-2019" || precedent.id.includes("chidambaram")) {
    respondentAbout =
      "Specialized financial crimes agency asserting that custodial interrogation was essential to unearth complex money trails and proceeds of crime.";
  } else {
    if (respondentRole.includes("State Prosecution")) {
      respondentAbout = `State prosecuting authority defending the prosecution and public interest against the applicant's petition.`;
    } else if (respondentRole.includes("Investigating Agency")) {
      respondentAbout = `Specialized statutory enforcement agency investigating the alleged offences and opposing relief on grounds of investigation integrity.`;
    } else if (respondentRole.includes("Institutional Entity")) {
      respondentAbout = `Corporate / institutional respondent party contesting the claims and defending its legal position.`;
    } else {
      respondentAbout = `The opposing party responding to the petition and asserting rights in defense of the impugned proceedings.`;
    }
  }

  return {
    appellantName: rawAppellant,
    appellantRole,
    appellantAbout,
    respondentName: rawRespondent,
    respondentRole,
    respondentAbout,
  };
}

export const FILTER_ISSUES = [
  "Regular Bail",
  "Anticipatory Bail",
  "Default Bail",
  "Prolonged Custody",
  "Documentary Evidence",
  "Witness Interference",
  "Flight Risk",
  "Criminal Law",
  "Constitutional Law",
  "Service Law",
  "Taxation",
  "Arbitration",
  "Property / Land",
  "Succession / Inheritance",
  "Probate / Wills",
  "Tenancy / Rent Control",
  "Family / Matrimonial",
  "Motor Vehicles / Compensation",
  "Consumer Law",
  "Insolvency",
  "Environmental Law",
  "Narcotics / NDPS",
  "Economic Offences / PMLA",
  "Cheque Dishonour",
  "Civil Procedure",
  "Quashing of Criminal Proceedings",
] as const;

export const YEARS = [
  "2026",
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
] as const;

export const COURTS = ["Supreme Court", "High Court"] as const;

export const OUTCOME_FILTERS = [
  "Petitioner / Appellant side succeeded",
  "Respondent / State side succeeded",
  "Partial / mixed relief",
  "Remanded / no final winner",
] as const;

export const DEFAULT_QUERY =
  "During a confrontation, the accused caused the death of another person after claiming that the deceased had attacked first. The defence argues that the accused acted to protect himself from an immediate threat and did not intend to cause an unlawful killing";
