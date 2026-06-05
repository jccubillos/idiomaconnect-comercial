/**
 * Quiz evaluation — direct port of `evaluate_quiz()` from main(3).py.
 * Compares user answers against the lesson's mc/fitb truth.
 */

import type { MCQuestion, FITBQuestion } from "@/lib/groq/lesson";

export interface MCFeedback {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface FITBFeedback {
  sentence: string;
  userAnswer: string;
  correctAnswer: string;
  hint: string;
  isCorrect: boolean;
}

export interface QuizEvaluation {
  correct: number;
  total: number;
  scorePct: number;       // 0..1
  passed: boolean;        // >= PASSING_SCORE
  mcFeedback: MCFeedback[];
  fitbFeedback: FITBFeedback[];
}

export const PASSING_SCORE = 0.6;
export const XP_PER_LESSON = 50;
export const MAX_QUIZ_ATTEMPTS = 3;

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function evaluateQuiz(
  mcQuestions: MCQuestion[],
  fitbQuestions: FITBQuestion[],
  mcAnswers: Record<number, string>,
  fitbAnswers: Record<number, string>,
): QuizEvaluation {
  const mcFeedback: MCFeedback[] = mcQuestions.map((q, i) => {
    const userAnswer = mcAnswers[i] ?? "";
    const isCorrect = userAnswer.trim() === q.answer.trim();
    return {
      question: q.q,
      userAnswer: userAnswer || "(sin respuesta)",
      correctAnswer: q.answer,
      isCorrect,
    };
  });

  const fitbFeedback: FITBFeedback[] = fitbQuestions.map((q, i) => {
    const userAnswer = fitbAnswers[i] ?? "";
    const isCorrect = normalize(userAnswer) === normalize(q.answer);
    return {
      sentence: q.sentence,
      userAnswer: userAnswer || "(sin respuesta)",
      correctAnswer: q.answer,
      hint: q.hint,
      isCorrect,
    };
  });

  const correct =
    mcFeedback.filter((f) => f.isCorrect).length +
    fitbFeedback.filter((f) => f.isCorrect).length;
  const total = mcQuestions.length + fitbQuestions.length;
  const scorePct = total > 0 ? correct / total : 0;

  return {
    correct,
    total,
    scorePct,
    passed: scorePct >= PASSING_SCORE,
    mcFeedback,
    fitbFeedback,
  };
}

/**
 * XP awarded scales with quiz score. Base 50 XP at 100%, floor 10 XP at the passing line.
 */
export function calculateXp(scorePct: number): number {
  if (scorePct < PASSING_SCORE) return 0;
  const range = 1 - PASSING_SCORE;
  const above = scorePct - PASSING_SCORE;
  const linear = 10 + Math.round((above / range) * (XP_PER_LESSON - 10));
  return Math.max(0, Math.min(XP_PER_LESSON, linear));
}
