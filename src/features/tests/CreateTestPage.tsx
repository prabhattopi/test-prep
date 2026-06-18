import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from '@tanstack/react-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, AlertCircle, X, Lock } from 'lucide-react';
import { useTestStore } from '../../store/useTestStore';
import { taxonomyApi, testApi } from '../../services/api';
import { apiClient } from '../../config/api';

// --- MULTI-SELECT with lock support ---
const MultiSelect = ({ options = [], selectedIds = [], onChange, placeholder, disabled, loading, locked, lockMessage }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (locked || disabled) return;
    if (selectedIds.includes(id)) onChange(selectedIds.filter((item: string) => item !== id));
    else onChange([...selectedIds, id]);
  };

  const isDisabled = disabled || locked;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        onMouseEnter={() => locked && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`min-h-[42px] w-full px-3 py-2 border rounded-subtle text-sm transition-all flex flex-wrap gap-2 items-center ${
          locked
            ? 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-text cursor-not-allowed'
            : isDisabled
              ? 'bg-gray-50 text-gray-400 border-border-subtle cursor-not-allowed'
              : 'bg-surface border-border-subtle hover:border-brand-primary cursor-pointer'
        }`}
      >
        {selectedIds.length === 0 && <span className="text-text-muted">{loading ? 'Loading...' : placeholder}</span>}
        {selectedIds.map((id: string) => {
          const opt = options.find((o: any) => o.id === id);
          if (!opt) return null;
          return (
            <span key={id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${locked ? 'bg-gray-100 text-field-disabled-text border border-gray-200' : 'bg-blue-50 text-brand-primary border border-blue-200'}`}>
              {opt.name}
              {!locked && (
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleOption(id); }} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
              )}
            </span>
          );
        })}
        <div className="ml-auto flex items-center gap-1">
          {locked && <Lock className="w-3 h-3 text-field-disabled-text" />}
          <ChevronDown className="w-4 h-4 text-text-muted" />
        </div>
      </div>
      {showTooltip && locked && lockMessage && (
        <div className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-text-title text-white text-xs rounded-md shadow-lg max-w-xs text-center">
          {lockMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-text-title rotate-45 -mt-1"></div>
        </div>
      )}
      {isOpen && !isDisabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border-subtle rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? <div className="p-3 text-sm text-text-muted text-center">No options available</div> : null}
          {options.map((opt: any) => (
            <div key={opt.id} onClick={() => toggleOption(opt.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
              <input type="checkbox" checked={selectedIds.includes(opt.id)} readOnly className="w-4 h-4 text-brand-primary rounded cursor-pointer" />
              <span className="text-sm text-text-title font-medium">{opt.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Locked Subject Display ---
const LockedSelect = ({ value, options, lockMessage }: any) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const displayName = options?.find((o: any) => o.id === value)?.name || 'Not selected';

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-full px-4 py-2.5 bg-field-disabled-bg border border-field-disabled-border rounded-subtle text-sm text-field-disabled-text cursor-not-allowed flex items-center justify-between"
      >
        <span>{displayName}</span>
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {showTooltip && lockMessage && (
        <div className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-text-title text-white text-xs rounded-md shadow-lg max-w-xs text-center">
          {lockMessage}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-text-title rotate-45 -mt-1"></div>
        </div>
      )}
    </div>
  );
};

// --- Marking Scheme Stepper with disabled support ---
const MarkingSchemeStepper = ({ field, label, disabled = false }: { field: any; label: string; disabled?: boolean }) => (
  <div className="space-y-2">
    <label className="block text-[13px] font-semibold text-text-title">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={field.state.value}
        onChange={(e) => !disabled && field.handleChange(e.target.value)}
        disabled={disabled}
        className={`w-full pl-4 pr-10 py-2.5 border rounded-subtle text-sm font-medium outline-none transition-all ${
          disabled
            ? 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-text cursor-not-allowed'
            : field.state.meta.errors.length
              ? 'border-red-500 text-text-title bg-surface'
              : 'border-border-subtle focus:border-brand-primary text-text-title bg-surface'
        }`}
      />
      {!disabled && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col text-text-muted">
          <button type="button" onClick={() => field.handleChange(String(Number(field.state.value) + 1))} className="hover:text-brand-primary transition-colors h-3 flex items-end"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => field.handleChange(String(Number(field.state.value) - 1))} className="hover:text-brand-primary transition-colors h-3 flex items-start"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
    {!disabled && field.state.meta.errors.length ? <p className="text-[10px] text-red-500 mt-1">{field.state.meta.errors[0]}</p> : null}
  </div>
);

const reqValidator = ({ value }: { value: any }) => !value || value.length === 0 ? 'Required' : undefined;

const extractErrorMessage = (err: any): string => {
  const res = err?.response?.data;
  if (res?.errors) {
    if (Array.isArray(res.errors)) {
      return res.errors.map((e: any) => e.msg || e.message).filter(Boolean).join('. ') || res.message || 'Validation failed';
    }
    if (typeof res.errors === 'object') {
      return res.errors.message || res.errors.msg || res.message || 'Validation failed';
    }
  }
  return res?.message || err?.message || 'Something went wrong. Please try again.';
};

// --- MAIN COMPONENT ---
export const CreateTestPage: React.FC<{ isModal?: boolean; onClose?: () => void }> = ({ isModal = false, onClose }) => {
  const navigate = useNavigate();
  const { activeTestId, tests, updateTestDetails, setActiveTest } = useTestStore();

  const testDetails = activeTestId ? tests[activeTestId]?.details : {};
  const rawForm = testDetails?.rawForm || {};
  const testRecord = activeTestId ? tests[activeTestId] : null;

  // ✅ Lock states
  const questionsExist = Object.keys(testRecord?.questions || {}).length > 0;
  const isLive = testRecord?.status === 'Live';
  const isScheduled = testRecord?.status === 'Scheduled';

  // Structure lock = subject, topics, subtopics, test type tabs
  const isStructureLocked = questionsExist || isLive || isScheduled;

  // Full lock = everything except name (LIVE only — students actively taking test)
  const isFullyLocked = isLive;

  const lockMessage = isLive
    ? '🔒 This test is live. Only the test name can be changed.'
    : isScheduled
      ? '🔒 This test is scheduled. Subject, topics & sub-topics cannot be changed.'
      : questionsExist
        ? '🔒 Questions have been created. Remove all questions first to change subject, topics or sub-topics.'
        : '';

  const [activeTab, setActiveTab] = useState<'Chapter Wise' | 'PYQ' | 'Mock Test'>(testDetails?.type || 'Chapter Wise');
  const [selectedSubject, setSelectedSubject] = useState(rawForm?.subject || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(rawForm?.topic || []);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; message: string }>({ show: false, title: '', message: '' });

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: taxonomyApi.getSubjects });
  const { data: topics, isFetching: loadingTopics } = useQuery({
    queryKey: ['topics', selectedSubject],
    queryFn: () => taxonomyApi.getTopicsBySubject(selectedSubject),
    enabled: !!selectedSubject,
  });
  const { data: subTopics, isFetching: loadingSubtopics } = useQuery({
    queryKey: ['subtopics', selectedTopics],
    queryFn: () => taxonomyApi.getMultiSubTopics(selectedTopics),
    enabled: selectedTopics.length > 0,
  });

  const createTestMutation = useMutation({ mutationFn: testApi.createTest });
  const updateTestMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/tests/${id}`, payload);
      return res.data;
    },
  });

  const buildPayload = (value: any) => ({
    name: value.name,
    type: activeTab.toLowerCase().replace(' ', ''),
    subject: value.subject,
    topics: value.topic,
    sub_topics: value.subTopic,
    correct_marks: Number(value.correctAnswer),
    wrong_marks: Number(value.wrongAnswer),
    unattempt_marks: Number(value.unattempted),
    difficulty: value.difficulty.toLowerCase(),
    total_time: Number(value.duration),
    total_marks: Number(value.totalMarks),
    total_questions: Number(value.noOfQuestions),
  });

  const isExistingServerTest = !!(activeTestId && testDetails?.name);

  const form = useForm({
    defaultValues: {
      subject: rawForm?.subject || '',
      name: rawForm?.name || '',
      topic: rawForm?.topic || [],
      subTopic: rawForm?.subTopic || [],
      duration: rawForm?.duration || '',
      difficulty: rawForm?.difficulty || 'Easy',
      wrongAnswer: rawForm?.wrongAnswer || '-1',
      unattempted: rawForm?.unattempted || '0',
      correctAnswer: rawForm?.correctAnswer || '4',
      noOfQuestions: rawForm?.noOfQuestions || '',
      totalMarks: rawForm?.totalMarks || '',
    },
    onSubmit: async ({ value }) => {
      const payload = buildPayload(value);

      try {
        if (isExistingServerTest && activeTestId) {
          // ✅ Only send what API #7 allows
          await updateTestMutation.mutateAsync({
            id: activeTestId,
            payload: { name: payload.name, total_questions: payload.total_questions, total_marks: payload.total_marks },
          });
          // ✅ Preserve existing status — don't override live/scheduled with draft
          const existingStatus = testRecord?.status;
          updateTestDetails(activeTestId, { ...payload, status: existingStatus || 'draft', rawForm: value });
          if (isModal && onClose) onClose();
          else navigate('/tests/new/questions');
        } else {
          const responseData = await createTestMutation.mutateAsync({ ...payload, status: 'draft' });
          const newTestId = responseData?.data?.id || responseData?.id;
          if (!newTestId) throw new Error('Server did not return a test ID.');
          if (activeTestId && activeTestId !== newTestId) useTestStore.getState().deleteTest(activeTestId);
          setActiveTest(newTestId);
          updateTestDetails(newTestId, { ...payload, status: 'draft', rawForm: value });
          navigate('/tests/new/questions');
        }
      } catch (err: any) {
        console.error('Submission failed:', err);
        setErrorModal({ show: true, title: 'Failed to Save Test', message: extractErrorMessage(err) });
      }
    },
  });

  // Re-sync form when activeTestId changes
  useEffect(() => {
    const details = activeTestId ? tests[activeTestId]?.details : {};
    const rf = details?.rawForm || {};

    form.reset({
      subject: rf?.subject || '',
      name: rf?.name || '',
      topic: rf?.topic || [],
      subTopic: rf?.subTopic || [],
      duration: rf?.duration || '',
      difficulty: rf?.difficulty || 'Easy',
      wrongAnswer: rf?.wrongAnswer || '-1',
      unattempted: rf?.unattempted || '0',
      correctAnswer: rf?.correctAnswer || '4',
      noOfQuestions: rf?.noOfQuestions || '',
      totalMarks: rf?.totalMarks || '',
    });

    setSelectedSubject(rf?.subject || '');
    setSelectedTopics(rf?.topic || []);
    setActiveTab(details?.type || 'Chapter Wise');
    setErrorModal({ show: false, title: '', message: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTestId]);

  const isSubmitting = createTestMutation.isPending || updateTestMutation.isPending;

  return (
    <div className={`${isModal ? 'w-full space-y-6' : 'max-w-5xl mx-auto space-y-8 bg-surface p-8 rounded-card border border-border-subtle shadow-card mb-8'}`}>

      {/* Error Modal */}
      {errorModal.show && (
        <div className="fixed inset-0 z-[100] flex h-screen items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-card shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-text-title">{errorModal.title}</h3>
                <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{errorModal.message}</p>
              </div>
              <button onClick={() => setErrorModal({ show: false, title: '', message: '' })} className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"><X className="w-4 h-4 text-text-muted" /></button>
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => setErrorModal({ show: false, title: '', message: '' })} className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-subtle transition-colors shadow-sm">Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Notice Banner */}
      {isModal && isStructureLocked && (
        <div className={`flex items-center gap-2 p-3 border rounded-subtle text-xs ${
          isLive ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <Lock className="w-4 h-4 shrink-0" />
          <span className="font-medium">{lockMessage}</span>
        </div>
      )}

      {!isModal && (
        <div className="text-[13px] flex items-center gap-2">
          <span className="text-text-muted">Test Creation / Create Test / </span>
          <span className="text-text-title font-semibold">{activeTab}</span>
        </div>
      )}

      {/* Test Type Tabs — locked when structure locked */}
      <div className="inline-flex p-1 bg-bg-main border border-border-subtle rounded-md">
        {['Chapter Wise', 'PYQ', 'Mock Test'].map((tab) => (
          <button
            key={tab} type="button"
            onClick={(e) => { e.preventDefault(); if (!isStructureLocked) setActiveTab(tab as any); }}
            className={`px-8 py-2 text-sm font-medium rounded transition-all ${
              isStructureLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${activeTab === tab ? 'bg-surface text-brand-primary shadow-sm border border-border-subtle' : 'text-text-muted hover:text-text-title'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

          {/* Subject — structure locked */}
          <form.Field name="subject" validators={{ onChange: reqValidator }}>
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-title flex items-center gap-2">
                  Subject {isStructureLocked && <Lock className="w-3 h-3 text-field-disabled-text" />}
                </label>
                {isStructureLocked ? (
                  <LockedSelect value={field.state.value} options={subjects} lockMessage={lockMessage} />
                ) : (
                  <div className="relative">
                    <select value={field.state.value} onBlur={field.handleBlur} onChange={(e) => { field.handleChange(e.target.value); setSelectedSubject(e.target.value); form.setFieldValue('topic', []); form.setFieldValue('subTopic', []); setSelectedTopics([]); }} className={`w-full appearance-none px-4 py-2.5 bg-surface border rounded-subtle text-sm outline-none transition-all cursor-pointer ${field.state.meta.errors.length ? 'border-red-500' : 'border-border-subtle focus:border-brand-primary'}`}>
                      <option value="" disabled>Choose from Drop-down</option>
                      {subjects?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                )}
                {!isStructureLocked && field.state.meta.errors.length ? <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p> : null}
              </div>
            )}
          </form.Field>

          {/* Name — always editable */}
          <form.Field name="name" validators={{ onChange: reqValidator }}>
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-title">Name of Test</label>
                <input value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} placeholder="Enter name of Test" className={`w-full px-4 py-2.5 bg-surface border rounded-subtle text-sm placeholder:text-gray-400 outline-none transition-all ${field.state.meta.errors.length ? 'border-red-500' : 'border-border-subtle focus:border-brand-primary'}`} />
                {field.state.meta.errors.length ? <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p> : null}
              </div>
            )}
          </form.Field>

          {/* Topics — structure locked */}
          <form.Field name="topic" validators={{ onChange: reqValidator }}>
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-title flex items-center gap-2">
                  Topics
                  {isStructureLocked && <Lock className="w-3 h-3 text-field-disabled-text" />}
                  {loadingTopics && !!selectedSubject && !isStructureLocked && <Loader2 className="w-3 h-3 animate-spin" />}
                </label>
                <MultiSelect options={topics || []} selectedIds={field.state.value} loading={loadingTopics && !!selectedSubject} disabled={!selectedSubject} locked={isStructureLocked} lockMessage={lockMessage} placeholder="Select Topics" onChange={(val: string[]) => { field.handleChange(val); setSelectedTopics(val); form.setFieldValue('subTopic', []); }} />
                {!isStructureLocked && field.state.meta.errors.length ? <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p> : null}
              </div>
            )}
          </form.Field>

          {/* Sub Topics — structure locked */}
          <form.Field name="subTopic" validators={{ onChange: reqValidator }}>
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-title flex items-center gap-2">
                  Sub Topics
                  {isStructureLocked && <Lock className="w-3 h-3 text-field-disabled-text" />}
                  {loadingSubtopics && selectedTopics.length > 0 && !isStructureLocked && <Loader2 className="w-3 h-3 animate-spin" />}
                </label>
                <MultiSelect options={subTopics || []} selectedIds={field.state.value} loading={loadingSubtopics && selectedTopics.length > 0} disabled={selectedTopics.length === 0} locked={isStructureLocked} lockMessage={lockMessage} placeholder="Select Sub Topics" onChange={(val: string[]) => field.handleChange(val)} />
                {!isStructureLocked && field.state.meta.errors.length ? <p className="text-xs text-red-500">{field.state.meta.errors[0]}</p> : null}
              </div>
            )}
          </form.Field>

          {/* Duration — fully locked when LIVE */}
          <form.Field name="duration" validators={{ onChange: reqValidator }}>
            {(field) => (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-text-title flex items-center gap-2">
                  Duration (Minutes) {isFullyLocked && <Lock className="w-3 h-3 text-field-disabled-text" />}
                </label>
                <input
                  type="number" value={field.state.value} onBlur={field.handleBlur}
                  onChange={(e) => !isFullyLocked && field.handleChange(e.target.value)}
                  placeholder="Enter the time" disabled={isFullyLocked}
                  className={`w-full px-4 py-2.5 border rounded-subtle text-sm placeholder:text-gray-400 outline-none transition-all ${
                    isFullyLocked
                      ? 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-text cursor-not-allowed'
                      : field.state.meta.errors.length ? 'border-red-500 bg-surface' : 'border-border-subtle focus:border-brand-primary bg-surface'
                  }`}
                />
              </div>
            )}
          </form.Field>

          {/* Difficulty — fully locked when LIVE */}
          <form.Field name="difficulty">
            {(field) => (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-text-title flex items-center gap-2">
                  Test Difficulty Level {isFullyLocked && <Lock className="w-3 h-3 text-field-disabled-text" />}
                </label>
                <div className="flex items-center gap-8 h-[42px]">
                  {['Easy', 'Medium', 'Hard'].map((level) => (
                    <label key={level} className={`flex items-center gap-2.5 ${isFullyLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio" name="difficulty" value={level}
                        checked={field.state.value === level}
                        onChange={() => !isFullyLocked && field.handleChange(level)}
                        disabled={isFullyLocked}
                        className="w-4 h-4 text-brand-primary border-gray-300 focus:ring-brand-primary accent-brand-primary cursor-pointer"
                      />
                      <span className="text-sm text-text-title">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </form.Field>
        </div>

        {/* Marking Scheme */}
        <div className="space-y-4 pt-2">
          <label className="block text-sm font-semibold text-text-title">Marking Scheme:</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            <form.Field name="wrongAnswer" validators={{ onChange: reqValidator }}>
              {(field) => <MarkingSchemeStepper field={field} label="Wrong Answer" disabled={isFullyLocked} />}
            </form.Field>
            <form.Field name="unattempted" validators={{ onChange: reqValidator }}>
              {(field) => <MarkingSchemeStepper field={field} label="Unattempted" disabled={isFullyLocked} />}
            </form.Field>
            <form.Field name="correctAnswer" validators={{ onChange: reqValidator }}>
              {(field) => <MarkingSchemeStepper field={field} label="Correct Answer" disabled={isFullyLocked} />}
            </form.Field>
            <form.Field name="noOfQuestions" validators={{ onChange: reqValidator }}>
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-text-title">No of Questions</label>
                  <input
                    type="number" value={field.state.value} placeholder="Ex: 50"
                    onChange={(e) => !isFullyLocked && field.handleChange(e.target.value)}
                    disabled={isFullyLocked}
                    className={`w-full px-4 py-2.5 border rounded-subtle text-sm outline-none ${
                      isFullyLocked
                        ? 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-text cursor-not-allowed'
                        : 'bg-surface focus:border-brand-primary'
                    }`}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="totalMarks" validators={{ onChange: reqValidator }}>
              {(field) => (
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-text-title">Total Marks</label>
                  <input
                    type="number" value={field.state.value} placeholder="Ex: 250 Marks"
                    onChange={(e) => !isFullyLocked && field.handleChange(e.target.value)}
                    disabled={isFullyLocked}
                    className={`w-full px-4 py-2.5 border rounded-subtle text-sm outline-none ${
                      isFullyLocked
                        ? 'bg-field-disabled-bg border-field-disabled-border text-field-disabled-text cursor-not-allowed'
                        : 'bg-surface focus:border-brand-primary'
                    }`}
                  />
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* Buttons */}
        <div className={`flex justify-end gap-4 pt-6 ${!isModal ? 'mt-4' : 'border-t border-border-subtle'}`}>
          <button type="button" onClick={() => { if (isModal && onClose) onClose(); else navigate('/dashboard'); }} className="px-10 py-2.5 text-sm font-medium text-brand-primary bg-blue-50/50 hover:bg-blue-50 rounded-subtle transition-colors">Cancel</button>
          <form.Subscribe selector={(state) => [state.canSubmit]}>
            {([canSubmit]) => (
              <button type="submit" disabled={!canSubmit || isSubmitting} className="flex items-center gap-2 px-12 py-2.5 text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover rounded-subtle shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isModal ? 'Save Changes' : 'Next'}
              </button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
};