import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assignmentsAPI, assignmentSubmissionsAPI } from "../Services/api";
import { useTheme } from "../context/ThemeContext";

const STATUS_OPTIONS = [
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "graded", label: "Graded" },
  { value: "returned", label: "Returned" },
];

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const resolveFileUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${window.location.origin.replace(/:\\d+$/, ":8000")}${url}`;
};

export default function AssignmentReview() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        setLoading(true);
        const data = await assignmentsAPI.get(assignmentId);
        setAssignment(data);
        const submissionMap = {};
        (data.submissions || []).forEach((submission) => {
          submissionMap[submission.id] = {
            grade: submission.grade ?? "",
            feedback: submission.feedback ?? "",
            status: submission.status,
          };
        });
        setForms(submissionMap);
        setSubmissions(data.submissions || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load assignment submissions.");
      } finally {
        setLoading(false);
      }
    };
    loadAssignment();
  }, [assignmentId]);

  const filteredSubmissions = useMemo(() => {
    if (filterStatus === "all") return submissions;
    return submissions.filter((submission) => submission.status === filterStatus);
  }, [submissions, filterStatus]);

  const handleChange = (id, field, value) => {
    setForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleGrade = async (submissionId) => {
    const form = forms[submissionId];
    if (!form || form.grade === "") {
      setError("Grade is required before submitting.");
      return;
    }

    try {
      setSavingId(submissionId);
      await assignmentSubmissionsAPI.grade(submissionId, {
        grade: form.grade,
        feedback: form.feedback || "",
        status: form.status || "graded",
      });
      setError("");
      setMessage("Submission graded successfully.");
      setTimeout(() => setMessage(""), 2500);
      await refreshSubmissions();
    } catch (err) {
      console.error(err);
      setError("Failed to submit grade. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusUpdate = async (submissionId, status) => {
    try {
      setSavingId(submissionId);
      await assignmentSubmissionsAPI.setStatus(submissionId, status);
      setError("");
      await refreshSubmissions();
    } catch (err) {
      console.error(err);
      setError("Failed to update status.");
    } finally {
      setSavingId(null);
    }
  };

  const refreshSubmissions = async () => {
    try {
      const data = await assignmentsAPI.get(assignmentId);
      setAssignment(data);
      setSubmissions(data.submissions || []);
      const submissionMap = {};
      (data.submissions || []).forEach((submission) => {
        submissionMap[submission.id] = {
          grade: submission.grade ?? "",
          feedback: submission.feedback ?? "",
          status: submission.status,
        };
      });
      setForms(submissionMap);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Assignment not found.</p>
        <Link to="/manage-courses" className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Back to Manage Courses
        </Link>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`min-h-screen p-8 transition-colors ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className={`max-w-5xl mx-auto shadow-xl rounded-2xl p-6 md:p-8 transition-colors ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Assignment Review</h1>
              <p className={darkMode ? "text-gray-300" : "text-gray-600"}>{assignment.title}</p>
              <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : "No due date"}
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Back
            </button>
          </div>

          {(error || message) && (
            <div className={`mb-4 p-3 rounded-lg ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {error || message}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <label className={darkMode ? "text-gray-300" : "text-gray-600"}>Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`rounded-lg px-3 py-2 border ${darkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white border-gray-300"}`}
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm`}>
              Showing {filteredSubmissions.length} of {submissions.length} submission{submissions.length === 1 ? "" : "s"}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className={`border border-dashed rounded-lg p-10 text-center ${darkMode ? "border-gray-700 text-gray-300" : "border-gray-300 text-gray-500"}`}>
              No submissions match this filter yet.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map((submission) => {
                const form = forms[submission.id] || {
                  grade: submission.grade ?? "",
                  feedback: submission.feedback ?? "",
                  status: submission.status,
                };
                const attachmentUrl = resolveFileUrl(submission.attachment);
                return (
                  <div
                    key={submission.id}
                    className={`rounded-xl border p-5 shadow transition ${
                      darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{submission.student?.display_name || submission.student?.username}</h3>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Submitted: {formatDateTime(submission.submitted_at)}
                          {submission.is_late && <span className="ml-2 text-red-500 font-semibold">Late</span>}
                        </p>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Status: {STATUS_OPTIONS.find((opt) => opt.value === submission.status)?.label || submission.status}
                        </p>
                        {submission.reviewed_by && (
                          <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>
                            Reviewed by {submission.reviewed_by.display_name || submission.reviewed_by.username} on {formatDateTime(submission.reviewed_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={form.status}
                          onChange={(e) => handleChange(submission.id, "status", e.target.value)}
                          className={`rounded px-3 py-2 text-sm border ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleStatusUpdate(submission.id, form.status)}
                          className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                          disabled={savingId === submission.id}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>

                    {submission.text_response && (
                      <div className={`mt-4 p-4 rounded ${darkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-700"}`}>
                        <h4 className="font-medium text-primary mb-2">Student Response</h4>
                        <p className="text-sm whitespace-pre-wrap">{submission.text_response}</p>
                      </div>
                    )}

                    {attachmentUrl && (
                      <div className="mt-3">
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Download attachment
                        </a>
                      </div>
                    )}

                    <form
                      className="mt-4 grid md:grid-cols-2 gap-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleGrade(submission.id);
                      }}
                    >
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Grade</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.grade}
                          onChange={(e) => handleChange(submission.id, "grade", e.target.value)}
                          className={`rounded-lg px-3 py-2 border ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                          placeholder="Score"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold">Feedback</label>
                        <textarea
                          value={form.feedback}
                          onChange={(e) => handleChange(submission.id, "feedback", e.target.value)}
                          className={`w-full rounded-lg px-3 py-2 border ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white border-gray-300"}`}
                          rows={3}
                          placeholder="Detailed feedback for the learner"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                          disabled={savingId === submission.id}
                        >
                          {savingId === submission.id ? "Saving..." : "Save Grade"}
                        </button>
                        {submission.status !== "returned" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(submission.id, "returned")}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                          >
                            Return with Feedback
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
