import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Menu } from 'lucide-react';
import { useTestStore } from '../../../store/useTestStore';

interface QuestionSidebarProps {
  questions: any[];
  activeId: number;
  onSelect: (id: number) => void;
  totalCount: number;
}

export const QuestionSidebar: React.FC<QuestionSidebarProps> = ({ 
  questions, activeId, onSelect, totalCount 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // --- FIXED ZUSTAND DATA ACCESS ---
  // We now grab the questions specifically belonging to the active test
  const activeTestId = useTestStore(state => state.activeTestId);
  const savedQuestions = useTestStore(state => 
    activeTestId ? state.tests[activeTestId]?.questions || {} : {}
  );

  if (isCollapsed) {
    return (
      <div className="w-16 bg-surface border-r border-border-subtle flex flex-col h-full shrink-0 items-center py-4 transition-all duration-300">
        <button onClick={() => setIsCollapsed(false)} className="p-2 hover:bg-gray-100 rounded-md text-text-muted">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-surface border-r border-border-subtle flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[13px] font-semibold text-brand-primary">Question creation</span>
        <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-gray-100 rounded-md text-text-muted transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        <p className="text-[11px] font-semibold text-text-title tracking-wider uppercase">
          Total Questions - {totalCount}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {questions.map((q) => {
          // Now this safely checks against the active test's questions object
          const isSaved = !!savedQuestions[q.id];
          
          return (
            <button
              key={q.id}
              onClick={() => onSelect(q.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm transition-all border ${
                activeId === q.id
                  ? 'bg-blue-50/50 border-brand-primary/20 text-brand-primary shadow-sm'
                  : 'bg-surface border-border-subtle text-text-body hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${isSaved ? 'text-green-500' : 'text-border-subtle'}`} />
                <span className="font-medium">{q.text}</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${activeId === q.id ? 'text-brand-primary' : 'text-text-muted'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};