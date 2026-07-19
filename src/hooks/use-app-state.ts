import { create } from "zustand";

export type ExamType = "jee-main" | "jee-advanced";
export type ViewType = "landing" | "questions" | "saved";
export type QuestionTypeFilter = "all" | "MCQ" | "Numerical";

export interface SubjectData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  chapters: ChapterData[];
}

export interface ChapterData {
  id: string;
  name: string;
  slug: string;
  category?: string;
  examType: string;
  questionCount: number;
}

export interface QuestionData {
  id: string;
  questionText: string;
  questionHtml?: string;
  options?: string;
  correctAnswer?: string;
  solution?: string;
  solutionHtml?: string;
  imageUrl?: string;
  imageUrls?: string;
  questionType: string;
  year?: number;
  exam: string;
  shift?: string;
  paper?: string;
  language?: string;
  subject: { name: string; slug: string };
  chapter?: { name: string; slug: string } | null;
}

export interface SavedQuestionData {
  id: string;
  userId: string;
  questionId: string;
  notes?: string;
  createdAt: string;
  question: QuestionData;
}

interface AppState {
  // View state
  view: ViewType;
  setView: (view: ViewType) => void;

  // Exam type
  examType: ExamType;
  setExamType: (exam: ExamType) => void;

  // Subjects & chapters
  subjects: SubjectData[];
  setSubjects: (subjects: SubjectData[]) => void;
  subjectsLoading: boolean;
  setSubjectsLoading: (loading: boolean) => void;

  // Selected subject
  selectedSubject: SubjectData | null;
  setSelectedSubject: (subject: SubjectData | null) => void;

  // Selected chapter
  selectedChapter: ChapterData | null;
  setSelectedChapter: (chapter: ChapterData | null) => void;

  // Questions
  questions: QuestionData[];
  setQuestions: (questions: QuestionData[]) => void;
  appendQuestions: (questions: QuestionData[]) => void;
  questionsLoading: boolean;
  setQuestionsLoading: (loading: boolean) => void;
  questionsPage: number;
  setQuestionsPage: (page: number) => void;
  questionsTotal: number;
  setQuestionsTotal: (total: number) => void;
  questionsTotalPages: number;
  setQuestionsTotalPages: (totalPages: number) => void;

  // Question type filter
  questionTypeFilter: QuestionTypeFilter;
  setQuestionTypeFilter: (filter: QuestionTypeFilter) => void;

  // Saved questions
  savedQuestions: SavedQuestionData[];
  setSavedQuestions: (questions: SavedQuestionData[]) => void;
  savedQuestionsLoading: boolean;
  setSavedQuestionsLoading: (loading: boolean) => void;
  savedSubjectFilter: string;
  setSavedSubjectFilter: (filter: string) => void;
  savedQuestionIds: Set<string>;
  setSavedQuestionIds: (ids: Set<string>) => void;
  toggleSavedQuestionId: (id: string) => void;
  savedCount: number;
  setSavedCount: (count: number) => void;

  // Auth modal
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppState = create<AppState>((set) => ({
  // View
  view: "landing",
  setView: (view) => set({ view }),

  // Exam type
  examType: "jee-main",
  setExamType: (examType) =>
    set({ examType, selectedChapter: null, questions: [], questionsPage: 1 }),

  // Subjects
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
  subjectsLoading: false,
  setSubjectsLoading: (subjectsLoading) => set({ subjectsLoading }),

  // Selected subject
  selectedSubject: null,
  setSelectedSubject: (selectedSubject) =>
    set({ selectedSubject, selectedChapter: null, questions: [], questionsPage: 1 }),

  // Selected chapter
  selectedChapter: null,
  setSelectedChapter: (selectedChapter) =>
    set({ selectedChapter, questions: [], questionsPage: 1 }),

  // Questions
  questions: [],
  setQuestions: (questions) => set({ questions }),
  appendQuestions: (newQuestions) =>
    set((state) => ({ questions: [...state.questions, ...newQuestions] })),
  questionsLoading: false,
  setQuestionsLoading: (questionsLoading) => set({ questionsLoading }),
  questionsPage: 1,
  setQuestionsPage: (questionsPage) => set({ questionsPage }),
  questionsTotal: 0,
  setQuestionsTotal: (questionsTotal) => set({ questionsTotal }),
  questionsTotalPages: 0,
  setQuestionsTotalPages: (questionsTotalPages) => set({ questionsTotalPages }),

  // Question type filter
  questionTypeFilter: "all",
  setQuestionTypeFilter: (questionTypeFilter) =>
    set({ questionTypeFilter, questions: [], questionsPage: 1 }),

  // Saved questions
  savedQuestions: [],
  setSavedQuestions: (savedQuestions) => set({ savedQuestions }),
  savedQuestionsLoading: false,
  setSavedQuestionsLoading: (savedQuestionsLoading) => set({ savedQuestionsLoading }),
  savedSubjectFilter: "all",
  setSavedSubjectFilter: (savedSubjectFilter) => set({ savedSubjectFilter }),
  savedQuestionIds: new Set<string>(),
  setSavedQuestionIds: (savedQuestionIds) => set({ savedQuestionIds }),
  toggleSavedQuestionId: (id) =>
    set((state) => {
      const newIds = new Set(state.savedQuestionIds);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return {
        savedQuestionIds: newIds,
        savedCount: newIds.size,
      };
    }),
  savedCount: 0,
  setSavedCount: (savedCount) => set({ savedCount }),

  // Auth modal
  authModalOpen: false,
  setAuthModalOpen: (authModalOpen) => set({ authModalOpen }),

  // Mobile sidebar
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));