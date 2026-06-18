/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // <--- NEW IMPORT
import { v4 as uuidv4 } from 'uuid';

export type TestStatus = 'Draft' | 'Live' | 'Scheduled' | 'Completed';

export interface TestRecord {
  id: string;
  status: TestStatus;
  createdAt: string;
  details: any;
  questions: Record<number, any>;
  publishData?: any;
}

interface TestStore {
  tests: Record<string, TestRecord>;
  activeTestId: string | null;
  initializeNewTest: () => string;
  setActiveTest: (id: string) => void;
  updateTestDetails: (id: string, details: any) => void;
  saveQuestion: (testId: string, questionId: number, data: any) => void;
  finalizePublish: (testId: string, publishData: any, status: TestStatus) => void;
  deleteTest: (id: string) => void;
}

export const useTestStore = create<TestStore>()(
  // Wrap the entire store in persist!
  persist(
    (set) => ({
      tests: {}, // Start empty in production
      activeTestId: null,

      initializeNewTest: () => {
        const newId = uuidv4();
        set((state) => ({
          activeTestId: newId,
          tests: {
            ...state.tests,
            [newId]: { id: newId, status: 'Draft', createdAt: new Date().toISOString(), details: {}, questions: {} }
          }
        }));
        return newId;
      },

      setActiveTest: (id) => set({ activeTestId: id }),

      updateTestDetails: (id, details) => set((state) => {
        const existingTest = state.tests[id];
        if (!existingTest) {
          return { tests: { ...state.tests, [id]: { id, status: 'Draft', createdAt: new Date().toISOString(), details, questions: {} } } };
        }
        return { tests: { ...state.tests, [id]: { ...existingTest, details: { ...existingTest.details, ...details } } } };
      }),

      saveQuestion: (testId, questionId, data) => set((state) => {
        const test = state.tests[testId];
        if (!test) return state;
        return { tests: { ...state.tests, [testId]: { ...test, questions: { ...test.questions, [questionId]: data } } } };
      }),

      finalizePublish: (testId, publishData, status) => set((state) => {
        const test = state.tests[testId];
        if (!test) return state;
        return { tests: { ...state.tests, [testId]: { ...test, publishData, status } }, activeTestId: null };
      }),

      deleteTest: (id) => set((state) => {
        const newTests = { ...state.tests };
        delete newTests[id];
        return { tests: newTests };
      })
    }),
    {
      name: 'preproute-test-storage', // The name of the localStorage key
    }
  )
);