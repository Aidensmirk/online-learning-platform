import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  coursesAPI,
  modulesAPI,
  lessonsAPI,
  assignmentsAPI,
  quizzesAPI,
  questionBankAPI,
} from "../Services/api";
import { getCurrentUser } from "../Services/authService";
import { useTheme } from "../context/ThemeContext";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const baseButtonClasses = "inline-flex items-center justify-center font-medium transition-colors duration-200";
const primaryButton = `${baseButtonClasses} bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed`;
const secondaryButton = `${baseButtonClasses} border border-primary text-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/20`;
const subtleButton = `${baseButtonClasses} bg-primary/10 text-primary hover:bg-primary/20`;

const DEFAULT_QUIZ_FORM = {
  title: "",
  description: "",
  time_limit_minutes: "",
  attempts_allowed: 1,
  passing_score: 70,
  questions: [],
};

const buildLessonMedia = (lesson) => {
  if (!lesson?.video_url) return null;
  const url = lesson.video_url;
  if (/youtu\.be|youtube\.com/.test(url)) {
    let embedUrl = url;
    if (url.includes("watch?v=")) {
      embedUrl = url.replace("watch?v=", "embed/");
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
      <source src={url} />
      Your browser does not support the video tag.
    </video>
  );
};

export default function ManageCourses() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order: 1, release_date: "" });
  const [lessonForms, setLessonForms] = useState({});
  const [assignmentForms, setAssignmentForms] = useState({});
  const [quizForms, setQuizForms] = useState({});
  const [previewLesson, setPreviewLesson] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [user, setUser] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [questionBank, setQuestionBank] = useState([]);
  const [loadingQuestionBank, setLoadingQuestionBank] = useState(false);

  const sortedCourses = useMemo(() => {
    const clone = [...courses];
    if (sortOption === "newest") {
      clone.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortOption === "oldest") {
      clone.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortOption === "title") {
      clone.sort((a, b) => a.title.localeCompare(b.title));
    }
    return clone.filter(
      (course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, sortOption, searchQuery]);

  const loadQuestionBank = async (courseId) => {
    try {
      setLoadingQuestionBank(true);
      const response = await questionBankAPI.list({ course: courseId });
      const entries = Array.isArray(response) ? response : response.results || [];
      setQuestionBank(entries);
    } catch (error) {
      console.error("Failed to load question bank", error);
      setQuestionBank([]);
    } finally {
      setLoadingQuestionBank(false);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesAPI.getAll();
      const list = Array.isArray(data) ? data : data.results || [];
      const instructorCourses = list.filter(
        (course) => course.instructor?.id === user?.id || user?.role === "admin"
      );
      setCourses(instructorCourses);
      if (instructorCourses.length > 0) {
        await selectCourse(instructorCourses[0]);
      } else {
        setSelectedCourse(null);
        setModules([]);
        setQuestionBank([]);
      }
    } catch (error) {
      console.error("Error loading courses", error);
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (course) => {
    setSelectedCourse(course);
    try {
      const data = await modulesAPI.list({ course: course.id });
      const moduleList = Array.isArray(data) ? data : data.results || [];
      setModules(moduleList);
      setModuleForm({ title: "", description: "", order: moduleList.length + 1, release_date: "" });
      setLessonForms({});
      setAssignmentForms({});
      setQuizForms({});
      await loadQuestionBank(course.id);
    } catch (error) {
      console.error("Failed to load modules", error);
      setQuestionBank([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (!storedUser) {
        try {
          const current = await getCurrentUser();
          setUser(current);
        } catch (error) {
          navigate("/login");
          return;
        }
      } else {
        setUser(storedUser);
      }
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      if (user.role !== "instructor" && user.role !== "admin") {
        navigate("/");
        return;
      }
      loadCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await modulesAPI.create({
        course: selectedCourse.id,
        title: moduleForm.title,
        description: moduleForm.description,
        order: moduleForm.order,
        release_date: moduleForm.release_date || null,
      });
      await selectCourse(selectedCourse);
    } catch (error) {
      console.error("Failed to create module", error);
      alert("Failed to create module. Please try again.");
    }
  };

  const handleCreateLesson = async (moduleId) => {
    const form = lessonForms[moduleId];
    if (!form?.title) return;
    try {
      await lessonsAPI.create({
        module: moduleId,
        title: form.title,
        overview: form.overview || "",
        content: form.content || "",
        video_url: form.video_url || "",
        resource_link: form.resource_link || "",
        order: form.order || 1,
        duration_minutes: form.duration_minutes || 0,
        is_published: form.is_published ?? true,
      });
      await selectCourse(selectedCourse);
    } catch (error) {
      console.error("Failed to create lesson", error);
      alert("Failed to create lesson.");
    }
  };

  const handleCreateAssignment = async (moduleId) => {
    const form = assignmentForms[moduleId];
    if (!form?.title) return;
    try {
      await assignmentsAPI.create({
        module: moduleId,
        title: form.title,
        instructions: form.instructions || "",
        attachment: form.attachment || null,
        due_date: form.due_date || "",
        max_points: form.max_points || 100,
        allow_resubmission: form.allow_resubmission ?? false,
      });
      await selectCourse(selectedCourse);
    } catch (error) {
      console.error("Failed to create assignment", error);
      alert("Failed to create assignment.");
    }
  };

  const handleCreateQuiz = async (moduleId) => {
    const form = quizForms[moduleId];
    if (!form?.title) return;
    try {
      const questionsWithOrder = (form.questions || []).map((question, index) => ({
        ...question,
        order: index + 1,
      }));
      await quizzesAPI.create({
        module: moduleId,
        title: form.title,
        description: form.description || "",
        time_limit_minutes: form.time_limit_minutes || null,
        attempts_allowed: form.attempts_allowed || 1,
        passing_score: form.passing_score || 70,
        questions: questionsWithOrder,
      });
      await selectCourse(selectedCourse);
    } catch (error) {
      console.error("Failed to create quiz", error);
      alert("Failed to create quiz.");
    }
  };

  const handleMoveQuizQuestion = (moduleId, index, direction) => {
    setQuizForms((prev) => {
      const current = prev[moduleId];
      const form = { ...DEFAULT_QUIZ_FORM, ...current };
      const questions = [...(form.questions || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= questions.length) {
        return prev;
      }
      const [item] = questions.splice(index, 1);
      questions.splice(nextIndex, 0, item);
      const reordered = questions.map((question, idx) => ({ ...question, order: idx + 1 }));
      return {
        ...prev,
        [moduleId]: {
          ...form,
          questions: reordered,
        },
      };
    });
  };

  const handleRemoveQuizQuestion = (moduleId, index) => {
    setQuizForms((prev) => {
      const current = prev[moduleId];
      const form = { ...DEFAULT_QUIZ_FORM, ...current };
      const questions = [...(form.questions || [])];
      questions.splice(index, 1);
      const reordered = questions.map((question, idx) => ({ ...question, order: idx + 1 }));
      return {
        ...prev,
        [moduleId]: {
          ...form,
          questions: reordered,
        },
      };
    });
  };

  const handleDuplicateQuizQuestion = (moduleId, index) => {
    setQuizForms((prev) => {
      const current = prev[moduleId];
      const form = { ...DEFAULT_QUIZ_FORM, ...current };
      const questions = [...(form.questions || [])];
      const target = questions[index];
      if (!target) return prev;
      const clone = JSON.parse(JSON.stringify(target));
      questions.splice(index + 1, 0, clone);
      const reordered = questions.map((question, idx) => ({ ...question, order: idx + 1 }));
      return {
        ...prev,
        [moduleId]: {
          ...form,
          questions: reordered,
        },
      };
    });
  };

  const handleSaveQuestionToBank = async (moduleId, index) => {
    if (!selectedCourse) return;
    const form = quizForms[moduleId];
    const question = form?.questions?.[index];
    if (!question) return;
    try {
      await questionBankAPI.create({
        course: selectedCourse.id,
        title: question.prompt.slice(0, 120),
        prompt: question.prompt,
        question_type: question.question_type,
        points: question.points || 1,
        choices: question.question_type === "short_answer" ? [] : question.choices || [],
      });
      await loadQuestionBank(selectedCourse.id);
    } catch (error) {
      console.error("Failed to save question to bank", error);
      alert("Could not save question to library. Please try again.");
    }
  };

  const handleInsertQuestionFromBank = (moduleId, entry) => {
    setQuizForms((prev) => {
      const current = prev[moduleId];
      const form = { ...DEFAULT_QUIZ_FORM, ...current };
      const questions = [...(form.questions || [])];
      const clonedChoices = Array.isArray(entry.choices)
        ? entry.choices.map((choice) => ({ ...choice }))
        : [];
      questions.push({
        prompt: entry.prompt,
        question_type: entry.question_type,
        points: entry.points || 1,
        choices: entry.question_type === "short_answer" ? [] : clonedChoices,
        order: questions.length + 1,
      });
      return {
        ...prev,
        [moduleId]: {
          ...form,
          questions,
        },
      };
    });
  };

  const handleDeleteBankEntry = async (entryId) => {
    if (!selectedCourse) return;
    try {
      await questionBankAPI.delete(entryId);
      await loadQuestionBank(selectedCourse.id);
    } catch (error) {
      console.error("Failed to delete question bank entry", error);
      alert("Could not delete question from library. Please try again.");
    }
  };

  const handleStatusChange = async (courseId, nextStatus) => {
    setStatusUpdatingId(courseId);
    try {
      await coursesAPI.patch(courseId, { status: nextStatus });
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                status: nextStatus,
              }
            : course
        )
      );
      setSelectedCourse((prev) =>
        prev && prev.id === courseId
          ? {
              ...prev,
              status: nextStatus,
            }
          : prev
      );
    } catch (error) {
      console.error("Failed to update course status", error);
      alert("Could not update course status. Please try again.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const renderModules = () => {
    if (!selectedCourse) {
      return <p className="text-center text-gray-600">Select a course to manage its content.</p>;
    }

    if (!modules.length) {
      return (
        <div className="text-center text-gray-500 py-10">
          <p>No modules yet. Use the form above to create one.</p>
        </div>
      );
    }

    return modules.map((module) => (
      <div key={module.id} className="border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-primary">
              Module {module.order}: {module.title}
            </h3>
            <p className="text-gray-600">{module.description || "No description provided."}</p>
            {module.release_date && (
              <p className="text-sm text-gray-500 mt-1">Release Date: {module.release_date}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Lessons</h4>
            {module.lessons?.length ? (
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="bg-gray-50 rounded p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-primary">{lesson.title}</p>
                        <p className="text-xs text-gray-500">
                          Order {lesson.order} • {lesson.duration_minutes} min
                        </p>
                        {lesson.overview && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{lesson.overview}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setPreviewLesson(lesson)}
                        className="px-3 py-1 rounded bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                      >
                        Preview
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No lessons yet.</p>
            )}
            <LessonForm
              moduleId={module.id}
              value={lessonForms[module.id]}
              onChange={setLessonForms}
              onSubmit={handleCreateLesson}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Assignments</h4>
            {module.assignments?.length ? (
              <ul className="space-y-2">
                {module.assignments.map((assignment) => (
                  <li key={assignment.id} className={`bg-gray-50 rounded p-3 ${darkMode ? "bg-gray-900 border border-gray-700" : "border border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-primary">{assignment.title}</p>
                        <p className={`text-xs mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Max Points: {assignment.max_points}
                          {assignment.due_date ? ` • Due ${new Date(assignment.due_date).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <Link
                        to={`/assignments/${assignment.id}/review`}
                        className="px-3 py-1 rounded bg-primary text-white text-xs font-medium hover:bg-primary-dark"
                      >
                        Review Submissions
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No assignments yet.</p>
            )}
            <AssignmentForm
              moduleId={module.id}
              value={assignmentForms[module.id]}
              onChange={setAssignmentForms}
              onSubmit={handleCreateAssignment}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Quizzes</h4>
            {module.quizzes?.length ? (
              <ul className="space-y-2">
                {module.quizzes.map((quiz) => (
                  <li key={quiz.id} className="bg-gray-50 rounded p-3">
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-xs text-gray-500">
                      Passing Score: {quiz.passing_score}% • Attempts: {quiz.attempts_allowed}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No quizzes yet.</p>
            )}
            <QuizForm
              moduleId={module.id}
              value={quizForms[module.id]}
              onChange={setQuizForms}
              onSubmit={handleCreateQuiz}
              questionBank={questionBank}
              loadingBank={loadingQuestionBank}
              onInsertFromBank={handleInsertQuestionFromBank}
              onSaveToBank={handleSaveQuestionToBank}
              onRemoveQuestion={handleRemoveQuizQuestion}
              onDuplicateQuestion={handleDuplicateQuizQuestion}
              onMoveQuestion={handleMoveQuizQuestion}
              onDeleteBankEntry={handleDeleteBankEntry}
            />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      <Navbar />
      <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} p-8`}>
        <div className={`max-w-7xl mx-auto space-y-8 transition-colors ${darkMode ? "bg-gray-800" : "bg-white"} shadow-xl rounded-2xl p-6 md:p-8`}>
          <div className="bg-white shadow rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">Instructor Course Manager</h1>
              <p className={`${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                Organize modules, lessons, assignments, and quizzes for your courses.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/create-course"
                className={`${primaryButton} px-4 py-2 rounded-lg`}
              >
                + Create New Course
              </Link>
              <button
                onClick={() => navigate("/instructor-dashboard")}
                className={`${secondaryButton} px-4 py-2 rounded-lg`}
              >
                ← Dashboard
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <div className={`bg-white shadow rounded-2xl p-6 space-y-4 transition-colors ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-primary">Your Courses</h2>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute left-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                  </span>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-gray-500">Loading courses…</div>
                ) : sortedCourses.length === 0 ? (
                  <div className={`py-10 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    No courses yet. Create your first course to get started.
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                    {sortedCourses.map((course) => (
                      <li
                        key={course.id}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          selectedCourse?.id === course.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-gray-200 hover:border-primary hover:bg-primary/5"
                        }`}
                        onClick={() => selectCourse(course)}
                      >
                        <p className="font-semibold">{course.title}</p>
                        <p className="text-xs text-gray-500">
                          {course.modules?.length || 0} modules • Status: {course.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedCourse && (
                <div className={`bg-white shadow rounded-2xl p-6 space-y-4 transition-colors ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
                  <h2 className="text-xl font-semibold text-primary">Add Module</h2>
                  <form className="space-y-3" onSubmit={handleAddModule}>
                    <input
                      type="text"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900"}`}
                      placeholder="Module title"
                      required
                    />
                    <textarea
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm((prev) => ({ ...prev, description: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "border-gray-300 bg-white"}`}
                      placeholder="Module description"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        min={1}
                        value={moduleForm.order}
                        onChange={(e) => setModuleForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
                        className={`border rounded-lg px-3 py-2 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "border-gray-300 bg-white"}`}
                        placeholder="Order"
                      />
                      <input
                        type="date"
                        value={moduleForm.release_date}
                        onChange={(e) => setModuleForm((prev) => ({ ...prev, release_date: e.target.value }))}
                        className={`border rounded-lg px-3 py-2 ${darkMode ? "bg-gray-800 text-white border-gray-600" : "border-gray-300 bg-white"}`}
                      />
                    </div>
                    <button
                      type="submit"
                      className={`${primaryButton} w-full rounded-lg py-2`}
                    >
                      Add Module
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-6">
              {selectedCourse ? (
                <Fragment>
                  <div className={`bg-white shadow rounded-2xl p-6 transition-colors ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                    <h2 className="text-2xl font-semibold text-primary mb-3">{selectedCourse.title}</h2>
                    <p className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selectedCourse.description}</p>
                    <div className={`flex flex-wrap gap-4 text-sm mt-4 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                      <span>Category: {selectedCourse.category || "N/A"}</span>
                      <span>Estimated Hours: {selectedCourse.estimated_hours}</span>
                      <span>Price: ${selectedCourse.price}</span>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">Course Status</p>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {selectedCourse.status === "published"
                            ? "Visible to students"
                            : selectedCourse.status === "draft"
                              ? "Draft courses are hidden from students until published."
                              : "Archived courses are hidden from students."}
                        </p>
                      </div>
                      <select
                        value={selectedCourse.status}
                        onChange={(e) => handleStatusChange(selectedCourse.id, e.target.value)}
                        className={`px-3 py-2 rounded-lg border text-sm ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                        disabled={statusUpdatingId === selectedCourse.id}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">{renderModules()}</div>
                </Fragment>
              ) : (
                <div className="bg-white shadow rounded-2xl p-10 text-center text-gray-500">
                  Select a course from the left to start managing its content.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <LessonPreviewModal lesson={previewLesson} onClose={() => setPreviewLesson(null)} darkMode={darkMode} />
    </>
  );
}

const LessonForm = ({ moduleId, value, onChange, onSubmit }) => {
  const formValue = value || {
    title: "",
    overview: "",
    content: "",
    video_url: "",
    resource_link: "",
    order: 1,
    duration_minutes: 0,
    is_published: true,
  };

  const updateForm = (field, fieldValue) => {
    onChange((prev) => ({
      ...prev,
      [moduleId]: {
        ...formValue,
        [field]: fieldValue,
      },
    }));
  };

  return (
    <form
      className="mt-3 space-y-2 bg-white border border-gray-200 rounded-lg p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(moduleId);
      }}
    >
      <input
        type="text"
        value={formValue.title}
        onChange={(e) => updateForm("title", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Lesson title"
        required
      />
      <textarea
        value={formValue.overview}
        onChange={(e) => updateForm("overview", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Overview"
      />
      <textarea
        value={formValue.content}
        onChange={(e) => updateForm("content", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Lesson content (HTML/Markdown)"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="url"
          value={formValue.video_url}
          onChange={(e) => updateForm("video_url", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Video URL"
        />
        <input
          type="url"
          value={formValue.resource_link}
          onChange={(e) => updateForm("resource_link", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Resource link"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <input
          type="number"
          min={1}
          value={formValue.order}
          onChange={(e) => updateForm("order", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Order"
        />
        <input
          type="number"
          min={0}
          value={formValue.duration_minutes}
          onChange={(e) => updateForm("duration_minutes", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Duration (min)"
        />
      </div>
      <button
        type="submit"
        className={`${primaryButton} w-full rounded-lg py-2`}
      >
        Add Lesson
      </button>
    </form>
  );
};

const AssignmentForm = ({ moduleId, value, onChange, onSubmit }) => {
  const formValue = value || {
    title: "",
    instructions: "",
    attachment: null,
    due_date: "",
    max_points: 100,
    allow_resubmission: false,
  };

  const updateForm = (field, fieldValue) => {
    onChange((prev) => ({
      ...prev,
      [moduleId]: {
        ...formValue,
        [field]: fieldValue,
      },
    }));
  };

  return (
    <form
      className="mt-3 space-y-2 bg-white border border-gray-200 rounded-lg p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(moduleId);
      }}
    >
      <input
        type="text"
        value={formValue.title}
        onChange={(e) => updateForm("title", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Assignment title"
        required
      />
      <textarea
        value={formValue.instructions}
        onChange={(e) => updateForm("instructions", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Instructions"
      />
      <input
        type="file"
        onChange={(e) => updateForm("attachment", e.target.files?.[0] || null)}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <input
          type="datetime-local"
          value={formValue.due_date}
          onChange={(e) => updateForm("due_date", e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="number"
          min={1}
          value={formValue.max_points}
          onChange={(e) => updateForm("max_points", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Points"
        />
      </div>
      <label className="inline-flex items-center text-sm text-gray-600">
        <input
          type="checkbox"
          checked={formValue.allow_resubmission}
          onChange={(e) => updateForm("allow_resubmission", e.target.checked)}
          className="mr-2"
        />
        Allow resubmission
      </label>
      <button
        type="submit"
        className={`${primaryButton} w-full rounded-lg py-2 text-sm`}
      >
        Add Assignment
      </button>
    </form>
  );
};

const QuizForm = ({
  moduleId,
  value,
  onChange,
  onSubmit,
  questionBank,
  loadingBank,
  onInsertFromBank,
  onSaveToBank,
  onRemoveQuestion,
  onDuplicateQuestion,
  onMoveQuestion,
  onDeleteBankEntry,
}) => {
  const formValue = {
    ...DEFAULT_QUIZ_FORM,
    ...(value || {}),
    questions: (value?.questions || []).map((question, idx) => ({
      order: idx + 1,
      choices: question.choices ? [...question.choices] : [],
      ...question,
    })),
  };

  const updateForm = (field, fieldValue) => {
    onChange((prev) => ({
      ...prev,
      [moduleId]: {
        ...formValue,
        [field]: fieldValue,
      },
    }));
  };

  const addQuestion = () => {
    updateForm("questions", [
      ...formValue.questions,
      {
        prompt: "",
        question_type: "multiple_choice",
        points: 1,
        order: formValue.questions.length + 1,
        choices: [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      },
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...formValue.questions];
    const updatedQuestion = { ...questions[index], [field]: value };
    if (field === "question_type") {
      if (value === "short_answer") {
        updatedQuestion.choices = [];
      } else if (value === "true_false") {
        updatedQuestion.choices = [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false },
        ];
      } else if (!updatedQuestion.choices || updatedQuestion.choices.length < 2) {
        updatedQuestion.choices = [
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ];
      }
    }
    questions[index] = updatedQuestion;
    updateForm("questions", questions);
  };

  const updateChoice = (qIndex, cIndex, field, value) => {
    const questions = [...formValue.questions];
    const question = { ...questions[qIndex] };
    const choices = question.choices ? question.choices.map((choice) => ({ ...choice })) : [];
    if (!choices[cIndex]) {
      choices[cIndex] = { text: "", is_correct: false };
    }
    if (field === "is_correct" && question.question_type === "true_false") {
      question.choices = choices.map((choice, idx) => ({
        ...choice,
        is_correct: idx === cIndex ? value : false,
      }));
    } else {
      choices[cIndex] = { ...choices[cIndex], [field]: value };
      question.choices = choices;
    }
    questions[qIndex] = question;
    updateForm("questions", questions);
  };

  return (
    <form
      className="mt-3 space-y-2 bg-white border border-gray-200 rounded-lg p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(moduleId);
      }}
    >
      <input
        type="text"
        value={formValue.title}
        onChange={(e) => updateForm("title", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Quiz title"
        required
      />
      <textarea
        value={formValue.description}
        onChange={(e) => updateForm("description", e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2"
        placeholder="Quiz description"
      />
      <div className="grid grid-cols-3 gap-2 text-sm">
        <input
          type="number"
          min={1}
          value={formValue.time_limit_minutes}
          onChange={(e) => updateForm("time_limit_minutes", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Time limit (min)"
        />
        <input
          type="number"
          min={1}
          value={formValue.attempts_allowed}
          onChange={(e) => updateForm("attempts_allowed", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Attempts"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={formValue.passing_score}
          onChange={(e) => updateForm("passing_score", Number(e.target.value))}
          className="border border-gray-300 rounded px-3 py-2"
          placeholder="Passing %"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h5 className="font-semibold text-sm">Questions</h5>
          <button
            type="button"
            onClick={addQuestion}
            className={`${subtleButton} px-2 py-1 text-xs rounded-md gap-1`}
          >
            <span aria-hidden>＋</span>
            Add Question
          </button>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>Question Library</span>
            <span>
              {loadingBank ? "Loading..." : `${questionBank.length} item${questionBank.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {loadingBank ? (
            <p className="text-xs text-gray-500">Fetching saved questions...</p>
          ) : questionBank.length === 0 ? (
            <p className="text-xs text-gray-500">Save questions from this quiz to build your reusable library.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-2">
              {questionBank.map((entry) => (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-md p-2 text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-700 line-clamp-2">{entry.prompt}</p>
                      <p className="text-gray-500">
                        {entry.question_type.replace("_", " ")} • {entry.points} point{entry.points === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => onInsertFromBank(moduleId, entry)}
                        className={`${primaryButton} px-2 py-1 text-[11px] rounded-md`}
                      >
                        Insert
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBankEntry(entry.id)}
                        className={`${secondaryButton} px-2 py-1 text-[11px] rounded-md`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {entry.choices && entry.choices.length > 0 && (
                    <ul className="list-disc pl-4 text-gray-500">
                      {entry.choices.slice(0, 3).map((choice, idx) => (
                        <li key={idx}>
                          {choice.text}
                          {choice.is_correct ? " ✓" : ""}
                        </li>
                      ))}
                      {entry.choices.length > 3 && <li>…</li>}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {formValue.questions.map((question, qIndex) => (
          <div key={qIndex} className="border border-gray-200 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">
                Question {qIndex + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onMoveQuestion(moduleId, qIndex, -1)}
                  disabled={qIndex === 0}
                  className={`${subtleButton} px-2 py-1 rounded-md text-xs ${qIndex === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMoveQuestion(moduleId, qIndex, 1)}
                  disabled={qIndex === formValue.questions.length - 1}
                  className={`${subtleButton} px-2 py-1 rounded-md text-xs ${qIndex === formValue.questions.length - 1 ? "opacity-40 cursor-not-allowed" : ""}`}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateQuestion(moduleId, qIndex)}
                  className={`${secondaryButton} px-2 py-1 rounded-md text-xs`}
                  title="Duplicate question"
                >
                  ⧉
                </button>
                <button
                  type="button"
                  onClick={() => onSaveToBank(moduleId, qIndex)}
                  className={`${secondaryButton} px-2 py-1 rounded-md text-xs`}
                  title="Save to library"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveQuestion(moduleId, qIndex)}
                  className={`${subtleButton} px-2 py-1 rounded-md text-xs`}
                  title="Remove question"
                >
                  ✕
                </button>
              </div>
            </div>
            <input
              type="text"
              value={question.prompt}
              onChange={(e) => updateQuestion(qIndex, "prompt", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder={`Question ${qIndex + 1} prompt`}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={question.question_type}
                onChange={(e) => updateQuestion(qIndex, "question_type", e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </select>
              <input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => updateQuestion(qIndex, "points", Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
                placeholder="Points"
              />
            </div>

            {question.question_type !== "short_answer" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500">Choices</p>
                {question.choices.map((choice, cIndex) => (
                  <div key={cIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => updateChoice(qIndex, cIndex, "text", e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1"
                      placeholder={`Choice ${cIndex + 1}`}
                      required
                    />
                    <label className="flex items-center text-xs text-gray-600">
                      <input
                        type={question.question_type === "true_false" ? "radio" : "checkbox"}
                        name={`question-${moduleId}-${qIndex}`}
                        checked={choice.is_correct}
                        onChange={(e) =>
                          updateChoice(qIndex, cIndex, "is_correct", e.target.checked)
                        }
                        className="mr-1"
                      />
                      Correct
                    </label>
                  </div>
                ))}
                {question.question_type === "multiple_choice" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateForm("questions", formValue.questions.map((q, idx) =>
                        idx === qIndex
                          ? { ...q, choices: [...q.choices, { text: "", is_correct: false }] }
                          : q
                      ))
                    }
                    className="text-primary text-xs hover:underline"
                  >
                    + Add Choice
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <button
          type="submit"
          className={`${primaryButton} w-full rounded-lg py-2 text-sm`}
        >
          Add Quiz
        </button>
      </div>
    </form>
  );
};

const LessonPreviewModal = ({ lesson, onClose, darkMode }) => {
  if (!lesson) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className={`max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-primary/5"}`}>
          <div>
            <h3 className="text-xl font-semibold text-primary">{lesson.title}</h3>
            {lesson.overview && <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-500"} mt-1`}>{lesson.overview}</p>}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded bg-primary text-white hover:bg-primary-dark"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {buildLessonMedia(lesson)}
          {lesson.content && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
          )}
          {lesson.resource_link && (
            <a
              href={lesson.resource_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
            >
              View Resource
            </a>
          )}
        </div>
      </div>
    </div>
  );
};