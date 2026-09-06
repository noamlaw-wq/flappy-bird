/**
 * Core data model for the English-learning platform.
 *
 * There are two broad families of types:
 *  - CURRICULUM types (static content authored as data): Course, Unit, Lesson,
 *    Skill, Concept, VocabularyItem, Example, Exercise.
 *  - LEARNER-STATE types (persisted per learner): LearnerProfile, MasteryRecord,
 *    ExerciseAttempt, ErrorRecord, ReviewItem, LearningSession, Diagnostic state.
 *
 * The model is intentionally DB-ready: every entity has a stable string id and
 * relationships are expressed by id references, so it can be moved behind an
 * ORM later without changing the shape of the content.
 */

/* ------------------------------------------------------------------ */
/* Shared enums                                                        */
/* ------------------------------------------------------------------ */

export type SkillCategory =
  | 'vocabulary'
  | 'grammar'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'pronunciation';

/** Pedagogical exercise type (what the exercise trains). */
export type ExerciseType =
  | 'multipleChoice'
  | 'trueFalse'
  | 'chooseWord'
  | 'chooseSentence'
  | 'fillBlank'
  | 'multiBlank'
  | 'reorder'
  | 'matching'
  | 'wordMeaning'
  | 'meaningContext'
  | 'grammarId'
  | 'tenseSelect'
  | 'verbForm'
  | 'errorId'
  | 'sentenceCorrection'
  | 'transformation'
  | 'questionFormation'
  | 'shortAnswer'
  | 'readingComprehension'
  | 'listeningComprehension'
  | 'audioRecognition'
  | 'sentenceConstruction'
  | 'controlledWriting'
  | 'speaking';

/** Render/interaction family — many ExerciseTypes share one renderer + grader. */
export type ExerciseKind =
  | 'choice' // single-select from options (optionally with a passage/audio)
  | 'trueFalse'
  | 'fill' // one or more free-text blanks
  | 'reorder' // arrange tokens into a sentence
  | 'matching' // pair items on the left with items on the right
  | 'open' // free-text response graded by normalized comparison
  | 'speaking'; // say it aloud; graded by speech recognition or self-report

/** The staged pedagogy applied to important concepts (§16). */
export type LearningStage =
  | 'exposure'
  | 'recognition'
  | 'comprehension'
  | 'controlled'
  | 'discrimination'
  | 'production'
  | 'contextual'
  | 'review'
  | 'masteryCheck';

/** Categories a mistake can be classified into (§7). */
export type ErrorCategory =
  | 'vocabulary'
  | 'wordOrder'
  | 'article'
  | 'agreement'
  | 'auxiliary'
  | 'tense'
  | 'verbForm'
  | 'preposition'
  | 'pronoun'
  | 'plural'
  | 'spelling'
  | 'readingComprehension'
  | 'listeningComprehension'
  | 'sentenceConstruction';

export type MasteryStatus =
  | 'notStarted'
  | 'learning'
  | 'needsReview'
  | 'weak'
  | 'mastered';

/** Coarse level label used in the diagnostic skill profile (§9). */
export type SkillStrength = 'weak' | 'developing' | 'strong';

/* ------------------------------------------------------------------ */
/* Curriculum content                                                  */
/* ------------------------------------------------------------------ */

export interface Course {
  id: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  unitIds: string[];
}

export interface Unit {
  id: string;
  courseId: string;
  /** Curriculum level 1–10 (§5). */
  level: number;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  lessonIds: string[];
}

export interface Example {
  id: string;
  /** English content (kept LTR in the UI). */
  text: string;
  /** Hebrew support/gloss (optional). */
  he?: string;
  /** Text to speak with speech synthesis; defaults to `text`. */
  audioText?: string;
  note?: string;
  noteHe?: string;
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  titleHe: string;
  /** Learner-facing objective. */
  objective: string;
  objectiveHe: string;
  /** Broad skills this lesson trains. */
  skillIds: string[];
  /** Fine-grained concepts. */
  conceptIds: string[];
  vocabularyIds: string[];
  /** Worked examples shown before practice (the "exposure" stage). */
  examples: Example[];
  exerciseIds: string[];
  /** Lessons that should be mastered first. */
  prerequisiteLessonIds: string[];
  /** Short teaching text (Hebrew explanation of the concept). */
  introHe: string;
  introEn?: string;
}

export interface Skill {
  id: string;
  name: string;
  nameHe: string;
  category: SkillCategory;
}

export interface Concept {
  id: string;
  skillId: string;
  name: string;
  nameHe: string;
  explanation: string;
  explanationHe: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  partOfSpeech: string;
  meaningEn: string;
  meaningHe: string;
  example: string;
  exampleHe?: string;
  ipa?: string;
}

export interface ExerciseOption {
  id: string;
  text: string;
  he?: string;
}

/** A single blank in a fill / multi-blank exercise. */
export interface Blank {
  id: string;
  /** Text shown before the input (LTR English). */
  before: string;
  /** Text shown after the input. */
  after: string;
  answer: string;
  acceptable?: string[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  skillId: string;
  conceptId?: string;
  type: ExerciseType;
  kind: ExerciseKind;
  stage: LearningStage;
  difficulty: 1 | 2 | 3 | 4 | 5;

  /** Hebrew instruction line ("what to do"). */
  instructionHe: string;
  /** Main English prompt / question / sentence. */
  prompt?: string;
  promptHe?: string;

  /** Reading passage (kind: choice with reading). */
  passage?: string;
  /** Text spoken by speech synthesis (listening / speaking / audioRecognition). */
  audioText?: string;

  /** choice / trueFalse options. */
  options?: ExerciseOption[];
  /** Correct option id (choice/trueFalse). */
  correctOptionId?: string;

  /** fill / multiBlank blanks. */
  blanks?: Blank[];

  /** reorder: the tokens (correct order); UI shuffles them. */
  answerOrder?: string[];

  /** matching / wordMeaning pairs. */
  pairs?: { left: string; right: string }[];

  /** open response: canonical + acceptable answers. */
  acceptable?: string[];
  /** Model answer to reveal after an open/production/speaking task. */
  modelAnswer?: string;

  explanation?: string;
  explanationHe?: string;
  hintHe?: string;

  vocabularyIds?: string[];
  tags?: string[];
  /** Error categories a wrong answer on this exercise maps to. */
  errorCategories?: ErrorCategory[];
}

/* ------------------------------------------------------------------ */
/* Learner state (persisted)                                           */
/* ------------------------------------------------------------------ */

export interface LearnerSettings {
  hebrewSupport: boolean;
  audioAutoplay: boolean;
  speechRate: number;
}

export interface LearnerProfile {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
  onboarded: boolean;
  diagnosticCompleted: boolean;
  /** Per-skill profile produced by the diagnostic (§9). */
  skillProfile: Record<string, { strength: SkillStrength; score: number }>;
  settings: LearnerSettings;
}

/** Which kind of thing a mastery/review record refers to. */
export type TargetType = 'lesson' | 'skill' | 'concept';

export interface MasteryRecord {
  targetType: TargetType;
  targetId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  /** All-time accuracy 0–1. */
  accuracy: number;
  /** Accuracy over the most recent attempts 0–1. */
  recentAccuracy: number;
  /** 0–100 composite mastery. */
  masteryScore: number;
  lastPracticed: number | null;
  consecutiveCorrect: number;
  status: MasteryStatus;
  /** Count of each error category observed on this target. */
  errorCounts: Partial<Record<ErrorCategory, number>>;
  /** Rolling window of recent correct/incorrect (true = correct). */
  recent: boolean[];
}

export interface ExerciseAttempt {
  id: string;
  exerciseId: string;
  lessonId: string;
  skillId: string;
  conceptId?: string;
  timestamp: number;
  correct: boolean;
  /** Serialized learner response, for review/inspection. */
  response: string;
  timeMs: number;
  errorCategories: ErrorCategory[];
  hintUsed: boolean;
  /** Session that produced this attempt, if any. */
  sessionId?: string;
}

export interface ReviewItem {
  /** Composite id: `${targetType}:${targetId}`. */
  id: string;
  targetType: TargetType;
  targetId: string;
  /** Epoch ms when this becomes due. */
  dueAt: number;
  /** SM-2-lite interval in days. */
  intervalDays: number;
  /** Ease factor. */
  ease: number;
  /** How many successful review reps have happened. */
  reps: number;
  reason: ReviewReason;
}

export type ReviewReason =
  | 'spaced'
  | 'recentError'
  | 'weakSkill'
  | 'lowMastery'
  | 'newlyLearned';

/** A step inside a running learning session. */
export type SessionPhase =
  | 'intro'
  | 'example'
  | 'guided'
  | 'independent'
  | 'review'
  | 'mastery';

export interface SessionItem {
  /** For exercise steps. */
  exerciseId?: string;
  /** For content steps (intro/example) we render lesson content instead. */
  kind: 'content-intro' | 'content-examples' | 'exercise' | 'summary';
  phase: SessionPhase;
  done: boolean;
  correct?: boolean;
}

export type SessionMode = 'lesson' | 'review' | 'diagnostic' | 'mixed';

export interface LearningSession {
  id: string;
  mode: SessionMode;
  lessonId?: string;
  title: string;
  titleHe: string;
  items: SessionItem[];
  currentIndex: number;
  startedAt: number;
  completedAt: number | null;
  /** Running tally for the session summary. */
  answered: number;
  correctCount: number;
}

/* ------------------------------------------------------------------ */
/* Diagnostic (§9)                                                     */
/* ------------------------------------------------------------------ */

export interface DiagnosticQuestion {
  exercise: Exercise;
  /** Skills this question contributes evidence toward. */
  skillIds: string[];
  /** Level weight (higher = harder). */
  level: number;
}

/* The persisted result of a diagnostic is folded into LearnerProfile.skillProfile
   plus a DiagnosticResult snapshot kept in the store. */
export interface DiagnosticResult {
  completedAt: number;
  perSkill: Record<string, { correct: number; total: number; score: number; strength: SkillStrength }>;
  recommendedLessonId: string | null;
}

/* ------------------------------------------------------------------ */
/* The full persisted learner state                                    */
/* ------------------------------------------------------------------ */

export interface LearnerState {
  version: number;
  profile: LearnerProfile;
  /** keyed by `${targetType}:${targetId}`. */
  mastery: Record<string, MasteryRecord>;
  attempts: ExerciseAttempt[];
  reviews: Record<string, ReviewItem>;
  /** The in-progress session, if any (supports pause/resume, §10). */
  activeSession: LearningSession | null;
  /** History of completed sessions (most recent first). */
  sessionHistory: { id: string; mode: SessionMode; lessonId?: string; completedAt: number; answered: number; correctCount: number; title: string }[];
  diagnostic: DiagnosticResult | null;
}
