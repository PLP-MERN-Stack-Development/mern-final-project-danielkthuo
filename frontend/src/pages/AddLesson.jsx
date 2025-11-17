import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AddLesson = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    duration: 30,
    order: 1,
    isFree: false,
    videoUrl: '',
    resources: []
  });

  useEffect(() => {
    checkAuthorization();
  }, [courseId, user]);

  const checkAuthorization = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      console.log('❌ User is not instructor or admin');
      return;
    }

    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      const courseData = response.data.course;
      setCourse(courseData);

      // Get consistent user ID
      const userId = user?.id || user?._id;
      const instructorId = courseData.instructor._id;

      console.log('🔐 User ID:', userId);
      console.log('🔐 Course Instructor ID:', instructorId);
      console.log('🔐 IDs match?', userId?.toString() === instructorId?.toString());
      console.log('🔐 User is admin?', user.role === 'admin');

      // Check authorization
      if (userId?.toString() !== instructorId?.toString() && user.role !== 'admin') {
        console.log('❌ User is not authorized to add lessons to this course');
        return;
      }

      // Set next order number
      const lessonsResponse = await axios.get(`/api/lessons/course/${courseId}`);
      const lessons = lessonsResponse.data.lessons || [];
      const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 1;
      
      setFormData(prev => ({ ...prev, order: nextOrder }));

    } catch (error) {
      console.error('Error checking authorization:', error);
      alert('Error loading course information');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // SIMPLE data preparation - remove complex processing
      const submissionData = {
        title: formData.title,
        content: formData.content,
        duration: Number(formData.duration),
        order: Number(formData.order),
        isFree: formData.isFree,
        videoUrl: formData.videoUrl
      };

      console.log('🔄 Creating lesson with basic data:', submissionData);

      // Validate required fields
      if (!submissionData.title.trim()) {
        alert('Lesson title is required');
        setSaving(false);
        return;
      }

      if (!submissionData.content.trim()) {
        alert('Lesson content is required');
        setSaving(false);
        return;
      }

      // Create lesson without resources first
      console.log('📤 Sending POST request to create lesson...');
      const response = await axios.post(`/api/lessons/course/${courseId}`, submissionData);
      const lessonId = response.data.lesson._id;
      
      console.log('✅ Lesson created successfully, ID:', lessonId);

      // Now add resources separately if there are any
      if (formData.resources.length > 0) {
        const validResources = formData.resources
          .filter(resource => resource.name && resource.url)
          .map(resource => ({
            name: resource.name,
            url: resource.url,
            type: resource.type || 'link'
          }));

        if (validResources.length > 0) {
          console.log('🔄 Adding resources to lesson:', validResources);
          await axios.put(`/api/lessons/${lessonId}`, { resources: validResources });
          console.log('✅ Resources added successfully');
        }
      }

      alert('Lesson created successfully!');
      navigate(`/courses/${courseId}/manage-content`);
      
    } catch (error) {
      console.error('❌ Error creating lesson:', error);
      console.error('❌ Error response:', error.response?.data);
      
      let errorMessage = 'Error creating lesson';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Resource management functions
  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { name: '', url: '', type: 'link' }]
    }));
  };

  const updateResource = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, [field]: value } : resource
      )
    }));
  };

  const removeResource = (index) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  // Check authorization with proper ID comparison
  const userId = user?.id || user?._id;
  const isAuthorized = user && 
    (user.role === 'instructor' || user.role === 'admin') && 
    course && 
    userId && 
    course.instructor && 
    course.instructor._id && 
    (userId.toString() === course.instructor._id.toString() || user.role === 'admin');

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-2">You are not authorized to add lessons to this course.</p>
            <div className="text-sm text-gray-500 mb-6">
              <p>User ID: {userId}</p>
              <p>Course Instructor ID: {course?.instructor?._id}</p>
              <p>Match: {userId?.toString() === course?.instructor?._id?.toString() ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex justify-center space-x-4">
              <Link
                to="/courses"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Browse Courses
              </Link>
              <Link
                to="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link to="/courses" className="hover:text-blue-600">Courses</Link>
            <span>/</span>
            <Link to={`/courses/${courseId}`} className="hover:text-blue-600">{course?.title}</Link>
            <span>/</span>
            <Link to={`/courses/${courseId}/manage-content`} className="hover:text-blue-600">Manage Content</Link>
            <span>/</span>
            <span className="text-gray-900">Add Lesson</span>
          </nav>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Lesson</h1>
              <p className="text-gray-600 mt-2">Add a new lesson to "{course?.title}"</p>
            </div>
            <Link
              to={`/courses/${courseId}/manage-content`}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Manage
            </Link>
          </div>
        </div>

        {/* Lesson Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter lesson title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order *
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Position of this lesson in the course sequence
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isFree"
                  checked={formData.isFree}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  This is a free lesson (available without enrollment)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL (optional)
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://youtube.com/embed/... or https://vimeo.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: YouTube, Vimeo, or direct video URLs
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lesson content (markdown supported)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use markdown formatting for better content structure
              </p>
            </div>

            {/* Additional Resources Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Resources
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Add downloadable files, links, or supplementary materials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addResource}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Resource
                </button>
              </div>
              
              {formData.resources.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No resources added yet</p>
                  <p className="text-gray-400 text-xs mt-1">Click "Add Resource" to include supplementary materials</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.resources.map((resource, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Resource Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., PDF Guide, Source Code, Reference Link"
                            value={resource.name}
                            onChange={(e) => updateResource(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Resource URL *
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/resource.pdf"
                            value={resource.url}
                            onChange={(e) => updateResource(index, 'url', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Resource Type
                          </label>
                          <select
                            value={resource.type || 'link'}
                            onChange={(e) => updateResource(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="link">Link</option>
                            <option value="pdf">PDF</option>
                            <option value="video">Video</option>
                            <option value="code">Code</option>
                            <option value="document">Document</option>
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="mt-6 bg-red-100 text-red-600 p-2 rounded-md hover:bg-red-200 transition-colors"
                        title="Remove resource"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}/manage-content`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Create Lesson
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLesson;