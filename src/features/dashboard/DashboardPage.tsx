import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Eye, AlertTriangle, Loader2, X, CheckCircle2, ChevronLeft, ChevronRight, Menu, Link2 } from 'lucide-react';
import { useTestStore } from '../../store/useTestStore';
import { testApi, questionApi } from '../../services/api';

const optionLabels: Record<string, string> = { option1: 'A', option2: 'B', option3: 'C', option4: 'D' };

// ✅ Mini sidebar for View modal — matches QuestionSidebar design
const ViewQuestionSidebar = ({ questions, activeIdx, onSelect }: { questions: any[]; activeIdx: number; onSelect: (idx: number) => void }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-14 bg-surface border-r border-border-subtle flex flex-col shrink-0 items-center py-4">
        <button onClick={() => setIsCollapsed(false)} className="p-2 hover:bg-gray-100 rounded-md text-text-muted"><Menu className="w-5 h-5" /></button>
      </div>
    );
  }

  return (
    <div className="w-56 bg-surface border-r border-border-subtle flex flex-col shrink-0">
      <div className="p-3 border-b border-border-subtle flex items-center justify-between">
        <span className="text-[12px] font-semibold text-brand-primary">Questions</span>
        <button onClick={() => setIsCollapsed(true)} className="p-1 hover:bg-gray-100 rounded-md text-text-muted"><ChevronLeft className="w-4 h-4" /></button>
      </div>
      <div className="p-2 border-b border-border-subtle">
        <p className="text-[10px] font-semibold text-text-title tracking-wider uppercase">Total — {questions.length}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all border ${
              activeIdx === idx
                ? 'bg-blue-50/50 border-brand-primary/20 text-brand-primary shadow-sm'
                : 'bg-surface border-border-subtle text-text-body hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${activeIdx === idx ? 'text-green-500' : 'text-border-subtle'}`} />
              <span className="font-medium text-[13px]">Question {idx + 1}</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 ${activeIdx === idx ? 'text-brand-primary' : 'text-text-muted'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { deleteTest, initializeNewTest, setActiveTest, tests, updateTestDetails } = useTestStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(''); // ✅ ADDED: Debounced state
  
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [viewTestId, setViewTestId] = useState<string | null>(null);
  const [viewActiveIdx, setViewActiveIdx] = useState(0);

  // ✅ ADDED: Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const { data: apiTests, isLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: testApi.getTests,
  });

 const { data: viewTestData, isLoading: viewLoading } = useQuery({
    queryKey: ['test-view', viewTestId],
    queryFn: async () => {
      if (!viewTestId) return null;
      const testData = await testApi.getTestById(viewTestId);
      let questionsData: any[] = [];
      if (testData?.questions?.length > 0) {
        const rawQuestions = await questionApi.fetchBulk(testData.questions);
        // ✅ FIX: Sort questions to match the order of IDs stored in the test
        const questionMap = new Map(
          (Array.isArray(rawQuestions) ? rawQuestions : []).map((q: any) => [q.id, q])
        );
        questionsData = testData.questions
          .map((id: string) => questionMap.get(id))
          .filter(Boolean);
      }
      return { test: testData, questions: questionsData };
    },
    enabled: !!viewTestId,
  });
  // ✅ UPDATED: Filter using the debounced value instead of raw input
  const testList = (apiTests || []).filter((t: any) =>
    t.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    t.subject?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleCreateNew = () => { initializeNewTest(); navigate('/tests/new'); };
  const handleEdit = (id: string) => { setActiveTest(id); if (!tests[id]) updateTestDetails(id, {}); navigate('/tests/new'); };
  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;
    try { await testApi.deleteTest(testToDelete); deleteTest(testToDelete); queryClient.invalidateQueries({ queryKey: ['tests'] }); } catch (err) { console.error('Delete failed:', err); }
    setTestToDelete(null);
  };
  const openView = (id: string) => { setViewActiveIdx(0); setViewTestId(id); };

  // Current question for view modal
  const viewQuestion = viewTestData?.questions?.[viewActiveIdx] || null;

  return (
    <div className="space-y-6 relative">

      {/* ✅ View Modal — sidebar + single question preview */}
      {viewTestId && (
        <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface w-[95vw] max-w-6xl h-[90vh] rounded-card shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">

            {/* Loading state */}
            {viewLoading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading test details...
              </div>
            ) : viewTestData?.test ? (
              <>
                {/* Sidebar */}
                {viewTestData.questions.length > 0 && (
                  <ViewQuestionSidebar
                    questions={viewTestData.questions}
                    activeIdx={viewActiveIdx}
                    onSelect={(idx) => setViewActiveIdx(idx)}
                  />
                )}

                {/* Right Content */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Header */}
                  <div className="shrink-0 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-title">Test Preview</h2>
                    <button onClick={() => setViewTestId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-text-muted" /></button>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">

                      {/* Test Summary Card — same design as publish page */}
                      <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-primary text-white capitalize">
                            {viewTestData.test.type || 'Test'}
                          </span>
                          <span className="text-lg font-bold text-text-title tracking-tight">
                            📚 {viewTestData.test.name}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            viewTestData.test.status === 'live' ? 'bg-green-100 text-green-700' :
                            viewTestData.test.status === 'scheduled' ? 'bg-blue-100 text-brand-primary' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {viewTestData.test.status || 'draft'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[13px]">
                          <div className="space-y-2">
                            <div className="grid grid-cols-[80px_1fr] items-center">
                              <span className="text-text-muted">Subject</span>
                              <span className="font-medium text-text-title">: {viewTestData.test.subject || '-'}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] items-center">
                              <span className="text-text-muted">Difficulty</span>
                              <span className="font-medium text-text-title capitalize">: {viewTestData.test.difficulty || '-'}</span>
                            </div>
                      
                            {viewTestData.test.topics?.length > 0 && (
                              <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                                <span className="text-text-muted">Topics</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {viewTestData.test.topics.map((t: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded">{t}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {viewTestData.test.sub_topics?.length > 0 && (
                              <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                                <span className="text-text-muted">Sub Topics</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {viewTestData.test.sub_topics.map((st: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 text-[11px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded">{st}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                         
                          </div>
                          <div className="flex flex-col items-end justify-end text-xs text-text-muted font-medium">
                            <div className="flex gap-5">
                              <span>⏱ {viewTestData.test.total_time || 0} Min</span>
                              <span>📋 {viewTestData.test.total_questions || 0} Q's</span>
                              <span>🎯 {viewTestData.test.total_marks || 0} Marks</span>
                            </div>
                            <div className="mt-1 text-[11px]">
                              Marking: +{viewTestData.test.correct_marks || 0} / {viewTestData.test.wrong_marks || 0} / {viewTestData.test.unattempt_marks || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Selected Question Preview */}
                      <div className="space-y-2">
                        <h2 className="text-lg font-bold text-text-title">
                          Question {viewActiveIdx + 1} <span className="text-brand-primary text-[13px] font-medium">/ {viewTestData.questions.length}</span>
                        </h2>

                        {viewQuestion ? (
                          <div className="bg-surface border border-border-subtle rounded-card p-6 shadow-sm space-y-5">
                            {/* Question text */}
                            <div className="flex items-start gap-3">
                              <span className="shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">
                                {viewActiveIdx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-title leading-relaxed" dangerouslySetInnerHTML={{ __html: viewQuestion.question || 'No question text' }} />
                              </div>
                              {viewQuestion.difficulty && (
                                <span className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded capitalize bg-gray-100 text-gray-600 border border-gray-200">
                                  {viewQuestion.difficulty}
                                </span>
                              )}
                            </div>

                            {/* Media */}
                            {viewQuestion.media_url && (
                              <div className="pl-11">
                                <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                                  <Link2 className="w-3 h-3" />
                                  <a href={viewQuestion.media_url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline truncate max-w-md">{viewQuestion.media_url}</a>
                                </div>
                                <img src={viewQuestion.media_url} alt="Question media" className="max-h-40 rounded-subtle border border-border-subtle" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              </div>
                            )}

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                              {['option1', 'option2', 'option3', 'option4'].map((optKey) => {
                                const isCorrect = viewQuestion.correct_option === optKey;
                                return (
                                  <div key={optKey} className={`flex items-center gap-2.5 px-4 py-3 rounded-subtle text-sm border transition-all ${
                                    isCorrect ? 'bg-green-50 border-green-200 text-green-700 font-semibold' : 'bg-bg-main border-border-subtle text-text-body'
                                  }`}>
                                    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                      isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                      {optionLabels[optKey]}
                                    </span>
                                    <span className="flex-1">{viewQuestion[optKey] || '-'}</span>
                                    {isCorrect && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-green-500" />}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            {viewQuestion.explanation && (
                              <div className="pl-11 pt-2 border-t border-border-subtle">
                                <p className="text-[13px] text-text-body">
                                  <span className="font-semibold text-text-title">💡 Explanation:</span> {viewQuestion.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-bg-main border border-border-subtle rounded-card p-8 text-center">
                            <p className="text-sm text-text-muted">No questions found for this test.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 border-t border-border-subtle px-6 py-3 flex items-center justify-between">
                    <div className="text-xs text-text-muted">
                      Viewing question {viewActiveIdx + 1} of {viewTestData.questions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={viewActiveIdx === 0}
                        onClick={() => setViewActiveIdx((p) => p - 1)}
                        className="px-4 py-2 text-sm font-medium text-text-title bg-surface border border-border-subtle rounded-subtle hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <button
                        disabled={viewActiveIdx >= viewTestData.questions.length - 1}
                        onClick={() => setViewActiveIdx((p) => p + 1)}
                        className="px-4 py-2 text-sm font-medium text-text-title bg-surface border border-border-subtle rounded-subtle hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                      <button onClick={() => setViewTestId(null)} className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-subtle transition-colors shadow-sm">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-muted">Failed to load test data.</div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {testToDelete && (
        <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-surface w-full max-w-md rounded-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border-subtle flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-text-title">Delete Test</h3>
                <p className="text-sm text-text-muted mt-1">Are you sure you want to delete this test? This action cannot be undone.</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-bg-main flex justify-end gap-3">
              <button onClick={() => setTestToDelete(null)} className="px-4 py-2 text-sm font-medium text-text-title bg-surface border border-border-subtle rounded-subtle hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-subtle transition-colors shadow-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-title">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">Manage and overview all your created tests.</p>
        </div>
        <button onClick={handleCreateNew} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-medium rounded-subtle shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create New Test
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border-subtle">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search tests by name or subject..." className="w-full pl-9 pr-4 py-2 bg-bg-main border border-border-subtle rounded-subtle text-sm focus:border-brand-primary outline-none transition-colors" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="bg-bg-main border-b border-border-subtle text-text-muted uppercase text-[11px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Test Name</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {isLoading && (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><div className="flex justify-center items-center gap-2 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Fetching tests...</div></td></tr>
            )}
            {!isLoading && testList.map((test: any) => (
              <tr key={test.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-text-title">{test.name || 'Untitled Test'}</td>
                <td className="px-6 py-4 text-text-body">{test.subject || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${test.status === 'live' ? 'bg-green-100 text-green-700' : test.status === 'scheduled' ? 'bg-blue-100 text-brand-primary' : 'bg-gray-100 text-gray-600'}`}>
                    {test.status || 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-text-body">{test.created_at ? new Date(test.created_at).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button onClick={() => openView(test.id)} className="p-1.5 text-text-muted hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="View Test"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(test.id)} className="p-1.5 text-text-muted hover:text-brand-primary hover:bg-blue-50 rounded transition-colors" title="Edit Test"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setTestToDelete(test.id)} className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Test"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {!isLoading && testList.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-text-muted">No tests found on the server.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};