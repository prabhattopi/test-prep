import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTestStore } from '../../store/useTestStore';
import { QuestionSidebar } from './components/QuestionSidebar';
import { QuestionEditor } from './components/QuestionEditor';

export const AddQuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const activeTestId = useTestStore((state) => state.activeTestId);
  const tests = useTestStore((state) => state.tests);
  const testDetails = activeTestId ? tests[activeTestId]?.details : null;

  // ✅ FIX: Read from correct path
  const totalQuestions = parseInt(
    testDetails?.total_questions || testDetails?.rawForm?.noOfQuestions || '1',
    10
  );

  const questions = Array.from({ length: totalQuestions }, (_, i) => ({
    id: i + 1,
    text: `Question ${i + 1}`,
  }));

  const [activeQuestionId, setActiveQuestionId] = useState<number>(1);

  const handleNextQuestion = () => {
    if (activeQuestionId < totalQuestions) {
      setActiveQuestionId((prev) => prev + 1);
    }
  };

  const handlePublish = () => {
    navigate('/tests/new/publish');
  };

  if (!activeTestId) {
    return <div className="p-8 text-center text-text-muted">No active test found. Please return to the dashboard.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-8 bg-surface border-t border-border-subtle">
      <QuestionSidebar
        questions={questions}
        activeId={activeQuestionId}
        onSelect={setActiveQuestionId}
        totalCount={totalQuestions}
      />
      <div className="flex-1 flex flex-col bg-bg-main overflow-hidden relative">
        <QuestionEditor
          questionId={activeQuestionId}
          onPublish={handlePublish}
          onNextQuestion={handleNextQuestion}
        />
      </div>
    </div>
  );
};