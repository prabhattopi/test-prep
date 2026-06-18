import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Edit3, Loader2, AlertCircle, Link2 } from "lucide-react";
import { useTestStore } from "../../store/useTestStore";
import { questionApi, taxonomyApi } from "../../services/api";
import { apiClient } from "../../config/api";
import { QuestionSidebar } from "../questions/components/QuestionSidebar";

const optionLabels: Record<string, string> = {
  option1: "A",
  option2: "B",
  option3: "C",
  option4: "D",
};

export const PublishConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTestId, tests, finalizePublish } = useTestStore();
  const testRecord = activeTestId ? tests[activeTestId] : null;
  const testDetails = testRecord?.details;

  const [publishType, setPublishType] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [liveUntil, setLiveUntil] = useState("always");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [publishedTestName, setPublishedTestName] = useState("");

  const [questionsAlreadySent, setQuestionsAlreadySent] = useState(
    testRecord?.status === "Live" || testRecord?.status === "Scheduled",
  );

  const testSubjectId =
    testDetails?.subject || testDetails?.rawForm?.subject || "";
  const testTopicArray =
    testDetails?.topics || testDetails?.rawForm?.topic || [];
  const testSubTopicArray =
    testDetails?.sub_topics || testDetails?.rawForm?.subTopic || [];

  const totalQuestions = parseInt(
    testDetails?.total_questions || testDetails?.rawForm?.noOfQuestions || "0",
    10,
  );
  const totalTime =
    testDetails?.total_time || testDetails?.rawForm?.duration || 0;
  const totalMarks =
    testDetails?.total_marks || testDetails?.rawForm?.totalMarks || 0;

  const questions = Array.from({ length: totalQuestions }, (_, i) => ({
    id: i + 1,
    text: `Question ${i + 1}`,
  }));
  const [selectedQuestionId, setSelectedQuestionId] = useState<number>(1);

  // ✅ Get selected question data
  const selectedQuestion = testRecord?.questions?.[selectedQuestionId] || null;

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: taxonomyApi.getSubjects,
  });
  const { data: topics } = useQuery({
    queryKey: ["topics", testSubjectId],
    queryFn: () => taxonomyApi.getTopicsBySubject(testSubjectId),
    enabled: !!testSubjectId,
  });
  const { data: subTopics } = useQuery({
    queryKey: ["subtopics", testTopicArray],
    queryFn: () => taxonomyApi.getMultiSubTopics(testTopicArray),
    enabled: testTopicArray.length > 0,
  });

  const displaySubject =
    subjects?.find((s: any) => s.id === testSubjectId)?.name || "Subject";

  const bulkCreateMutation = useMutation({
    mutationFn: questionApi.bulkCreate,
  });
  const publishTestMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/tests/${id}`, payload);
      return res.data;
    },
  });

  const handleConfirm = async () => {
    if (!activeTestId || !testRecord) return;
    setPublishError(null);
    const finalStatus = publishType === "now" ? "live" : "scheduled";
    const testName = testDetails?.name || "Test";

    try {
      if (!questionsAlreadySent) {
        const questionsPayload = Object.values(testRecord.questions).map(
          (q: any) => {
            const payload: any = {
              type: "mcq",
              question: q.questionText,
              option1: q.option1,
              option2: q.option2,
              option3: q.option3,
              option4: q.option4,
              correct_option: q.correctOption,
              explanation: q.solutionText || "",
              difficulty: q.difficulty?.toLowerCase() || "easy",
              test_id: activeTestId,
              subject: testSubjectId,
            };

            // ✅ Only include media_url if it's a non-empty string
            if (
              q.mediaUrl &&
              typeof q.mediaUrl === "string" &&
              q.mediaUrl.trim()
            ) {
              payload.media_url = q.mediaUrl.trim();
            }

            return payload;
          },
        );

        const bulkResult =
          await bulkCreateMutation.mutateAsync(questionsPayload);
        const createdQuestionIds = (bulkResult?.data || [])
          .map((q: any) => q.id)
          .filter(Boolean);

        if (createdQuestionIds.length > 0) {
          await apiClient.put(`/tests/${activeTestId}`, {
            questions: createdQuestionIds,
            total_questions: createdQuestionIds.length,
          });
        }
        setQuestionsAlreadySent(true);
      }

      const publishPayload: any = { status: finalStatus };
      if (publishType === "schedule") {
        publishPayload.start_date = scheduleDate;
        publishPayload.start_time = scheduleTime;
      }
      if (liveUntil !== "always") publishPayload.live_until = liveUntil;
      if (liveUntil === "custom") {
        publishPayload.end_date = customEndDate;
        publishPayload.end_time = customEndTime;
      }

      await publishTestMutation.mutateAsync({
        id: activeTestId,
        payload: publishPayload,
      });

      setPublishedTestName(testName);
      setSuccessMessage(
        finalStatus === "live"
          ? "Your test is now live and available to students!"
          : "Your test has been scheduled successfully!",
      );
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ["tests"] });

      setTimeout(() => {
        finalizePublish(
          activeTestId,
          { publishType, scheduleDate, scheduleTime, liveUntil },
          finalStatus === "live" ? "Live" : "Scheduled",
        );
      }, 500);

      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error: any) {
      console.error("Publish error:", error);
      const res = error?.response?.data;
      let errMsg = "An error occurred while publishing.";
      if (res?.errors) {
        if (Array.isArray(res.errors))
          errMsg =
            res.errors
              .map((e: any) => e.msg || e.message)
              .filter(Boolean)
              .join(". ") ||
            res.message ||
            errMsg;
        else if (typeof res.errors === "object")
          errMsg =
            res.errors.message || res.errors.msg || res.message || errMsg;
      } else if (res?.message) errMsg = res.message;
      else if (error?.message) errMsg = error.message;
      setPublishError(errMsg);
    }
  };

  const questionsFilled = Object.keys(testRecord?.questions || {}).length;

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-surface rounded-card shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-text-title mb-2">
            {publishType === "now" ? "Test Published!" : "Test Scheduled!"} 🎉
          </h2>
          <p className="text-sm text-text-muted mb-2">{successMessage}</p>
          <p className="text-[13px] text-text-muted font-medium mb-6">
            "{publishedTestName}" — {questionsFilled || "all"} questions
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Redirecting to dashboard...</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-5 px-8 py-2 text-sm font-medium text-brand-primary hover:bg-blue-50 rounded-subtle transition-colors"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  if (publishError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-surface rounded-card shadow-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-text-title">
                Publish Failed
              </h3>
              <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                {publishError}
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <button
              onClick={() => setPublishError(null)}
              className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-subtle transition-colors shadow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testRecord) {
    return (
      <div className="p-8 text-center text-text-muted">
        No active test found. Return to dashboard.
      </div>
    );
  }

  const isPublishing =
    bulkCreateMutation.isPending || publishTestMutation.isPending;

  return (
    <div className="flex h-[calc(100vh-80px)] -m-8 bg-surface border-t border-border-subtle">
      <QuestionSidebar
        questions={questions}
        activeId={selectedQuestionId}
        onSelect={(id) => setSelectedQuestionId(id)}
        totalCount={totalQuestions}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb + Publish button */}
          <div className="flex items-center justify-between">
            <div className="text-[13px] flex items-center gap-2">
              <span className="text-text-muted">Test Creation</span>
              <span className="text-text-muted">/</span>
              <span className="text-text-muted">Preview & Publish</span>
              <span className="text-text-muted">/</span>
              <span className="text-text-title font-semibold capitalize">
                {testDetails?.type || "Chapter Wise"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All {questionsFilled} Questions done</span>
            </div>
          </div>

          {/* Test Summary Card — same design as QuestionEditor */}
          <div className="bg-surface border border-border-subtle rounded-card p-5 shadow-sm relative">
            <button
              onClick={() => navigate("/tests/new/questions")}
              className="absolute right-4 top-4 text-brand-primary hover:bg-blue-50 p-1.5 rounded transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-primary text-white capitalize">
                {testDetails?.type || "Chapter Wise"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-text-title tracking-tight">
                  📚 {testDetails?.name || "Untitled Test"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700 capitalize">
                  {testDetails?.difficulty ||
                    testDetails?.rawForm?.difficulty ||
                    "Easy"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="space-y-4">
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <span className="text-text-muted">Subject</span>
                  <span className="font-medium text-text-title">
                    : {displaySubject}
                  </span>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                  <span className="text-text-muted">Topic</span>
                  <div className="flex flex-wrap gap-2">
                    {testTopicArray?.map((topicId: string) => {
                      const topicName = topics?.find(
                        (t: any) => t.id === topicId,
                      )?.name;
                      if (!topicName) return null;
                      return (
                        <span
                          key={topicId}
                          className="px-2 py-0.5 text-nowrap text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded"
                        >
                          {topicName}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                  <span className="text-text-muted">Sub Topic</span>
                  <div className="flex flex-wrap gap-2">
                    {testSubTopicArray?.map((stId: string) => {
                      const stName = subTopics?.find(
                        (st: any) => st.id === stId,
                      )?.name;
                      if (!stName) return null;
                      return (
                        <span
                          key={stId}
                          className="px-2 py-0.5 text-nowrap text-[11px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded"
                        >
                          {stName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-end text-xs text-text-muted font-medium">
                <div className="flex gap-5">
                  <span>⏱ {totalTime} Min</span>
                  <span>📋 {totalQuestions} Q's</span>
                  <span>🎯 {totalMarks} Marks</span>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Selected Question Preview — only shows the one clicked in sidebar */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-text-title">
              Question {selectedQuestionId}{" "}
              <span className="text-brand-primary text-[13px] font-medium">
                / {totalQuestions}
              </span>
            </h2>

            {selectedQuestion ? (
              <div className="bg-surface border border-border-subtle rounded-card p-6 shadow-sm space-y-5">
                {/* Question text */}
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-brand-primary text-white text-sm font-bold flex items-center justify-center">
                    {selectedQuestionId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium text-text-title leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          selectedQuestion.questionText || "No question text",
                      }}
                    />
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-[11px] font-bold rounded capitalize bg-gray-100 text-gray-600 border border-gray-200">
                    {selectedQuestion.difficulty || "easy"}
                  </span>
                </div>

                {/* Media URL preview */}
                {selectedQuestion.mediaUrl && (
                  <div className="pl-11">
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      <Link2 className="w-3 h-3" />
                      <a
                        href={selectedQuestion.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:underline truncate max-w-md"
                      >
                        {selectedQuestion.mediaUrl}
                      </a>
                    </div>
                    <img
                      src={selectedQuestion.mediaUrl}
                      alt="Question media"
                      className="max-h-40 rounded-subtle border border-border-subtle"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                  {["option1", "option2", "option3", "option4"].map(
                    (optKey) => {
                      const isCorrect =
                        selectedQuestion.correctOption === optKey;
                      return (
                        <div
                          key={optKey}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-subtle text-sm border transition-all ${
                            isCorrect
                              ? "bg-green-50 border-green-200 text-green-700 font-semibold"
                              : "bg-bg-main border-border-subtle text-text-body"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {optionLabels[optKey]}
                          </span>
                          <span className="flex-1">
                            {selectedQuestion[optKey] || "-"}
                          </span>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 ml-auto shrink-0 text-green-500" />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* Solution */}
                {selectedQuestion.solutionText && (
                  <div className="pl-11 pt-2 border-t border-border-subtle">
                    <p className="text-[13px] text-text-body">
                      <span className="font-semibold text-text-title">
                        💡 Explanation:
                      </span>{" "}
                      {selectedQuestion.solutionText}
                    </p>
                  </div>
                )}

                {/* Question-level topic/subtopic if different from test level */}
                {(selectedQuestion.topic?.length > 0 ||
                  selectedQuestion.subTopic?.length > 0) && (
                  <div className="pl-11 pt-2 border-t border-border-subtle flex flex-wrap gap-2">
                    {selectedQuestion.topic?.map((tId: string) => {
                      const tName = topics?.find(
                        (t: any) => t.id === tId,
                      )?.name;
                      return tName ? (
                        <span
                          key={tId}
                          className="px-2 py-0.5 text-[10px] font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded"
                        >
                          {tName}
                        </span>
                      ) : null;
                    })}
                    {selectedQuestion.subTopic?.map((stId: string) => {
                      const stName = subTopics?.find(
                        (st: any) => st.id === stId,
                      )?.name;
                      return stName ? (
                        <span
                          key={stId}
                          className="px-2 py-0.5 text-[10px] font-medium text-yellow-600 bg-yellow-50 border border-yellow-200 rounded"
                        >
                          {stName}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-bg-main border border-border-subtle rounded-card p-8 text-center">
                <p className="text-sm text-text-muted">
                  This question hasn't been filled yet.
                </p>
              </div>
            )}
          </div>

          {/* Publish / Schedule Section */}
          <div className="pt-6 border-t border-border-subtle space-y-6">
            <div className="inline-flex p-1 bg-gray-50 border border-border-subtle rounded-md">
              <button
                onClick={() => setPublishType("now")}
                className={`px-6 py-2.5 text-sm font-semibold rounded transition-all ${publishType === "now" ? "bg-white text-text-title shadow-sm border border-gray-200" : "text-text-muted hover:text-text-title border border-transparent bg-transparent"}`}
              >
                Publish Now
              </button>
              <button
                onClick={() => setPublishType("schedule")}
                className={`px-6 py-2.5 text-sm font-semibold rounded transition-all ${publishType === "schedule" ? "bg-white text-text-title shadow-sm border border-gray-200" : "text-text-muted hover:text-text-title border border-transparent bg-transparent"}`}
              >
                Schedule Publish
              </button>
            </div>

            {publishType === "schedule" && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-text-title">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[13px] font-semibold text-text-title">
                    Select Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 pt-6 border-t border-border-subtle">
              <h3 className="text-sm font-semibold text-text-title">
                Live Until
              </h3>
              <p className="text-[13px] text-text-muted">
                Choose how long this test should remain available.
              </p>
              <div className="grid grid-cols-2 gap-y-5 max-w-2xl pt-2">
                {[
                  { id: "always", label: "Always Available" },
                  { id: "3w", label: "3 Weeks" },
                  { id: "1w", label: "1 Week" },
                  { id: "1m", label: "1 Month" },
                  { id: "2w", label: "2 Weeks" },
                  { id: "custom", label: "Custom Duration" },
                ].map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="liveUntil"
                      value={option.id}
                      checked={liveUntil === option.id}
                      onChange={() => setLiveUntil(option.id)}
                      className="w-4 h-4 text-brand-primary border-gray-300 cursor-pointer"
                    />
                    <span className="text-[13px] text-text-title">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {liveUntil === "custom" && (
                <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-border-subtle">
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary"
                  />
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border-subtle rounded-subtle text-sm outline-none focus:border-brand-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-8 border-t border-border-subtle">
            <button
              disabled={isPublishing}
              onClick={() => navigate("/tests/new/questions")}
              className="px-10 py-2.5 text-sm font-semibold text-brand-primary bg-blue-50/50 hover:bg-blue-50 rounded-subtle transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={
                (publishType === "schedule" &&
                  (!scheduleDate || !scheduleTime)) ||
                (liveUntil === "custom" &&
                  (!customEndDate || !customEndTime)) ||
                isPublishing
              }
              className="flex items-center gap-2 px-12 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-hover rounded-subtle shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
