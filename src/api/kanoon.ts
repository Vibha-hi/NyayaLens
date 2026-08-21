import { createServerFn } from "@tanstack/react-start";
import type { Precedent, CourtLevel, LegalCategory } from "../data/precedents";

// ---------------------------------------------------------------------------
// Indian Kanoon API helpers (runs ONLY on the server — token never reaches the browser)
// ---------------------------------------------------------------------------

const KANOON_BASE = "https://api.indiankanoon.org";

function getApiKey(): string {
  const key = process.env.INDIAN_KANOON_API_KEY;
  if (!key || key === "your_api_token_here") {
    throw new Error(
      "INDIAN_KANOON_API_KEY is not set. Add your token to the .env file in the project root."
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Types for the raw Indian Kanoon API response
// ---------------------------------------------------------------------------

interface KanoonSearchResult {
  docs: KanoonDoc[];
  found: number;
}

interface KanoonDoc {
  tid: number;
  title: string;
  headline: string; // HTML snippet with <b> highlights
  docsource: string; // e.g. "Supreme Court of India", "Delhi High Court"
  publishdate: string; // e.g. "2022-10-11T00:00:00+05:30"
  numcites?: number;
  numcitedby?: number;
  citation?: string;
}

interface KanoonDocMeta {
  title: string;
  headline?: string;
  doctype?: string;
  author?: string;
  bench?: string;
  citation?: string;
  publishdate?: string;
  numcites?: number;
  numcitedby?: number;
}

interface KanoonDocFragment {
  title: string;
  fragments: { fragment: string }[];
}

// ---------------------------------------------------------------------------
// Utility functions for mapping Kanoon data → our Precedent type
// ---------------------------------------------------------------------------

/** Strip HTML tags from Kanoon headline snippets */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

/** Extract bold phrases from Kanoon HTML (these are the keyword highlights) */
function extractHighlightPhrases(html: string): string[] {
  const matches = html.match(/<b>([^<]+)<\/b>/gi) || [];
  const phrases = matches.map((m) => stripHtml(m));
  // De-duplicate and limit
  return [...new Set(phrases)].slice(0, 5);
}

/** Determine CourtLevel from the docsource string */
function parseCourtLevel(docsource: string): CourtLevel {
  const lower = docsource.toLowerCase();
  if (lower.includes("supreme court")) return "Supreme Court";
  return "High Court";
}

/** Extract year from publishdate string */
function parseYear(publishdate: string): string {
  try {
    return new Date(publishdate).getFullYear().toString();
  } catch {
    return "Unknown";
  }
}

/** Guess a legal category from title + headline text */
function guessCategory(title: string, headline: string): LegalCategory {
  const text = `${title} ${headline}`.toLowerCase();
  if (text.includes("murder") || text.includes("302") || text.includes("103 bns") || text.includes("homicide") || text.includes("culpable"))
    return "Murder & Violent Crime";
  if (text.includes("property") || text.includes("land") || text.includes("partition") || text.includes("adverse possession") || text.includes("title"))
    return "Property & Land Dispute";
  if (text.includes("bail") || text.includes("439") || text.includes("438") || text.includes("custody") || text.includes("detention") || text.includes("liberty"))
    return "Bail & Personal Liberty";
  if (text.includes("cyber") || text.includes("65b") || text.includes("information technology") || text.includes("it act") || text.includes("phishing"))
    return "Cybercrime & IT Act";
  if (text.includes("domestic violence") || text.includes("dv act") || text.includes("498a") || text.includes("maintenance") || text.includes("matrimonial"))
    return "Domestic Violence & Family";
  if (text.includes("fraud") || text.includes("pmla") || text.includes("money laundering") || text.includes("420") || text.includes("cheating") || text.includes("economic"))
    return "Fraud & Economic Offences";
  return "All";
}

/** Extract legal issue tags from the headline/title */
function extractLegalIssues(title: string, headline: string): string[] {
  const text = `${title} ${headline}`.toLowerCase();
  const issues: string[] = [];

  if (text.includes("bail")) issues.push("Regular Bail");
  if (text.includes("custody") || text.includes("detention") || text.includes("prolonged")) issues.push("Prolonged Custody");
  if (text.includes("documentary") || text.includes("document")) issues.push("Documentary Evidence");
  if (text.includes("witness") || text.includes("interference") || text.includes("tamper")) issues.push("Witness Interference");
  if (text.includes("flight") || text.includes("abscond")) issues.push("Flight Risk");
  if (text.includes("anticipatory")) issues.push("Anticipatory Bail");
  if (text.includes("default bail") || text.includes("167")) issues.push("Default Bail");
  if (text.includes("murder") || text.includes("302")) issues.push("Murder");
  if (text.includes("property") || text.includes("land")) issues.push("Property Dispute");
  if (text.includes("cyber") || text.includes("65b")) issues.push("Cybercrime");
  if (text.includes("pmla") || text.includes("money laundering")) issues.push("Money Laundering");

  return issues.length > 0 ? issues : ["General"];
}

// ---------------------------------------------------------------------------
// Server function: search Indian Kanoon
// ---------------------------------------------------------------------------

export const searchCasesFn = createServerFn({ method: "POST" })
  .validator((data: { query: string; filters: { court: string; year: string; issue: string } }) => data)
  .handler(async ({ data }): Promise<Precedent[]> => {
    const { query, filters } = data;
    const API_KEY = getApiKey();

    // Build the search query — append court/year filters to the Kanoon search string
    let formInput = query;
    if (filters.court !== "All Courts") {
      formInput += ` doctypes: ${filters.court.toLowerCase().includes("supreme") ? "supremecourt" : "highcourts"}`;
    }
    if (filters.year !== "All Years") {
      formInput += ` fromdate: 1-1-${filters.year} todate: 31-12-${filters.year}`;
    }

    console.log("[kanoon] Searching:", formInput);

    // -----------------------------------------------------------------------
    // Step 1: Search the Indian Kanoon API
    // -----------------------------------------------------------------------
    const searchResponse = await fetch(
      `${KANOON_BASE}/search/?formInput=${encodeURIComponent(formInput)}&pagenum=0`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("[kanoon] Search API error:", searchResponse.status, errorText);
      throw new Error(`Indian Kanoon API returned ${searchResponse.status}: ${errorText}`);
    }

    const searchData = (await searchResponse.json()) as KanoonSearchResult;

    if (!searchData.docs || searchData.docs.length === 0) {
      return [];
    }

    // Take top 10 results from Kanoon, then we'll enrich and rank
    const topDocs = searchData.docs.slice(0, 10);

    // -----------------------------------------------------------------------
    // Step 2: Fetch document fragments for matched evidence snippets
    // -----------------------------------------------------------------------
    const enrichedDocs = await Promise.all(
      topDocs.map(async (doc, index) => {
        let fragments: string[] = [];
        let meta: KanoonDocMeta | null = null;

        // Try to get document fragments (matched snippets against our query)
        try {
          const fragResponse = await fetch(
            `${KANOON_BASE}/docfragment/${doc.tid}/?formInput=${encodeURIComponent(query)}`,
            {
              method: "POST",
              headers: {
                Authorization: `Token ${API_KEY}`,
                Accept: "application/json",
              },
            }
          );
          if (fragResponse.ok) {
            const fragData = (await fragResponse.json()) as KanoonDocFragment;
            fragments = (fragData.fragments || []).map((f) => stripHtml(f.fragment)).filter(Boolean);
          }
        } catch (err) {
          console.warn(`[kanoon] Fragment fetch failed for doc ${doc.tid}:`, err);
        }

        // Try to get document metadata (bench, citation, etc.)
        try {
          const metaResponse = await fetch(`${KANOON_BASE}/docmeta/${doc.tid}/`, {
            method: "POST",
            headers: {
              Authorization: `Token ${API_KEY}`,
              Accept: "application/json",
            },
          });
          if (metaResponse.ok) {
            meta = (await metaResponse.json()) as KanoonDocMeta;
          }
        } catch (err) {
          console.warn(`[kanoon] Meta fetch failed for doc ${doc.tid}:`, err);
        }

        return { doc, fragments, meta, originalIndex: index };
      })
    );

    // -----------------------------------------------------------------------
    // Step 3: Apply client-side filters and map to Precedent type
    // -----------------------------------------------------------------------
    let results: Precedent[] = enrichedDocs
      .map(({ doc, fragments, meta, originalIndex }) => {
        const courtLevel = parseCourtLevel(doc.docsource);
        const year = parseYear(doc.publishdate);
        const cleanHeadline = stripHtml(doc.headline);
        const highlightPhrases = extractHighlightPhrases(doc.headline);
        const category = guessCategory(doc.title, cleanHeadline);
        const legalIssues = extractLegalIssues(doc.title, cleanHeadline);

        // Build the matched evidence from fragments, falling back to the headline
        const matchedEvidence =
          fragments.length > 0
            ? fragments.slice(0, 2).join(" … ")
            : cleanHeadline;

        // Citation from metadata or construct from doc source
        const citation = meta?.citation || doc.citation || `IK-${doc.tid}`;

        // Relevance score: position-based (Kanoon already returns ranked results)
        // Top result gets 95%, decreasing by ~3-5% per rank
        const relevance = Math.max(60, 95 - originalIndex * 4);

        const precedent: Precedent = {
          id: `kanoon-${doc.tid}`,
          rank: originalIndex + 1,
          title: doc.title,
          court: courtLevel,
          year,
          category,
          citation,
          relevance,
          posture: meta?.doctype || "Court judgment",
          legalIssues,
          filterIssues: legalIssues,
          matchedEvidence,
          highlightPhrases,
          outcome: cleanHeadline.length > 200 ? cleanHeadline.slice(0, 200) + "…" : cleanHeadline,
          whyItMatched: legalIssues.map((issue) => `Matched on: ${issue}`),
          explanation: {
            sharedFacts: matchedEvidence.length > 300 ? matchedEvidence.slice(0, 300) + "…" : matchedEvidence,
            sharedLegalIssues: legalIssues.join(", "),
            proceduralPosture: meta?.doctype || "Court judgment",
            matchingTerms: highlightPhrases,
            relation: "Supports the submitted case",
          },
          kanoonDocId: doc.tid,
        };

        return precedent;
      });

    // Apply the issue filter client-side
    if (filters.issue !== "All Issues") {
      results = results.filter((r) =>
        r.filterIssues.some((fi) => fi.toLowerCase().includes(filters.issue.toLowerCase()))
      );
    }

    // Re-rank after filtering
    results = results.map((r, i) => ({ ...r, rank: i + 1 }));

    // Limit to top 10
    return results.slice(0, 10);
  });

// ---------------------------------------------------------------------------
// Server function: get full document from Indian Kanoon
// ---------------------------------------------------------------------------

export const getDocumentFn = createServerFn({ method: "POST" })
  .validator((data: { docId: number }) => data)
  .handler(async ({ data }) => {
    const API_KEY = getApiKey();

    const response = await fetch(`${KANOON_BASE}/doc/${data.docId}/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch document ${data.docId}`);
    }

    return await response.json();
  });
