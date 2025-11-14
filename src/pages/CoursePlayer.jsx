import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  coursesAPI,
  lessonsAPI,
  assignmentSubmissionsAPI,
  quizSubmissionsAPI,
  enrollmentsAPI,
  API_ORIGIN,
} from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";

const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  try {
    if (url.startsWith("/")) {
      return `${API_ORIGIN}${url}`;
    }
    const origin = API_ORIGIN.replace(/\/$/, "");
    return `${origin}/${url}`;
  } catch (error) {
    return url;
  }
};

const buildMediaEmbed = (lesson) => {
  if (lesson.video_url) {
    const sourceUrl = resolveMediaUrl(lesson.video_url);
    if (!sourceUrl) return null;
    const isYouTube = /youtu\.be|youtube\.com/.test(sourceUrl);
    if (isYouTube) {
      let embedUrl = sourceUrl;
      if (sourceUrl.includes("watch?v=")) {
        embedUrl = sourceUrl.replace("watch?v=", "embed/");
      }
      return (
        <iframe
          title={lesson.title}
          src={embedUrl}
          className="w-full aspect-video rounded-lg"
          allowFullScreen
        />
      );
    }
    return (
      <video controls className="w-full rounded-lg">
        <source src={sourceUrl} />
        Your browser does not support the video tag.
      </video>
    );
  }
  return null;
};

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [course, setCourse] = useState(null);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [assignmentForms, setAssignmentForms] = useState({});
  const [submissionState, setSubmissionState] = useState({});
  const [quizResponses, setQuizResponses] = useState({});
  const [quizResults, setQuizResults] = useState({});
  const [enrollment, setEnrollment] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const flattenedLessons = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((module) => module.lessons || []);
  }, [course]);

  const progressPercentage = enrollment?.progress ?? 0;

  const loadQuizResults = async (courseData) => {
    if (!courseData?.modules) {
      setQuizResults({});
      return;
    }
    const quizzes = courseData.modules.flatMap((module) => module.quizzes || []);
    if (!quizzes.length) {
      setQuizResults({});
      return;
    }
    const resultMap = {};
    const prefillResponses = {};
    await Promise.all(
      quizzes.map(async (quiz) => {
        try {
          const response = await quizSubmissionsAPI.list({ quiz: quiz.id });
          const submissions = Array.isArray(response) ? response : response.results || [];
          if (submissions.length > 0) {
            const latest = submissions[0];
            resultMap[quiz.id] = latest;
            if (latest.answers) {
              prefillResponses[quiz.id] = latest.answers.reduce((acc, answer) => {
                const entry = {};
                if (answer.selected_choice) {
                  entry.choice = answer.selected_choice;
                }
                if (answer.text_response) {
                  entry.text = answer.text_response;
                }
                acc[answer.question] = entry;
                return acc;
              }, {});
            }
          }
        } catch (error) {
          console.error("Failed to load quiz submissions", error);
        }
      })
    );
    setQuizResults(resultMap);
    if (Object.keys(prefillResponses).length) {
      setQuizResponses((prev) => ({ ...prefillResponses, ...prev }));
    }
  };

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData);
      if (courseData.modules?.length) {
        const firstModule = courseData.modules[0];
        setActiveModuleId(firstModule.id);
        if (firstModule.lessons?.length) {
          setActiveLesson(firstModule.lessons[0]);
        }
      }

      await loadQuizResults(courseData);

      const enrollments = await enrollmentsAPI.getAll();
      const list = Array.isArray(enrollments) ? enrollments : enrollments.results || [];
      const currentEnrollment = list.find((item) => item.course?.id === courseData.id);
      if (currentEnrollment) {
        setEnrollment(currentEnrollment);
        const lessonIds = new Set(
          (currentEnrollment.lesson_progress || []).map((entry) => entry.lesson.id)
        );
        setCompletedLessons(lessonIds);
      }
    } catch (error) {
      console.error("Failed to load course", error);
      navigate("/my-courses");
    } finally {
      setLoading(false);
    }
  };

  const ensureUser = async () => {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (!stored) {
      try {
        const current = await getCurrentUser();
        setUser(current);
        return current;
      } catch (error) {
        navigate("/login");
        return null;
      }
    }
    setUser(stored);
    return stored;
  };

  useEffect(() => {
    const init = async () => {
      const current = await ensureUser();
      if (!current) return;
      await loadCourse();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      const response = await lessonsAPI.complete(lessonId);
      const { enrollment: enrollmentData } = response;
      const updatedIds = new Set(completedLessons);
      updatedIds.add(lessonId);
      setCompletedLessons(updatedIds);
      setEnrollment(enrollmentData);
      setFeedbackMessage("Lesson marked as complete! Great job.");
      setTimeout(() => setFeedbackMessage(""), 2500);
    } catch (error) {
      console.error("Failed to mark lesson complete", error);
      alert("Could not mark lesson as complete. Please try again.");
    }
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    const formValue = assignmentForms[assignmentId];
    if (!formValue) return;
    try {
      await assignmentSubmissionsAPI.create({
        assignment_id: assignmentId,
        text_response: formValue.text_response || "",
        attachment: formValue.attachment || null,
      });
      setSubmissionState((prev) => ({ ...prev, [assignmentId]: "submitted" }));
      setFeedbackMessage("Assignment submitted successfully!");
      setTimeout(() => setFeedbackMessage(""), 2500);
    } catch (error) {
      console.error("Failed to submit assignment", error);
      alert("Unable to submit assignment. You may have already submitted or an error occurred.");
    }
  };

  const handleQuizSubmit = async (quiz) => {
    const quizId = quiz.id;
    const responsePayload = quizResponses[quizId] || {};
    const unanswered = (quiz.questions || []).filter((question) => {
      const answer = responsePayload[question.id];
      if (!answer) return true;
      if (question.question_type === "short_answer") {
        return !answer.text || !answer.text.trim();
      }
      return !answer.choice;
    });

    if (unanswered.length > 0) {
      if (!window.confirm("Some questions are unanswered. Submit anyway?")) {
        return;
      }
    }

    try {
      const submission = await quizSubmissionsAPI.submit({
        quiz: quizId,
        answers: responsePayload,
      });
      setQuizResults((prev) => ({
        ...prev,
        [quizId]: submission,
      }));
      setQuizResponses((prev) => ({
        ...prev,
        [quizId]: {},
      }));
      setFeedbackMessage("Quiz submitted! Great job.");
      setTimeout(() => setFeedbackMessage(""), 2500);
    } catch (error) {
      console.error("Quiz submission failed", error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Could not submit quiz. Please try again.";
      alert(message);
    }
  };

  const handleQuizAnswerChange = (quizId, question, payload) => {
    setQuizResponses((prev) => {
      const quizResponse = prev[quizId] ? { ...prev[quizId] } : {};
      quizResponse[question.id] = {
        ...(quizResponse[question.id] || {}),
        ...payload,
      };
      return {
        ...prev,
        [quizId]: quizResponse,
      };
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">Course not found.</div>
      </>
    );
  }

  const assignmentsForModule = (moduleId) => {
    return modulesWithAssignments(moduleId, course);
  };

  const modulesWithAssignments = (moduleId, courseData) => {
    const module = courseData.modules.find((item) => item.id === moduleId);
    if (!module) return [];
    return module.assignments || [];
  };

  const quizzesForModule = (moduleId) => {
    const module = course.modules.find((item) => item.id === moduleId);
    return module?.quizzes || [];
  };

  const handleAssignmentFormChange = (assignmentId, field, value) => {
    setAssignmentForms((prev) => ({
      ...prev,
      [assignmentId]: {
        ...(prev[assignmentId] || { text_response: "", attachment: null }),
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Navbar />
      <div className={`min-h-screen p-6 md:p-10 transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          <aside className={`md:col-span-1 rounded-2xl shadow p-4 space-y-4 transition-colors ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
            <h2 className="text-xl font-semibold text-primary">Course Outline</h2>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {course.modules?.map((module) => (
                <div key={module.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setActiveModuleId(module.id)}
                    className={`w-full text-left px-3 py-2 font-semibold ${
                      activeModuleId === module.id ? "bg-primary/10 text-primary" : "bg-gray-50"
                    }`}
                  >
                    {module.title}
                  </button>
                  {activeModuleId === module.id && (
                    <ul className="divide-y">
                      {(module.lessons || []).map((lesson) => (
                        <li key={lesson.id} className="flex items-center justify-between px-3 py-2">
                          <button
                            onClick={() => handleSelectLesson(lesson)}
                            className={`flex-1 text-sm text-left ${
                              activeLesson?.id === lesson.id ? "text-primary font-medium" : "text-gray-700"
                            }`}
                          >
                            {lesson.title}
                          </button>
                          {completedLessons.has(lesson.id) && (
                            <span className="text-green-500 text-xs font-semibold">✓</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </aside>

          <main className="md:col-span-3 space-y-6">
            <div className={`rounded-2xl shadow p-6 space-y-4 transition-colors ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-primary">{course.title}</h1>
                  <p className="text-gray-600">{course.description}</p>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-sm font-medium text-primary">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div
                      className="bg-primary h-3 rounded-full"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {feedbackMessage && (
                <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm font-medium">
                  {feedbackMessage}
                </div>
              )}

              {activeLesson ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-primary">{activeLesson.title}</h2>
                    {activeLesson.overview && <p className="text-gray-600">{activeLesson.overview}</p>}
                  </div>

                  {buildMediaEmbed(activeLesson)}

                  {activeLesson.content && (
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
                  )}

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={() => handleCompleteLesson(activeLesson.id)}
                      disabled={completedLessons.has(activeLesson.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        completedLessons.has(activeLesson.id)
                          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {completedLessons.has(activeLesson.id) ? "Completed" : "Mark as Complete"}
                    </button>
                    {activeLesson.resource_link && (
                      <a
                        href={activeLesson.resource_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
                      >
                        Download Resources
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? "text-gray-300" : "text-gray-500"}`}>Select a lesson to start learning.</div>
              )}
            </div>

            {activeModuleId && (
              <section className={`rounded-2xl shadow p-6 space-y-6 transition-colors ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
                <h2 className="text-xl font-semibold text-primary">Assignments & Quizzes</h2>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-secondary">Assignments</h3>
                  {assignmentsForModule(activeModuleId).length ? (
                    assignmentsForModule(activeModuleId).map((assignment) => {
                      const formValue = assignmentForms[assignment.id] || { text_response: "", attachment: null };
                      const isSubmitted = submissionState[assignment.id] === "submitted";
                      const attachmentUrl = assignment.attachment
                        ? assignment.attachment.startsWith("http")
                          ? assignment.attachment
                          : `${window.location.origin.replace(/:\\d+$/,":8000")}${assignment.attachment}`
                        : null;

                      return (
                        <div key={assignment.id} className={`border rounded-lg p-4 space-y-2 transition-colors ${darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-primary">{assignment.title}</h4>
                              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{assignment.instructions}</p>
                              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Max Points: {assignment.max_points}
                                {assignment.due_date ? ` • Due ${new Date(assignment.due_date).toLocaleString()}` : ""}
                              </p>
                            </div>
                            {attachmentUrl && (
                              <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Download Brief
                              </a>
                            )}
                          </div>

                          {isSubmitted ? (
                            <p className="text-sm text-green-500 font-semibold">Submitted</p>
                          ) : (
                            <form
                              className="space-y-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleAssignmentSubmit(assignment.id);
                              }}
                            >
                              <textarea
                                value={formValue.text_response}
                                onChange={(e) =>
                                  handleAssignmentFormChange(assignment.id, "text_response", e.target.value)
                                }
                                className={`w-full border rounded px-3 py-2 text-sm ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                                placeholder="Write your response or summary here..."
                              />
                              <input
                                type="file"
                                onChange={(e) =>
                                  handleAssignmentFormChange(assignment.id, "attachment", e.target.files?.[0] || null)
                                }
                                className={`w-full border rounded px-3 py-2 text-sm ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark"
                              >
                                Submit Assignment
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No assignments for this module.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-secondary">Quizzes</h3>
                  {quizzesForModule(activeModuleId).length ? (
                    quizzesForModule(activeModuleId).map((quiz) => {
                      const responses = quizResponses[quiz.id] || {};
                      const result = quizResults[quiz.id];
                      const attemptNumber = result?.attempt_number ?? 0;
                      const attemptsRemaining = Math.max(quiz.attempts_allowed - attemptNumber, 0);
                      const reachedLimit = attemptsRemaining <= 0;
                      const answerMap = result?.answers
                        ? result.answers.reduce((acc, answer) => {
                            acc[answer.question] = answer;
                            return acc;
                          }, {})
                        : {};

                      return (
                        <div
                          key={quiz.id}
                          className={`border rounded-lg p-4 space-y-4 transition-colors ${
                            darkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-wrap justify-between items-start gap-3">
                            <div>
                              <h4 className="font-semibold text-primary">{quiz.title}</h4>
                              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                                {quiz.description}
                              </p>
                              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Passing Score: {quiz.passing_score}% • Attempts Allowed: {quiz.attempts_allowed}
                              </p>
                            </div>
                            {result && (
                              <div className="text-right space-y-1">
                                <span
                                  className={`inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded-full ${
                                    result.passed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
                                  }`}
                                >
                                  {result.passed ? "Passed" : "Needs Work"}
                                </span>
                                <p className="text-xs text-gray-500">
                                  Last attempt: {new Date(result.submitted_at).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            {quiz.questions && quiz.questions.length > 0 ? (
                              quiz.questions.map((question) => {
                                const savedAnswer = answerMap[question.id];
                                const currentChoice =
                                  responses[question.id]?.choice ?? savedAnswer?.selected_choice ?? null;
                                const currentText = responses[question.id]?.text ?? savedAnswer?.text_response ?? "";
                                const choices =
                                  question.choices && question.choices.length > 0
                                    ? question.choices
                                    : [
                                        { id: `${question.id}-true`, text: "True", is_correct: true },
                                        { id: `${question.id}-false`, text: "False", is_correct: false },
                                      ];

                                return (
                                  <div
                                    key={question.id}
                                    className={`rounded-lg border p-3 text-sm space-y-3 ${
                                      darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-3">
                                      <p className="font-semibold text-primary">
                                        {question.order}. {question.prompt}
                                      </p>
                                      <span className="text-xs text-gray-500">
                                        {question.question_type.replace("_", " ")} • {question.points} pt
                                        {question.points === 1 ? "" : "s"}
                                      </span>
                                    </div>

                                    {question.question_type === "multiple_choice" && (
                                      <div className="space-y-2">
                                        {choices.map((choice) => (
                                          <label
                                            key={choice.id}
                                            className={`flex items-center gap-2 rounded-md border px-3 py-2 transition ${
                                              currentChoice === choice.id ? "border-primary bg-primary/5" : "border-gray-200"
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name={`quiz-${quiz.id}-question-${question.id}`}
                                              checked={currentChoice === choice.id}
                                              disabled={reachedLimit}
                                              onChange={() =>
                                                !reachedLimit &&
                                                handleQuizAnswerChange(quiz.id, question, { choice: choice.id })
                                              }
                                            />
                                            <span>{choice.text}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}

                                    {question.question_type === "true_false" && (
                                      <div className="space-y-2">
                                        {choices.map((choice, idx) => {
                                          const choiceId =
                                            choice.id ?? `${question.id}-${idx}-${choice.text?.toLowerCase() || "option"}`;
                                          return (
                                            <label
                                              key={choiceId}
                                              className={`flex items-center gap-2 rounded-md border px-3 py-2 transition ${
                                                currentChoice === choiceId ? "border-primary bg-primary/5" : "border-gray-200"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name={`quiz-${quiz.id}-question-${question.id}`}
                                                checked={currentChoice === choiceId}
                                                disabled={reachedLimit}
                                                onChange={() =>
                                                  !reachedLimit &&
                                                  handleQuizAnswerChange(quiz.id, question, { choice: choiceId })
                                                }
                                              />
                                              <span>{choice.text}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {question.question_type === "short_answer" && (
                                      <textarea
                                        value={currentText}
                                        onChange={(e) =>
                                          handleQuizAnswerChange(quiz.id, question, { text: e.target.value })
                                        }
                                        disabled={reachedLimit}
                                        className={`w-full border rounded px-3 py-2 text-sm ${
                                          darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"
                                        } ${reachedLimit ? "opacity-60 cursor-not-allowed" : ""}`}
                                        placeholder="Type your answer here..."
                                        rows={3}
                                      />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Instructor has not added questions yet.
                              </p>
                            )}
                          </div>

                          {result && result.answers && result.answers.length > 0 && (
                            <div
                              className={`rounded-lg border p-3 space-y-3 ${
                                darkMode ? "border-green-700 bg-green-900/20" : "border-green-200 bg-green-50"
                              }`}
                            >
                              <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-semibold text-green-700">
                                <span>Last score: {result.score ?? 0}%</span>
                                <span>
                                  Attempt {result.attempt_number} of {quiz.attempts_allowed}
                                </span>
                                <span>
                                  Points earned:{" "}
                                  {result.answers.reduce((sum, ans) => sum + (ans.points_awarded || 0), 0)}
                                </span>
                              </div>
                              <div className="space-y-2 text-sm">
                                {quiz.questions.map((question) => {
                                  const reviewAnswer = answerMap[question.id];
                                  const selectedChoiceId = reviewAnswer?.selected_choice;
                                  const selectedChoice = (question.choices || []).find(
                                    (choice) => choice.id === selectedChoiceId
                                  );
                                  const correctChoices = (question.choices || []).filter((choice) => choice.is_correct);
                                  return (
                                    <div key={`review-${question.id}`} className="border-t border-green-200 pt-2">
                                      <p className="font-semibold text-primary">
                                        {question.order}. {question.prompt}
                                      </p>
                                      <p
                                        className={`text-sm ${
                                          reviewAnswer?.is_correct ? "text-green-600" : "text-red-500"
                                        }`}
                                      >
                                        Your answer:{" "}
                                        {question.question_type === "short_answer"
                                          ? reviewAnswer?.text_response || "Not answered"
                                          : selectedChoice
                                          ? selectedChoice.text
                                          : "Not answered"}
                                      </p>
                                      {!reviewAnswer?.is_correct && correctChoices.length > 0 && (
                                        <p className="text-xs text-green-600">
                                          Correct answer: {correctChoices.map((choice) => choice.text).join(", ")}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-500">
                                        Points earned: {reviewAnswer?.points_awarded ?? 0} / {question.points}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-gray-500">
                              Attempts remaining: {attemptsRemaining < 0 ? 0 : attemptsRemaining}
                            </p>
                            <button
                              onClick={() => handleQuizSubmit(quiz)}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={reachedLimit}
                            >
                              {reachedLimit ? "No Attempts Remaining" : result ? "Submit Another Attempt" : "Submit Quiz"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No quizzes for this module yet.</p>
                  )}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}