// src/components/EnhancedCoursePlayer.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { coursesAPI, enrollmentsAPI } from '../Services/api';

export default function EnhancedCoursePlayer() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const courseData = await coursesAPI.getById(courseId);
      setCourse(courseData);
      
      if (courseData.contents && courseData.contents.length > 0) {
        setCurrentContent(courseData.contents[0]);
      }
      
      // Fetch enrollment progress
      const enrollments = await enrollmentsAPI.getAll();
      const enrollment = enrollments.find(e => e.course.id === parseInt(courseId));
      if (enrollment) {
        setProgress(enrollment.progress);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    }
  };

  const markContentComplete = async (contentId) => {
    try {
      await enrollmentsAPI.markComplete(courseId, contentId);
      setProgress(prev => Math.min(prev + (100 / course.contents.length), 100));
    } catch (error) {
      console.error('Error marking content complete:', error);
    }
  };

  const saveNotes = async () => {
    try {
      await enrollmentsAPI.saveNotes(courseId, currentContent.id, notes);
      setShowNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  if (!course || !currentContent) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Progress Bar */}
        <div className="bg-gray-200 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-1/4 bg-gray-50 p-4 border-r">
            <h3 className="font-bold text-lg mb-4">Course Contents</h3>
            <div className="space-y-2">
              {course.contents.map((content, index) => (
                <div
                  key={content.id}
                  className={`p-3 rounded cursor-pointer ${
                    currentContent.id === content.id
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentContent(content)}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      {index + 1}. {content.title}
                    </span>
                    {content.is_completed && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                  <div className="text-sm opacity-75">
                    {content.duration_minutes} min • {content.content_type}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <h2 className="text-2xl font-bold mb-4">{currentContent.title}</h2>
            <p className="text-gray-600 mb-6">{currentContent.description}</p>

            {currentContent.content_type === 'video' && currentContent.video_url && (
              <div className="mb-6">
                <video
                  controls
                  className="w-full rounded-lg"
                  src={currentContent.video_url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {currentContent.content_type === 'article' && (
              <div
                className="prose max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: currentContent.article_content }}
              />
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => markContentComplete(currentContent.id)}
                disabled={currentContent.is_completed}
                className={`px-6 py-2 rounded ${
                  currentContent.is_completed
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {currentContent.is_completed ? 'Completed' : 'Mark Complete'}
              </button>
              
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showNotes ? 'Hide Notes' : 'Show Notes'}
              </button>
            </div>

            {showNotes && (
              <div className="mt-6">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  className="w-full h-32 p-3 border rounded"
                />
                <button
                  onClick={saveNotes}
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                >
                  Save Notes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}