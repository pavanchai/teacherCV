import type { CBSEBenchmark } from "@/types";

export const CBSE_BENCHMARKS: CBSEBenchmark[] = [
  {
    gradeLevel: "PRIMARY_1_5",
    gradeLevelLabel: "Primary (Class 1–5)",
    subjects: [
      {
        subject: "General",
        minQualification: "Senior Secondary (10+2) with at least 50% marks AND 2-year Diploma in Elementary Education (D.El.Ed) OR B.El.Ed",
        preferredQualification: "Bachelor's degree with B.Ed and CTET (Paper I) qualified",
        requiredCertifications: ["CTET Paper I or State TET"],
        minExperienceYears: 0,
        description: "Primary teachers handle all subjects for Classes 1–5. NCTE norms mandate D.El.Ed or B.El.Ed.",
      },
    ],
  },
  {
    gradeLevel: "UPPER_PRIMARY_6_8",
    gradeLevelLabel: "Upper Primary (Class 6–8)",
    subjects: [
      {
        subject: "Mathematics",
        minQualification: "Bachelor's degree with Mathematics as a subject AND B.Ed",
        preferredQualification: "B.Sc (Maths) + B.Ed with CTET/TET Paper II",
        requiredCertifications: ["CTET Paper II (Maths & Science) or State TET"],
        minExperienceYears: 0,
        description: "Must have studied Mathematics at graduation level.",
      },
      {
        subject: "Science",
        minQualification: "Bachelor's degree with Science subjects AND B.Ed",
        preferredQualification: "B.Sc (PCB/PCM) + B.Ed with CTET Paper II",
        requiredCertifications: ["CTET Paper II (Maths & Science) or State TET"],
        minExperienceYears: 0,
        description: "Science teacher for upper primary must have science graduation.",
      },
      {
        subject: "English",
        minQualification: "Bachelor's degree with English as a subject AND B.Ed",
        preferredQualification: "BA (English Hons) + B.Ed with CTET Paper II",
        requiredCertifications: ["CTET Paper II (Language) or State TET"],
        minExperienceYears: 0,
        description: "English teacher must have studied English at graduation level.",
      },
      {
        subject: "Hindi",
        minQualification: "Bachelor's degree with Hindi as a subject AND B.Ed",
        preferredQualification: "BA (Hindi Hons) + B.Ed with CTET Paper II",
        requiredCertifications: ["CTET Paper II (Language) or State TET"],
        minExperienceYears: 0,
        description: "Hindi teacher must have studied Hindi at graduation level.",
      },
      {
        subject: "Social Science",
        minQualification: "Bachelor's degree with Social Science subjects AND B.Ed",
        preferredQualification: "BA (History/Geography/Pol. Sci) + B.Ed with CTET Paper II",
        requiredCertifications: ["CTET Paper II (Social Studies) or State TET"],
        minExperienceYears: 0,
        description: "Social science teacher for upper primary level.",
      },
    ],
  },
  {
    gradeLevel: "SECONDARY_9_10",
    gradeLevelLabel: "Secondary (Class 9–10)",
    subjects: [
      {
        subject: "Mathematics",
        minQualification: "Bachelor's degree in Mathematics (B.Sc/B.A with Maths) AND B.Ed",
        preferredQualification: "M.Sc Mathematics + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Secondary Math teacher as per CBSE/NCTE norms.",
      },
      {
        subject: "Physics",
        minQualification: "B.Sc with Physics AND B.Ed",
        preferredQualification: "M.Sc Physics + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Physics teacher for secondary level.",
      },
      {
        subject: "Chemistry",
        minQualification: "B.Sc with Chemistry AND B.Ed",
        preferredQualification: "M.Sc Chemistry + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Chemistry teacher for secondary level.",
      },
      {
        subject: "Biology",
        minQualification: "B.Sc with Biology AND B.Ed",
        preferredQualification: "M.Sc Biology/Botany/Zoology + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Biology teacher for secondary level.",
      },
      {
        subject: "English",
        minQualification: "BA with English (Hons preferred) AND B.Ed",
        preferredQualification: "MA English + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "English teacher for secondary level.",
      },
      {
        subject: "Hindi",
        minQualification: "BA with Hindi AND B.Ed",
        preferredQualification: "MA Hindi + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Hindi teacher for secondary level.",
      },
      {
        subject: "Social Science",
        minQualification: "BA with History/Geography/Political Science AND B.Ed",
        preferredQualification: "MA in relevant Social Science subject + B.Ed",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Social Science teacher for secondary level.",
      },
      {
        subject: "Computer Science",
        minQualification: "B.Sc/BCA/B.Tech in Computer Science AND B.Ed or PGDCA",
        preferredQualification: "MCA/M.Sc CS + B.Ed",
        requiredCertifications: ["B.Ed or equivalent from NCTE-recognized institution"],
        minExperienceYears: 1,
        description: "Computer Science teacher for secondary level.",
      },
    ],
  },
  {
    gradeLevel: "SR_SECONDARY_11_12",
    gradeLevelLabel: "Senior Secondary (Class 11–12)",
    subjects: [
      {
        subject: "Mathematics",
        minQualification: "M.Sc Mathematics + B.Ed OR B.Sc (Maths Hons) + B.Ed with 5 years exp",
        preferredQualification: "M.Sc Mathematics + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary Math teacher – postgraduate qualification preferred.",
      },
      {
        subject: "Physics",
        minQualification: "M.Sc Physics + B.Ed",
        preferredQualification: "M.Sc Physics + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary Physics teacher.",
      },
      {
        subject: "Chemistry",
        minQualification: "M.Sc Chemistry + B.Ed",
        preferredQualification: "M.Sc Chemistry + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary Chemistry teacher.",
      },
      {
        subject: "Biology",
        minQualification: "M.Sc Biology/Botany/Zoology + B.Ed",
        preferredQualification: "M.Sc + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary Biology teacher.",
      },
      {
        subject: "English",
        minQualification: "MA English + B.Ed",
        preferredQualification: "MA English + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary English teacher.",
      },
      {
        subject: "Economics",
        minQualification: "MA Economics + B.Ed",
        preferredQualification: "MA Economics + B.Ed + NET/SET",
        requiredCertifications: ["B.Ed from NCTE-recognized institution"],
        minExperienceYears: 3,
        description: "Senior Secondary Economics teacher.",
      },
      {
        subject: "Computer Science",
        minQualification: "MCA/M.Sc CS/B.Tech CS + B.Ed",
        preferredQualification: "M.Sc CS/MCA + B.Ed + industry experience",
        requiredCertifications: ["B.Ed or equivalent from NCTE-recognized institution"],
        minExperienceYears: 2,
        description: "Senior Secondary Computer Science teacher.",
      },
      {
        subject: "Physical Education",
        minQualification: "B.P.Ed (Bachelor of Physical Education) from recognized university",
        preferredQualification: "M.P.Ed + B.Ed + NIS coaching certificate",
        requiredCertifications: ["B.P.Ed from recognized university"],
        minExperienceYears: 2,
        description: "Physical Education teacher for senior secondary level.",
      },
    ],
  },
];

export const GRADE_LEVELS = [
  { value: "PRIMARY_1_5", label: "Primary (Class 1–5)" },
  { value: "UPPER_PRIMARY_6_8", label: "Upper Primary (Class 6–8)" },
  { value: "SECONDARY_9_10", label: "Secondary (Class 9–10)" },
  { value: "SR_SECONDARY_11_12", label: "Senior Secondary (Class 11–12)" },
];

export const SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Science",
  "History",
  "Geography",
  "Political Science",
  "Economics",
  "Computer Science",
  "Physical Education",
  "Art & Craft",
  "Music",
  "General",
];

export function getBenchmarkForPosition(gradeLevel: string, subject: string): string {
  const levelBenchmark = CBSE_BENCHMARKS.find((b) => b.gradeLevel === gradeLevel);
  if (!levelBenchmark) return "Not specified";

  const subjectBenchmark =
    levelBenchmark.subjects.find((s) => s.subject === subject) ||
    levelBenchmark.subjects.find((s) => s.subject === "General");

  return subjectBenchmark?.minQualification || "Not specified";
}
