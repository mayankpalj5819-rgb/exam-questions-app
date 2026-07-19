"use client";

import { useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppState, type ChapterData, type SubjectData } from "@/hooks/use-app-state";
import { Navbar } from "@/components/navbar";
import { AuthModal } from "@/components/auth-modal";
import { Landing } from "@/components/landing";
import { ChapterSidebar, MobileChapterSidebar } from "@/components/chapter-sidebar";
import { QuestionList } from "@/components/question-list";
import { SavedDashboard } from "@/components/saved-dashboard";

export default function Home() {
  const { data: session, status } = useSession();
  const {
    view,
    examType,
    subjects,
    setSubjects,
    subjectsLoading,
    setSubjectsLoading,
    setSavedQuestionIds,
    setSavedCount,
    setQuestions,
    setSelectedChapter,
  } = useAppState();

  // Fetch subjects/chapters when exam type changes
  const fetchSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    try {
      const res = await fetch(`/api/chapters?exam=${examType}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSubjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setSubjectsLoading(false);
    }
  }, [examType, setSubjects, setSubjectsLoading]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Fetch saved question IDs for current user
  const fetchSavedIds = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/saved");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const ids = new Set<string>(data.map((sq: { questionId: string }) => sq.questionId));
        setSavedQuestionIds(ids);
        setSavedCount(ids.size);
      }
    } catch (err) {
      console.error("Failed to fetch saved IDs:", err);
    }
  }, [session?.user, setSavedQuestionIds, setSavedCount]);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const handleChapterSelect = (chapter: ChapterData) => {
    setSelectedChapter(chapter);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AuthModal />

      {view === "landing" && <Landing />}

      {view === "questions" && (
        <div className="flex-1 flex">
          <ChapterSidebar onChapterSelect={handleChapterSelect} />
          <MobileChapterSidebar onChapterSelect={handleChapterSelect} />
          <main className="flex-1 min-w-0">
            <QuestionList />
          </main>
        </div>
      )}

      {view === "saved" && (
        <div className="flex-1 flex">
          <main className="flex-1 min-w-0">
            <SavedDashboard />
          </main>
        </div>
      )}

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Built for JEE aspirants · JEE PYQ Vault
        </div>
      </footer>
    </div>
  );
}