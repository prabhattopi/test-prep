/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Link2, List, ListOrdered,
  Image as ImageIcon, Trash2, Edit3, Type, X, ChevronDown, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useTestStore } from '../../../store/useTestStore';
import { CreateTestPage } from '../../tests/CreateTestPage';
import { taxonomyApi } from '../../../services/api';
import { apiClient } from '../../../config/api';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';

interface QuestionEditorProps {
  questionId: number;
  onPublish: () => void;
  onNextQuestion: () => void;
}

const MultiSelect = ({ options = [], selectedIds = [], onChange, placeholder, disabled, loading }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((item: string) => item !== id));
    else onChange([...selectedIds, id]);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`min-h-[42px] w-full px-3 py-2 bg-surface border rounded-subtle text-sm transition-all flex flex-wrap gap-2 items-center cursor-pointer ${disabled ? 'bg-gray-50 text-gray-400 border-border-subtle cursor-not-allowed' : 'border-border-subtle hover:border-brand-primary'}`}
      >
        {selectedIds.length === 0 && <span className="text-text-muted">{loading ? 'Loading...' : placeholder}</span>}
        {selectedIds.map((id: string) => {
          const opt = options.find((o: any) => o.id === id);
          if (!opt) return null;
          return (
            <span key={id} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-brand-primary border border-blue-200 rounded-full text-xs font-semibold">
              {opt.name}
              <button type="button" onClick={(e) => { e.stopPropagation(); toggleOption(id); }} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          );
        })}
        <div className="ml-auto"><ChevronDown className="w-4 h-4 text-text-muted" /></div>
      </div>
      {isOpen && !disabled && (
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

const TiptapInputModal = ({ isOpen, title, placeholder, onClose, onSubmit }: any) => {
  const [value, setValue] = useState('');
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm rounded-subtle">
      <div className="bg-surface border border-border-subtle shadow-card p-4 rounded-card w-80 animate-in zoom-in-95">
        <h4 className="text-sm font-bold text-text-title mb-3">{title}</h4>
        <input autoFocus type="url" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 bg-bg-main border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary mb-4" />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => { onSubmit(value); setValue(''); }} className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-primary rounded shadow-sm">Insert</button>
        </div>
      </div>
    </div>
  );
};

const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [linkModal, setLinkModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  if (!editor) return null;

  const handleLinkSubmit = (url: string) => { if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); setLinkModal(false); };
  const handleImageSubmit = (url: string) => { if (url) editor.chain().focus().setImage({ src: url }).run(); setImageModal(false); };
  const btnClass = (isActive: boolean) => `p-1.5 rounded transition-colors ${isActive ? 'bg-blue-50 text-brand-primary' : 'hover:bg-gray-100 hover:text-brand-primary text-text-muted'}`;

  return (
    <div className="flex items-center gap-1 border-b border-border-subtle pb-2 mb-3 relative">
      <TiptapInputModal isOpen={linkModal} title="Insert URL Link" placeholder="https://..." onClose={() => setLinkModal(false)} onSubmit={handleLinkSubmit} />
      <TiptapInputModal isOpen={imageModal} title="Insert Image URL" placeholder="https://.../image.png" onClose={() => setImageModal(false)} onSubmit={handleImageSubmit} />
      <button type="button" onClick={() => editor.chain().focus().setParagraph().run()} className={btnClass(editor.isActive('paragraph'))}><Type className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}><Bold className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}><Italic className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))}><UnderlineIcon className="w-4 h-4" /></button>
      <div className="w-px h-4 bg-border-subtle mx-1" />
      <button type="button" onClick={() => setLinkModal(true)} className={btnClass(editor.isActive('link'))}><Link2 className="w-4 h-4" /></button>
      <button type="button" onClick={() => setImageModal(true)} className={btnClass(editor.isActive('image'))}><ImageIcon className="w-4 h-4" /></button>
      <div className="w-px h-4 bg-border-subtle mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}><List className="w-4 h-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}><ListOrdered className="w-4 h-4" /></button>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, isError }: { value: string; onChange: (val: string) => void; isError: boolean }) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline, TiptapImage, TiptapLink.configure({ openOnClick: false })],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'w-full min-h-[120px] outline-none text-sm text-text-title prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-brand-primary [&_a]:underline [&_img]:max-h-64 [&_img]:rounded-md' } },
  });

  useEffect(() => { if (editor && value !== editor.getHTML()) editor.commands.setContent(value); }, [value, editor]);

  return (
    <div className={`bg-surface border rounded-subtle p-4 transition-colors ${isError ? 'border-red-500' : 'border-border-subtle focus-within:border-brand-primary focus-within:shadow-[var(--shadow-input-focus)]'}`}>
      <EditorToolbar editor={editor} />
      <div className="relative">
        {editor?.isEmpty && <span className="absolute top-0 left-0 text-gray-400 pointer-events-none text-sm">Type your question here...</span>}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const getQuestionData = (currentTest: any, questionId: number, testDetails: any, testTopicArray: any[], testSubTopicArray: any[]) => {
  const existingData = currentTest?.questions?.[questionId];
  if (existingData) return existingData;
  return {
    questionText: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correctOption: 'option1',
    solutionText: '',
    mediaUrl: '',
    difficulty: testDetails?.difficulty || testDetails?.rawForm?.difficulty || 'easy',
    topic: Array.isArray(testTopicArray) ? testTopicArray : [testTopicArray],
    subTopic: Array.isArray(testSubTopicArray) ? testSubTopicArray : [testSubTopicArray],
  };
};

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ questionId, onPublish, onNextQuestion }) => {
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { activeTestId, tests, saveQuestion } = useTestStore();
  const currentTest = activeTestId ? tests[activeTestId] : null;
  const testDetails = currentTest?.details;

  const testSubjectId = testDetails?.subject || testDetails?.rawForm?.subject || '';
  const testTopicArray = testDetails?.topics || testDetails?.rawForm?.topic || [];
  const testSubTopicArray = testDetails?.sub_topics || testDetails?.rawForm?.subTopic || [];

  const initialData = getQuestionData(currentTest, questionId, testDetails, testTopicArray, testSubTopicArray);
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialData.topic || []);

  const testTopicKey = JSON.stringify(testTopicArray);
  useEffect(() => {
    setSelectedTopics(Array.isArray(testTopicArray) ? testTopicArray : [testTopicArray]);
  }, [testTopicKey]);

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: taxonomyApi.getSubjects });
  const { data: topics, isFetching: loadingTopics } = useQuery({
    queryKey: ['topics', testSubjectId],
    queryFn: () => taxonomyApi.getTopicsBySubject(testSubjectId),
    enabled: !!testSubjectId,
  });
  const { data: subTopics, isFetching: loadingSubtopics } = useQuery({
    queryKey: ['subtopics', selectedTopics],
    queryFn: async () => { const res = await apiClient.post('/sub-topics/multi-topics', { topicIds: selectedTopics }); return res.data.data || []; },
    enabled: selectedTopics.length > 0,
  });

  const displaySubject = subjects?.find((s: any) => s.id === testSubjectId)?.name || 'Subject';
  const totalQuestionsReq = parseInt(testDetails?.total_questions || testDetails?.rawForm?.noOfQuestions || '0', 10);
  const totalTime = testDetails?.total_time || testDetails?.rawForm?.duration || '0';
  const totalMarks = testDetails?.total_marks || testDetails?.rawForm?.totalMarks || '0';
  const questionsFilled = Object.keys(currentTest?.questions || {}).length;
  const isReadyToPublish = questionsFilled >= totalQuestionsReq;

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value }) => {
      if (activeTestId) { saveQuestion(activeTestId, questionId, value); onNextQuestion(); }
    },
  });

  const syncFormToData = useCallback((data: any) => {
    form.setFieldValue('questionText', data.questionText || '');
    form.setFieldValue('option1', data.option1 || '');
    form.setFieldValue('option2', data.option2 || '');
    form.setFieldValue('option3', data.option3 || '');
    form.setFieldValue('option4', data.option4 || '');
    form.setFieldValue('correctOption', data.correctOption || 'option1');
    form.setFieldValue('solutionText', data.solutionText || '');
    form.setFieldValue('mediaUrl', data.mediaUrl || '');
    form.setFieldValue('difficulty', data.difficulty || 'easy');
    form.setFieldValue('topic', data.topic || []);
    form.setFieldValue('subTopic', data.subTopic || []);
    setSelectedTopics(data.topic || []);
  }, []);

  useEffect(() => {
    const data = getQuestionData(currentTest, questionId, testDetails, testTopicArray, testSubTopicArray);
    syncFormToData(data);
  }, [questionId, activeTestId]);

  return (
    <div className="flex-1 overflow-y-auto relative">
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface rounded-card shadow-2xl relative">
            <div className="sticky top-0 z-10 bg-surface border-b border-border-subtle px-8 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-title">Edit Test creation</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-text-muted hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8"><CreateTestPage isModal={true} onClose={() => setIsEditModalOpen(false)} /></div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="text-[13px] flex items-center gap-2">
            <span className="text-text-muted">Test Creation</span><span className="text-text-muted">/</span>
            <span className="text-text-muted">Create Test</span><span className="text-text-muted">/</span>
            <span className="text-text-title font-semibold capitalize">{testDetails?.type || 'Chapter Wise'}</span>
          </div>
          <button onClick={onPublish} disabled={!isReadyToPublish} className={`px-8 py-2 text-sm font-medium rounded-subtle shadow-sm transition-colors ${isReadyToPublish ? 'bg-brand-primary hover:bg-brand-hover text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {isReadyToPublish ? 'Publish' : `Fill ${totalQuestionsReq - questionsFilled} more Q's`}
          </button>
        </div>

        {/* Test Summary Card */}
        <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-sm relative">
          <button onClick={() => setIsEditModalOpen(true)} className="absolute right-4 top-4 text-brand-primary hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit3 className="w-4 h-4" /></button>
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-primary text-white capitalize">{testDetails?.type || 'Chapter Wise'}</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-text-title tracking-tight">📚 {testDetails?.name || 'Untitled Test'}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700 capitalize">{testDetails?.difficulty || testDetails?.rawForm?.difficulty || 'Easy'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div className="space-y-4">
              <div className="grid grid-cols-[80px_1fr] items-center"><span className="text-text-muted">Subject</span><span className="font-medium text-text-title">: {displaySubject}</span></div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                <span className="text-text-muted">Topic</span>
                <div className="flex flex-wrap gap-2">{testTopicArray?.map((topicId: string) => { const n = topics?.find((t: any) => t.id === topicId)?.name; return n ? <span key={topicId} className="px-2 py-0.5 text-nowrap text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded">{n}</span> : null; })}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                <span className="text-text-muted">Sub Topic</span>
                <div className="flex flex-wrap gap-2">{testSubTopicArray?.map((stId: string) => { const n = subTopics?.find((st: any) => st.id === stId)?.name; return n ? <span key={stId} className="px-2 py-0.5 text-nowrap text-[11px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded">{n}</span> : null; })}</div>
              </div>
            </div>
            <div className="flex flex-col items-end justify-end text-xs text-text-muted font-medium">
              <div className="flex gap-5"><span>⏱ {totalTime} Min</span><span>📋 {totalQuestionsReq} Q's</span><span>🎯 {totalMarks} Marks</span></div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-title">Question {questionId} <span className="text-brand-primary text-[13px] font-medium">/ {totalQuestionsReq}</span></h2>
            <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
              <button type="button" className="hover:text-text-title transition-colors">+ MCQ</button>
              <button type="button" className="hover:text-text-title transition-colors">📥 CSV</button>
            </div>
          </div>

          <button type="button" onClick={() => { const defaults = getQuestionData(null, questionId, testDetails, testTopicArray, testSubTopicArray); syncFormToData(defaults); }} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 uppercase tracking-wider transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete All Edits
          </button>

          {/* Question Text */}
          <form.Field name="questionText" validators={{ onChange: ({ value }) => !value || value === '<p></p>' ? 'Question text is required' : undefined }}>
            {(field) => (<div><RichTextEditor value={field.state.value} onChange={(val) => field.handleChange(val)} isError={field.state.meta.errors.length > 0} /></div>)}
          </form.Field>

          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-text-title mb-3">Type the options below</h3>
            {['option1', 'option2', 'option3', 'option4'].map((optName, index) => (
              <form.Field name={optName as any} key={optName}>
                {(field) => (
                  <div className="flex items-center gap-4">
                    <form.Field name="correctOption">
                      {(radioField) => (<input type="radio" name="correctOption" value={optName} checked={radioField.state.value === optName} onChange={() => radioField.handleChange(optName)} className="w-4 h-4 text-brand-primary border-gray-300 cursor-pointer shrink-0" />)}
                    </form.Field>
                    <div className="flex-1 relative">
                      <input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder={`Type Option ${index + 1} here`} className={`w-full pl-4 pr-10 py-2.5 bg-surface border rounded-subtle text-sm outline-none transition-colors ${field.state.meta.errors.length ? 'border-red-500' : form.state.values.correctOption === optName ? 'border-brand-primary shadow-sm bg-blue-50/10' : 'border-border-subtle focus:border-brand-primary'}`} />
                      <button type="button" onClick={() => field.handleChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </form.Field>
            ))}
          </div>

          {/* Solution */}
          <div className="space-y-3 pt-4">
            <h3 className="text-[13px] font-semibold text-text-title">Add Solution</h3>
            <form.Field name="solutionText">
              {(field) => (<textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Type the solution or explanation here..." className="w-full h-24 p-4 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary transition-colors resize-none placeholder:text-gray-400" />)}
            </form.Field>
          </div>

          {/* ✅ Media URL — standalone input */}
          <div className="space-y-3 pt-4">
            <h3 className="text-[13px] font-semibold text-text-title flex items-center gap-2">
              <Link2 className="w-4 h-4 text-text-muted" /> Media URL <span className="text-text-muted font-normal">(optional)</span>
            </h3>
            <form.Field name="mediaUrl">
              {(field) => (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary transition-colors placeholder:text-gray-400"
                  />
                  {field.state.value && (
                    <div className="relative inline-block">
                      <img src={field.state.value} alt="Media preview" className="max-h-32 rounded-subtle border border-border-subtle" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <button type="button" onClick={() => field.handleChange('')} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Question Settings */}
          <div className="space-y-4 pt-8 mt-8 border-t border-border-subtle">
            <h3 className="text-[15px] font-semibold text-text-title">Question settings</h3>

            <form.Field name="difficulty">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-text-muted">Level of Difficulty</label>
                  <div className="relative">
                    <select value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="w-full appearance-none px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm text-text-title outline-none focus:border-brand-primary cursor-pointer capitalize">
                      <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  </div>
                </div>
              )}
            </form.Field>

            <form.Field name="topic">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-text-muted flex items-center gap-2">Topics {loadingTopics && !!testSubjectId && <Loader2 className="w-3 h-3 animate-spin" />}</label>
                  <MultiSelect options={(topics || []).filter((t: any) => testTopicArray.includes(t.id))} selectedIds={field.state.value} loading={loadingTopics && !!testSubjectId} disabled={!testSubjectId} placeholder="Select Topics" onChange={(val: string[]) => { field.handleChange(val); setSelectedTopics(val); form.setFieldValue('subTopic', []); }} />
                </div>
              )}
            </form.Field>

            <form.Field name="subTopic">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-text-muted flex items-center gap-2">Sub-topics {loadingSubtopics && selectedTopics.length > 0 && <Loader2 className="w-3 h-3 animate-spin" />}</label>
                  <MultiSelect options={(subTopics || []).filter((st: any) => testSubTopicArray.includes(st.id))} selectedIds={field.state.value} loading={loadingSubtopics && selectedTopics.length > 0} disabled={selectedTopics.length === 0} placeholder="Select Sub Topics" onChange={(val: string[]) => field.handleChange(val)} />
                </div>
              )}
            </form.Field>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-border-subtle pb-8">
            <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2.5 text-[13px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-subtle transition-colors">Exit Test Creation</button>
            <form.Subscribe selector={(state) => [state.values]}>
              {([values]) => {
                const isFormValid = Boolean(
                  values.questionText && values.questionText !== '<p></p>' &&
                  values.option1 && values.option2 && values.option3 && values.option4 &&
                  values.topic.length > 0 && values.subTopic.length > 0 && values.difficulty
                );
                return (
                  <button type="submit" disabled={!isFormValid} className="px-10 py-2.5 text-[13px] font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-subtle shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Save & Next Question</button>
                );
              }}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
};