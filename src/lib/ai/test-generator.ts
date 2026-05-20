import OpenAI from "openai";

const GROQ_KEY = process.env.GROQ_API_KEY;
const isLive = !!GROQ_KEY && GROQ_KEY !== "paste-your-groq-key-here";

const client = isLive
  ? new OpenAI({ apiKey: GROQ_KEY, baseURL: "https://api.groq.com/openai/v1" })
  : null;

// llama-3.3-70b-versatile — free tier on Groq, excellent instruction following
const MODEL = "llama-3.3-70b-versatile";

export type QuestionType = "MCQ" | "SHORT" | "LONG" | "TRUE_FALSE";

export interface GeneratedQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface GenerateParams {
  subject: string;
  gradeLevel: string;
  questionTypes: QuestionType[];
  totalQuestions: number;
  customTopic?: string;
}

const GRADE_LABELS: Record<string, string> = {
  PRIMARY_1_5: "Primary (Class 1–5)",
  UPPER_PRIMARY_6_8: "Upper Primary (Class 6–8)",
  SECONDARY_9_10: "Secondary (Class 9–10)",
  SR_SECONDARY_11_12: "Senior Secondary (Class 11–12)",
};

const MARKS: Record<QuestionType, number> = { MCQ: 1, TRUE_FALSE: 1, SHORT: 3, LONG: 5 };

function mockQuestions(params: GenerateParams): GeneratedQuestion[] {
  return Array.from({ length: params.totalQuestions }, (_, i) => {
    const type = params.questionTypes[i % params.questionTypes.length];
    if (type === "MCQ") return { type, question: `Sample MCQ ${i + 1}: What is a key concept in ${params.subject}?`, options: ["Option A", "Option B", "Option C", "Option D"], correctAnswer: "Option A", marks: 1 };
    if (type === "TRUE_FALSE") return { type, question: `Sample T/F ${i + 1}: ${params.subject} follows CBSE curriculum guidelines.`, correctAnswer: "True", marks: 1 };
    if (type === "SHORT") return { type, question: `Sample Short ${i + 1}: Briefly explain a core concept in ${params.subject}.`, marks: 3 };
    return { type, question: `Sample Long ${i + 1}: Describe how you would teach a lesson in ${params.subject}.`, marks: 5 };
  });
}

export async function generateTestQuestions(params: GenerateParams): Promise<GeneratedQuestion[]> {
  if (!isLive) return mockQuestions(params);

  const gradeLabel = GRADE_LABELS[params.gradeLevel] ?? params.gradeLevel;
  const topicLine = params.customTopic
    ? `Focus specifically on the topic: "${params.customTopic}".`
    : `Cover a broad range of important concepts for this subject and grade level.`;

  const prompt = `You are an expert CBSE curriculum designer creating a teacher competency assessment.

Subject: ${params.subject}
Grade Level: ${gradeLabel}
Question Types Required: ${params.questionTypes.join(", ")}
Total Questions: ${params.totalQuestions}
${topicLine}

Distribute the ${params.totalQuestions} questions as evenly as possible across these types: ${params.questionTypes.join(", ")}.

IMPORTANT Rules:
- Questions must test the TEACHER's subject knowledge and pedagogical ability — not student-level questions.
- Every question must be unique, specific, and directly related to the subject and topic.
- MCQ: provide exactly 4 options as plain strings (no A/B/C/D prefix). Set correctAnswer to the exact text of the correct option.
- TRUE_FALSE: set correctAnswer to exactly "True" or "False".
- SHORT and LONG: set correctAnswer to null.
- Marks: MCQ=1, TRUE_FALSE=1, SHORT=3, LONG=5.

Return ONLY a valid JSON array, no markdown fences, no explanation whatsoever:
[{"type":"MCQ","question":"...","options":["...","...","...","..."],"correctAnswer":"...","marks":1}]`;

  const response = await client!.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content ?? "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI did not return a valid JSON array");

  const parsed: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);
  return parsed.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options ?? undefined,
    correctAnswer: q.correctAnswer ?? undefined,
    marks: MARKS[q.type] ?? 1,
  }));
}

export interface GradeParams {
  subject: string;
  gradeLevel: string;
  questions: Array<{
    type: QuestionType;
    question: string;
    correctAnswer?: string;
    marks: number;
    answer: string;
  }>;
}

export interface GradedResponse {
  scores: Array<{ index: number; score: number; feedback: string }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  aiSummary: string;
}

export async function gradeTestResponses(params: GradeParams): Promise<GradedResponse> {
  const maxScore = params.questions.reduce((s, q) => s + q.marks, 0);

  // Auto-grade MCQ and TRUE_FALSE locally — no AI needed
  const localScores: Array<{ index: number; score: number; feedback: string }> = [];
  const aiQueue: Array<{ idx: number; q: (typeof params.questions)[0] }> = [];

  params.questions.forEach((q, idx) => {
    if (q.type === "MCQ" || q.type === "TRUE_FALSE") {
      const correct = q.correctAnswer?.toLowerCase().trim() === q.answer?.toLowerCase().trim();
      localScores.push({
        index: idx,
        score: correct ? q.marks : 0,
        feedback: correct ? "Correct" : `Incorrect. Correct answer: ${q.correctAnswer}`,
      });
    } else {
      aiQueue.push({ idx, q });
    }
  });

  const aiScores: Array<{ index: number; score: number; feedback: string }> = [];

  if (aiQueue.length > 0 && isLive) {
    const gradePrompt = `You are a teacher evaluation expert. Grade these written answers from a teacher.

Subject: ${params.subject}
Grade Level: ${params.gradeLevel}

${aiQueue.map(({ idx, q }) => `Q${idx + 1} [${q.type}, ${q.marks} marks]:\nQuestion: ${q.question}\nAnswer: ${q.answer || "(no answer provided)"}\n---`).join("\n")}

For each question provide a score out of the stated marks and 1–2 sentence feedback.
Return ONLY a valid JSON array:
[{"index":<original_question_index>,"score":<number>,"feedback":"<text>"}]`;

    try {
      const response = await client!.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: gradePrompt }],
        temperature: 0.3,
      });
      const text = response.choices[0]?.message?.content ?? "";
      const m = text.match(/\[[\s\S]*\]/);
      if (m) aiScores.push(...JSON.parse(m[0]));
    } catch {
      aiQueue.forEach(({ idx, q }) =>
        aiScores.push({ index: idx, score: Math.round(q.marks * 0.5), feedback: "Auto-graded (AI unavailable)" })
      );
    }
  } else if (aiQueue.length > 0) {
    aiQueue.forEach(({ idx, q }) =>
      aiScores.push({ index: idx, score: Math.round(q.marks * 0.6), feedback: "Sample feedback (no AI key configured)" })
    );
  }

  const allScores = [...localScores, ...aiScores].sort((a, b) => a.index - b.index);
  const totalScore = allScores.reduce((s, r) => s + r.score, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let aiSummary = `Scored ${totalScore}/${maxScore} (${percentage}%).`;

  if (isLive) {
    try {
      const response = await client!.chat.completions.create({
        model: MODEL,
        messages: [{
          role: "user",
          content: `Write exactly 2 sentences summarising a teacher's test performance. Subject: ${params.subject}. Score: ${totalScore}/${maxScore} (${percentage}%). Mention key strengths or gaps.`,
        }],
        temperature: 0.5,
      });
      const text = response.choices[0]?.message?.content?.trim();
      if (text) aiSummary = text;
    } catch {
      // keep default
    }
  }

  return { scores: allScores, totalScore, maxScore, percentage, aiSummary };
}
