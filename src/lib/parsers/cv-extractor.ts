import type { ExtractedCVData } from "@/lib/ai/evaluator";

const QUALIFICATION_KEYWORDS = [
  "Ph.D", "M.Phil", "M.Ed", "B.Ed", "D.El.Ed", "B.El.Ed", "B.P.Ed", "M.P.Ed",
  "M.Sc", "B.Sc", "M.A", "B.A", "M.Com", "B.Com", "MBA", "MCA", "BCA",
  "M.Tech", "B.Tech", "BE", "ME", "M.Eng", "B.Eng",
  "PGDCA", "PGCE", "Diploma", "Post Graduate", "Postgraduate",
];

const CERTIFICATION_KEYWORDS = [
  "CTET", "TET", "STET", "NET", "SET", "GATE",
  "NIS", "B.P.Ed", "M.P.Ed", "PGDCA", "PGCE",
];

const SUBJECT_KEYWORDS = [
  "Mathematics", "Maths", "Math",
  "Physics", "Chemistry", "Biology", "Science",
  "English", "Hindi", "Sanskrit", "Urdu",
  "Social Science", "Social Studies", "History", "Geography",
  "Political Science", "Civics", "Economics",
  "Computer Science", "Computer", "IT", "Information Technology",
  "Physical Education", "Sports", "PE",
  "Art", "Craft", "Drawing", "Music", "Dance",
  "Commerce", "Accountancy", "Business Studies",
  "Psychology", "Sociology", "Philosophy",
  "Environmental Science", "EVS",
];

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*years?\s+(?:of\s+)?(?:teaching\s+)?experience/gi,
  /experience[^\n]*?(\d+)\+?\s*years?/gi,
];

const JOB_TITLE_PATTERNS = [
  /(?:^|\n)\s*((?:senior\s+|junior\s+|assistant\s+|head\s+)?(?:teacher|lecturer|professor|instructor|educator|faculty|tutor|principal|vice[\s-]principal|coordinator|hod|head of department)[^\n,]{0,40})/gim,
];

const ORG_PATTERNS = [
  /(?:at|@|–|-|,)\s*([A-Z][A-Za-z\s&'.,-]{3,50}(?:school|college|university|academy|institute|vidyalaya|public|international|convent|DAV|KV|Kendriya|Navodaya)[A-Za-z\s&'.,-]{0,30})/gi,
  /([A-Z][A-Za-z\s&'.,-]{3,50}(?:school|college|university|academy|institute|vidyalaya|public|international|convent|DAV|KV|Kendriya|Navodaya)[A-Za-z\s&'.,-]{0,30})/gi,
];

const DATE_RANGE_PATTERN = /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*\d{4}\s*(?:–|-|to)\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)?\s*(?:\d{4}|present|current|till date)/gi;

function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return match?.[0] || "";
}

function extractPhone(text: string): string {
  const match = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return match?.[0] || "";
}

function extractName(text: string): string {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  // Try first 5 non-empty lines for a name-like pattern
  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like addresses, emails, phones, or section headers
    if (/[@|\/\\]|\d{5,}|http|www\.|curriculum|resume|cv\b|objective|summary|profile/i.test(line)) continue;
    if (line.length < 3 || line.length > 60) continue;
    // Must look like a proper name: 2–4 words, each starting with a capital
    const nameMatch = line.match(/^([A-Z][a-zA-Z.'-]{1,20}(?:\s+[A-Z][a-zA-Z.'-]{1,20}){1,3})$/);
    if (nameMatch) return nameMatch[1];
  }
  return "";
}

function extractQualifications(text: string): string[] {
  const found = new Set<string>();
  for (const kw of QUALIFICATION_KEYWORDS) {
    const escaped = kw.replace(/\./g, "\\.").replace(/\+/g, "\\+");
    const regex = new RegExp(`${escaped}[\\s\\w().,-]{0,60}`, "gi");
    const matches = text.match(regex);
    if (matches) {
      matches.slice(0, 2).forEach(m => found.add(m.trim().replace(/\s+/g, " ")));
    }
  }
  return Array.from(found).slice(0, 8);
}

function extractCertifications(text: string): string[] {
  const found = new Set<string>();
  for (const kw of CERTIFICATION_KEYWORDS) {
    const escaped = kw.replace(/\./g, "\\.");
    const regex = new RegExp(`\\b${escaped}\\b[\\s\\w().,-]{0,40}`, "gi");
    const matches = text.match(regex);
    if (matches) {
      matches.slice(0, 2).forEach(m => found.add(m.trim()));
    }
  }
  return Array.from(found).slice(0, 6);
}

function extractSubjects(text: string): string[] {
  const found = new Set<string>();
  for (const subj of SUBJECT_KEYWORDS) {
    const escaped = subj.replace(/\./g, "\\.");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(text)) {
      // Normalise aliases
      if (/maths?|mathematics/i.test(subj)) found.add("Mathematics");
      else if (/computer|information tech|IT\b/i.test(subj)) found.add("Computer Science");
      else if (/physical ed|sports|^PE$/i.test(subj)) found.add("Physical Education");
      else if (/social stud|social science/i.test(subj)) found.add("Social Science");
      else if (/environmental|evs/i.test(subj)) found.add("EVS");
      else found.add(subj);
    }
  }
  return Array.from(found).slice(0, 8);
}

function extractTotalExperience(text: string): number {
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return parseInt(match[1]);
  }

  // Count date ranges as fallback
  const ranges = text.match(DATE_RANGE_PATTERN) || [];
  return Math.min(ranges.length * 2, 20); // rough estimate
}

function extractExperienceEntries(text: string): string[] {
  const entries: string[] = [];
  const titleMatches: string[] = [];

  for (const pattern of JOB_TITLE_PATTERNS) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      titleMatches.push(m[1].trim());
    }
  }

  // Try to pair titles with organisations
  for (const title of titleMatches.slice(0, 5)) {
    const idx = text.toLowerCase().indexOf(title.toLowerCase());
    if (idx === -1) continue;
    const context = text.slice(idx, idx + 200);
    let org = "";
    for (const orgPat of ORG_PATTERNS) {
      const om = orgPat.exec(context);
      if (om) { org = om[1].trim(); break; }
    }
    entries.push(org ? `${title} at ${org}` : title);
  }

  return entries.length ? entries : titleMatches.slice(0, 4);
}

function buildSummary(data: Omit<ExtractedCVData, "summary">): string {
  const parts: string[] = [];

  if (data.currentOrLastRole) parts.push(`${data.currentOrLastRole}`);
  if (data.totalExperienceYears > 0) parts.push(`${data.totalExperienceYears}+ years of experience`);
  if (data.qualifications.length) parts.push(`qualified with ${data.qualifications[0]}`);
  if (data.subjects.length) parts.push(`teaches ${data.subjects.slice(0, 3).join(", ")}`);
  if (data.certifications.length) parts.push(`holds ${data.certifications[0]}`);

  return parts.length
    ? `Candidate is a ${parts.join(", ")}.`
    : "CV parsed successfully. Please review the details below.";
}

export function extractFromCV(cvText: string): ExtractedCVData {
  const qualifications = extractQualifications(cvText);
  const certifications = extractCertifications(cvText);
  const subjects = extractSubjects(cvText);
  const experience = extractExperienceEntries(cvText);
  const totalExperienceYears = extractTotalExperience(cvText);
  const currentOrLastRole = experience[0]?.split(" at ")[0] || "";

  const base = {
    name: extractName(cvText),
    email: extractEmail(cvText),
    phone: extractPhone(cvText),
    qualifications,
    certifications,
    subjects,
    experience,
    totalExperienceYears,
    currentOrLastRole,
  };

  return { ...base, summary: buildSummary(base) };
}
