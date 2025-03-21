import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CourseLearning = () => {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Check if user is enrolled
        const enrollmentRes = await axios.get(`/api/courses/${courseSlug}/enrollment/`, { withCredentials: true })
          .catch(() => {
            // Redirect to course details if not enrolled
            navigate(`/courses/${courseSlug}`);
            return { data: null };
          });
        
        if (!enrollmentRes.data) return;
        
        // Fetch course data
        const [courseRes, sectionsRes, progressRes] = await Promise.all([
          axios.get(`/api/courses/${courseSlug}/`),
          axios.get(`/api/courses/${courseSlug}/sections/`),
          axios.get(`/api/courses/${courseSlug}/progress/`, { withCredentials: true })
        ]);
        
        setCourse(courseRes.data);
        setSections(sectionsRes.data);
        setEnrollment(enrollmentRes.data);
        setProgress(progressRes.data);
        
        // Find first uncompleted content or default to first content
        const flattenedContents = sectionsRes.data.flatMap(section => 
          section.lessons.map(lesson => ({
            ...lesson,
            sectionTitle: section.title,
            sectionId: section.id
          }))
        );
        
        if (flattenedContents.length > 0) {
          const progressMap = new Map(progressRes.data.map(p => [p.content.id, p]));
          const firstUncompletedContent = flattenedContents.find(content => 
            !progressMap.has(content.id) || !progressMap.get(content.id).completed
          );
          
          const contentToDisplay = firstUncompletedContent || flattenedContents[0];
          setCurrentContent(contentToDisplay);
          
          // If there's a progress record for this content, load notes
          const contentProgress = progressMap.get(contentToDisplay.id);
          if (contentProgress && contentProgress.notes) {
            setNotes(contentProgress.notes);
          } else {
            setNotes('');
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load course data. Please try again later.");
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseSlug, navigate]);

  const handleContentClick = (content) => {
    setCurrentContent(content);
    
    // Find the progress for this content to load notes
    const contentProgress = progress.find(p => p.content.id === content.id);
    if (contentProgress && contentProgress.notes) {
      setNotes(contentProgress.notes);
    } else {
      setNotes('');
    }
    
    // Mark as accessed in the backend
    axios.post(`/api/courses/${courseSlug}/progress/${content.id}/access/`, {}, { withCredentials: true })
      .catch(err => console.error("Error marking content as accessed:", err));
  };

  const handleMarkComplete = async () => {
    if (!currentContent) return;
    
    try {
      const res = await axios.post(
        `/api/courses/${courseSlug}/progress/${currentContent.id}/complete/`, 
        {}, 
        { withCredentials: true }
      );
      
      // Update progress in state
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.content.id === currentContent.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = res.data;
          return updated;
        } else {
          return [...prev, res.data];
        }
      });
      
      // Also update enrollment progress percentage if returned
      if (res.data.enrollment && res.data.enrollment.progress_percentage !== undefined) {
        setEnrollment(prev => ({
          ...prev,
          progress_percentage: res.data.enrollment.progress_percentage
        }));
      }
    } catch (err) {
      console.error("Error marking content as complete:", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!currentContent) return;
    
    try {
      setSavingNote(true);
      const res = await axios.post(
        `/api/courses/${courseSlug}/progress/${currentContent.id}/notes/`, 
        { notes }, 
        { withCredentials: true }
      );
      
      // Update progress in state
      setProgress(prev => {
        const existingIndex = prev.findIndex(p => p.content.id === currentContent.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = res.data;
          return updated;
        } else {
          return [...prev, res.data];
        }
      });
      
      setSavingNote(false);
    } catch (err) {
      console.error("Error saving notes:", err);
      setSavingNote(false);
    }
  };

  const isContentCompleted = (contentId) => {
    return progress.some(p => p.content.id === contentId && p.completed);
  };

  const renderContentView = () => {
    if (!currentContent) return null;
    
    switch (currentContent.content_type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: currentContent.text_content }} />
          </div>
        );
      case 'video':
        return (
          <div>
            <div className="relative pb-16:9 h-0 mb-4">
              <iframe 
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={currentContent.video_url} 
                title={currentContent.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        );
      case 'file':
        return (
          <div className="text-center">
            <p className="mb-4">This lesson contains a downloadable file:</p>
            <a 
              href={currentContent.file}
              download
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
            >
              Download File
            </a>
          </div>
        );
      case 'quiz':
        return (
          <div>
            <p className="mb-4">This content includes a quiz. Please complete it to track your progress.</p>
            {/* Quiz component would go here */}
          </div>
        );
      default:
        return (
          <div className="text-center text-gray-500">
            <p>Content format not supported.</p>
          </div>
        );
    }
  };

  if (loading) return <div className="text-center p-6">Loading course content...</div>;
  if (error) return <div className="text-center p-6 text-red-600">{error}</div>;
  if (!course || !currentContent) return <div className="text-center p-6">Course content not available</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`bg-white border-r overflow-auto ${
          sidebarOpen ? 'w-80 min-w-80' : 'w-0 min-w-0 hidden'
        } transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg mb-1">{course.title}</h2>
          <div className="flex items-center text-sm text-gray-600">
            <div className="mr-2">Your progress:</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${enrollment?.progress_percentage || 0}%` }}
              ></div>
            </div>
            <div className="ml-2">{Math.round(enrollment?.progress_percentage || 0)}%</div>
          </div>
        </div>
        <div className="divide-y">
          {sections.map(section => (
            <div key={section.id} className="p-0">
              <div className="px-4 py-3 font-medium bg-gray-50">{section.title}</div>
              <ul>
                {section.lessons.map(lesson => {
                  const isCompleted = isContentCompleted(lesson.id);
                  const isActive = currentContent?.id === lesson.id;
                  
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => handleContentClick({
                          ...lesson,
                          sectionTitle: section.title,
                          sectionId: section.id
                        })}
                        className={`flex items-center w-full px-4 py-3 text-left ${
                          isActive 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : isCompleted 
                              ? 'text-gray-700' 
                              : 'text-gray-900'
                        }`}
                      >
                        <span className="mr-3">
                          {isCompleted ? (
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-blue-500' : 'border-gray-400'}`} />
                          )}
                        </span>
                        <div className="flex-1">
                          <span className="block">{lesson.title}</span>
                          <span className="text-xs text-gray-500 block">
                            {lesson.content_type === 'video' && '🎥 Video'}
                            {lesson.content_type === 'text' && '📝 Text'}
                            {lesson.content_type === 'file' && '📁 File'}
                            {lesson.content_type === 'quiz' && '❓ Quiz'}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="text-lg font-medium">{currentContent.title}</div>
          <div className="text-sm text-gray-500">
            {currentContent.sectionTitle}
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {renderContentView()}
          </div>
          
          {/* Notes area */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-medium mb-3">My Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md p-3 min-h-32"
              placeholder="Take notes for this lesson..."
            ></textarea>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleSaveNotes}
                disabled={savingNote}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
              >
                {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Bottom navigation */}
        <div className="bg-white border-t px-6 py-3 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(`/courses/${courseSlug}`)}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Course
            </button>
          </div>
          <div>
            <button
              onClick={handleMarkComplete}
              disabled={isContentCompleted(currentContent.id)}
              className={`px-4 py-2 rounded-md ${
                isContentCompleted(currentContent.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isContentCompleted(currentContent.id) ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;