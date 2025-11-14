import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import {
  conversationsAPI,
  messagesAPI,
  enrollmentsAPI,
  coursesAPI,
  API_ORIGIN,
} from "../Services/api";
import { getCurrentUser } from "../Services/authService";

const normalizeResults = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.results || [];
};

const formatDateTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const ConversationListItem = ({ conversation, isActive, onSelect, user, darkMode }) => {
  const title = useMemo(() => {
    if (conversation.title) return conversation.title;
    if (conversation.course) return `${conversation.course.title}`;
    const others =
      conversation.participants?.filter((participant) => participant.user?.id !== user?.id) || [];
    if (others.length > 0) {
      return others.map((participant) => participant.user.display_name || participant.user.username).join(", ");
    }
    return "Conversation";
  }, [conversation, user]);

  const lastMessagePreview = conversation.last_message?.body || (conversation.last_message?.attachment && "Attachment") || "";
  const unreadCount = conversation.unread_count || 0;

  return (
    <button
      onClick={() => onSelect(conversation)}
      className={`w-full text-left px-4 py-3 rounded-lg transition ${
        isActive
          ? "bg-primary text-white shadow"
          : darkMode
          ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
          : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold truncate">{title}</span>
        {unreadCount > 0 && (
          <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
      <p className="text-xs opacity-80 truncate">{lastMessagePreview}</p>
      <p className="text-[11px] opacity-50 mt-1">
        {conversation.last_message ? formatDateTime(conversation.last_message.created_at) : formatDateTime(conversation.updated_at)}
      </p>
    </button>
  );
};

const MessageBubble = ({ message, currentUserId, darkMode }) => {
  const isOwn = message.sender?.id === currentUserId;
  const alignment = isOwn ? "items-end" : "items-start";
  const bubbleColor = isOwn
    ? "bg-primary text-white"
    : darkMode
    ? "bg-gray-700 text-gray-100"
    : "bg-white text-gray-800 border border-gray-200";

  return (
    <div className={`flex flex-col ${alignment} gap-1`}>
      <div className={`text-xs opacity-60 ${isOwn ? "text-right" : "text-left"}`}>
        {message.sender?.display_name || message.sender?.username || "User"} · {formatDateTime(message.created_at)}
        {message.is_edited && " · edited"}
      </div>
      <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${bubbleColor}`}>
        {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline mt-2 inline-flex items-center gap-1"
          >
            📎 View attachment
          </a>
        )}
      </div>
    </div>
  );
};

const NewConversationForm = ({
  role,
  studentCourses,
  instructorCourses,
  onCreate,
  loading,
  darkMode,
}) => {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [includeStudents, setIncludeStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isInstructorOrAdmin = role === "instructor" || role === "admin";
  const courses = isInstructorOrAdmin ? instructorCourses : studentCourses;
  const selectedCourse = courses.find((course) => String(course.id) === String(courseId));

  useEffect(() => {
    if (role === "student") {
      setIncludeStudents(false);
    }
  }, [role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!courseId) {
      alert("Please select a course to start a conversation.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        title: title || (selectedCourse ? `${selectedCourse.title} Discussion` : "New Conversation"),
        course_id: selectedCourse?.id,
      };

      if (isInstructorOrAdmin) {
        payload.include_course_students = includeStudents;
      }

      const createdConversation = await conversationsAPI.create(payload);
      if (initialMessage.trim()) {
        await messagesAPI.create({
          conversation: createdConversation.id,
          body: initialMessage,
        });
      }
      onCreate(createdConversation);
      setTitle("");
      setCourseId("");
      setInitialMessage("");
    } catch (error) {
      console.error("Failed to create conversation", error);
      alert(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Unable to create conversation right now."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl p-4 space-y-4 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white shadow"}`}
    >
      <div>
        <h3 className="text-lg font-semibold mb-1 text-primary">Start a new conversation</h3>
        <p className="text-sm opacity-70">
          Choose a course to automatically connect with the relevant instructor or classmates.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Course</label>
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
          }`}
          disabled={loading || submitting}
          required
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Conversation title</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Project guidance discussion"
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
          }`}
          disabled={loading || submitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Initial message (optional)</label>
        <textarea
          value={initialMessage}
          onChange={(event) => setInitialMessage(event.target.value)}
          rows={3}
          placeholder="Introduce the topic or question..."
          className={`w-full px-3 py-2 rounded-lg border ${
            darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
          }`}
          disabled={loading || submitting}
        />
      </div>
      {isInstructorOrAdmin && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeStudents}
            onChange={(event) => setIncludeStudents(event.target.checked)}
            disabled={loading || submitting}
          />
          Include all enrolled students
        </label>
      )}
      <button
        type="submit"
        disabled={loading || submitting}
        className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create conversation"}
      </button>
    </form>
  );
};

export default function Messaging() {
  const { darkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState("");

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [instructorCourses, setInstructorCourses] = useState([]);

  const messagesEndRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  const role = user?.role || "";

  const studentCourses = useMemo(() => {
    return studentEnrollments.map((enrollment) => {
      const { course } = enrollment;
      return {
        id: course?.id,
        title: course?.title,
        instructor: course?.instructor,
        thumbnail: course?.thumbnail,
      };
    });
  }, [studentEnrollments]);

  const handleScrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  const fetchConversations = useCallback(
    async (options = {}) => {
      try {
        if (!options.silent) {
          setLoadingConversations(true);
        }
        const data = await conversationsAPI.list();
        const items = normalizeResults(data);
        setConversations(items);
        if (!selectedConversationId && items.length > 0) {
          setSelectedConversationId(items[0].id);
        } else if (options.selectId) {
          setSelectedConversationId(options.selectId);
        }
      } catch (err) {
        console.error("Failed to load conversations", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Unable to load conversations."
        );
      } finally {
        setLoadingConversations(false);
      }
    },
    [selectedConversationId]
  );

  const markMessagesRead = useCallback(
    async (items) => {
      if (!user) return;
      const unreadMessages = items.filter(
        (msg) => !msg.is_read && msg.sender?.id !== user.id
      );
      if (unreadMessages.length === 0) return;
      try {
        await Promise.all(
          unreadMessages.map((message) => messagesAPI.markRead(message.id).catch(() => null))
        );
      } catch (err) {
        console.warn("Failed to mark some messages as read", err);
      }
    },
    [user]
  );

  const fetchMessages = useCallback(
    async (conversationId, scrollBehavior = "instant") => {
      if (!conversationId) return;
      try {
        setLoadingMessages(true);
        const data = await messagesAPI.list({ conversation: conversationId });
        const items = normalizeResults(data);
        setMessages(items);
        await markMessagesRead(items);
        setTimeout(() => handleScrollToBottom(scrollBehavior), 50);
      } catch (err) {
        console.error("Failed to load messages", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Unable to load messages."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [handleScrollToBottom, markMessagesRead]
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoadingUser(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser.role === "student") {
          const enrollmentData = await enrollmentsAPI.getAll();
          setStudentEnrollments(normalizeResults(enrollmentData));
        } else {
          const coursesData = await coursesAPI.getAll();
          const items = normalizeResults(coursesData);
          if (currentUser.role === "instructor") {
            setInstructorCourses(items.filter((course) => course.instructor?.id === currentUser.id));
          } else {
            setInstructorCourses(items);
          }
        }
        await fetchConversations();
      } catch (err) {
        console.error("Failed to initialize messaging page", err);
        setError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            "Unable to load messaging workspace."
        );
      } finally {
        setLoadingUser(false);
      }
    };
    initialize();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedConversation.id, "instant");
    const interval = setInterval(() => fetchMessages(selectedConversation.id, "auto"), 15000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      handleScrollToBottom();
    }
  }, [messages, handleScrollToBottom]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversationId(conversation.id);
  };

  const handleMessageSend = async (event) => {
    event.preventDefault();
    if (!selectedConversation) return;
    if (!messageInput.trim() && !attachment) {
      return;
    }
    try {
      setSendingMessage(true);
      await messagesAPI.create({
        conversation: selectedConversation.id,
        body: messageInput.trim(),
        attachment,
      });
      setMessageInput("");
      setAttachment(null);
      await fetchMessages(selectedConversation.id);
      await fetchConversations({ silent: true });
    } catch (err) {
      console.error("Failed to send message", err);
      alert(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Unable to send this message."
      );
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachment(file);
    }
  };

  const handleConversationCreated = async (conversation) => {
    await fetchConversations({ selectId: conversation.id });
    await fetchMessages(conversation.id);
  };

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen transition-colors ${
          darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Messages</h1>
              <p className="text-sm opacity-70">
                Stay connected with instructors, students, and classmates. Conversations are grouped by course.
              </p>
            </div>
            <button
              onClick={() => fetchConversations()}
              className="self-start md:self-auto bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Refresh conversations
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-[320px,1fr] gap-6">
            <div className="space-y-6">
              <NewConversationForm
                role={role}
                studentCourses={studentCourses}
                instructorCourses={instructorCourses}
                onCreate={handleConversationCreated}
                loading={loadingUser || loadingConversations}
                darkMode={darkMode}
              />
            </div>

            <div
              className={`rounded-2xl overflow-hidden shadow-lg ${
                darkMode ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div className="grid md:grid-cols-[260px,1fr] min-h-[600px]">
                <aside
                  className={`border-r ${darkMode ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"}`}
                >
                  <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">Conversations</h2>
                    <p className="text-xs opacity-60">Select a conversation to view messages.</p>
                  </div>
                  <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(600px-64px)] custom-scrollbar">
                    {loadingConversations ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="loader border-t-4 border-primary rounded-full w-10 h-10 animate-spin"></div>
                      </div>
                    ) : conversations.length === 0 ? (
                      <p className="text-sm opacity-70 px-2">
                        No conversations yet. Start one using the form on the left.
                      </p>
                    ) : (
                      conversations.map((conversation) => (
                        <ConversationListItem
                          key={conversation.id}
                          conversation={conversation}
                          user={user}
                          isActive={conversation.id === selectedConversationId}
                          onSelect={handleConversationSelect}
                          darkMode={darkMode}
                        />
                      ))
                    )}
                  </div>
                </aside>

                <section className="flex flex-col">
                  {selectedConversation ? (
                    <>
                      <header
                        className={`px-6 py-4 border-b ${
                          darkMode ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <h2 className="text-xl font-semibold text-primary">
                          {selectedConversation.title ||
                            selectedConversation.course?.title ||
                            "Conversation"}
                        </h2>
                        {selectedConversation.course && (
                          <p className="text-sm opacity-70 flex items-center gap-2">
                            <img
                              src={
                                selectedConversation.course.thumbnail
                                  ? selectedConversation.course.thumbnail.startsWith("http")
                                    ? selectedConversation.course.thumbnail
                                    : `${API_ORIGIN}${selectedConversation.course.thumbnail}`
                                  : "https://via.placeholder.com/40"
                              }
                              alt={selectedConversation.course.title}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <span>{selectedConversation.course.title}</span>
                          </p>
                        )}
                      </header>

                      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                        {loadingMessages ? (
                          <div className="flex justify-center items-center h-full">
                            <div className="loader border-t-4 border-primary rounded-full w-12 h-12 animate-spin"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <p className="text-sm opacity-70 text-center mt-10">
                            No messages yet. Start the conversation below.
                          </p>
                        ) : (
                          messages.map((message) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              currentUserId={user?.id}
                              darkMode={darkMode}
                            />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      <footer
                        className={`border-t px-6 py-4 ${
                          darkMode ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <form onSubmit={handleMessageSend} className="space-y-3">
                          <textarea
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            placeholder="Write a message..."
                            rows={3}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "border-gray-300"
                            }`}
                            disabled={sendingMessage}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <label className="inline-flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                  type="file"
                                  onChange={handleAttachmentChange}
                                  className="hidden"
                                />
                                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition">
                                  📎 Attach file
                                </span>
                              </label>
                              {attachment && (
                                <span className="text-xs opacity-70">
                                  {attachment.name} ({(attachment.size / 1024).toFixed(1)} KB)
                                  <button
                                    type="button"
                                    onClick={() => setAttachment(null)}
                                    className="ml-2 underline"
                                  >
                                    Remove
                                  </button>
                                </span>
                              )}
                            </div>
                            <button
                              type="submit"
                              disabled={sendingMessage}
                              className="bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60"
                            >
                              {sendingMessage ? "Sending..." : "Send message"}
                            </button>
                          </div>
                        </form>
                      </footer>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <p className="text-lg font-semibold text-primary mb-2">
                        Select a conversation to get started
                      </p>
                      <p className="text-sm opacity-70">
                        Choose an existing conversation on the left or create a new one using the form.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

