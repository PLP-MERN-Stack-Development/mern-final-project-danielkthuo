import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const EditLesson = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    duration: 0,
    order: 1,
    isFree: false,
    videoUrl: '',
    resources: []
  });

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId, user]);

  const fetchLessonData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      console.log('❌ User is not instructor or admin');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch course data
      const courseResponse = await axios.get(`/api/courses/${courseId}`);
      const courseData = courseResponse.data.course;
      setCourse(courseData);

      // Fetch lesson data
      const lessonResponse = await axios.get(`/api/lessons/${lessonId}`);
      const lessonData = lessonResponse.data.lesson;
      setLesson(lessonData);

      // Debug authorization
      const userId = user?.id || user?._id;
      const instructorId = courseData.instructor._id;

      console.log('🔐 User ID:', userId);
      console.log('🔐 Course Instructor ID:', instructorId);
      console.log('🔐 IDs match?', userId?.toString() === instructorId?.toString());
      console.log('🔐 User is admin?', user.role === 'admin');

      // Check authorization
      if (userId?.toString() !== instructorId?.toString() && user.role !== 'admin') {
        console.log('❌ User is not authorized to edit this lesson');
        return;
      }

      // Populate form with existing lesson data - FIXED RESOURCES HANDLING
      setFormData({
        title: lessonData.title || '',
        content: lessonData.content || '',
        duration: lessonData.duration || 0,
        order: lessonData.order || 1,
        isFree: lessonData.isFree || false,
        videoUrl: lessonData.videoUrl || '',
        resources: lessonData.resources?.map(resource => ({
          name: resource.name || '',
          url: resource.url || '',
          type: resource.type || 'link'
        })) || []
      });

      console.log('📦 Loaded lesson resources:', lessonData.resources);
      console.log('📦 Form resources:', formData.resources);

    } catch (error) {
      console.error('Error fetching lesson data:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 404) {
        alert('Lesson not found');
      } else if (error.response?.status === 403) {
        alert('You are not authorized to edit this lesson');
      } else {
        alert('Error loading lesson information');
      }
      navigate(`/courses/${courseId}/manage-content`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data for submission - FIXED RESOURCES SCHEMA
      const submissionData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        duration: parseInt(formData.duration) || 0,
        order: parseInt(formData.order) || 1,
        isFree: Boolean(formData.isFree),
        videoUrl: formData.videoUrl.trim(),
        resources: formData.resources
          .filter(resource => resource.name?.trim() && resource.url?.trim())
          .map(resource => ({
            name: resource.name.trim(),
            url: resource.url.trim(),
            type: resource.type || 'link'
          }))
      };

      console.log('🔄 Sending update data:', JSON.stringify(submissionData, null, 2));

      // Validate required fields
      if (!submissionData.title) {
        alert('Lesson title is required');
        setSaving(false);
        return;
      }

      if (!submissionData.content) {
        alert('Lesson content is required');
        setSaving(false);
        return;
      }

      if (submissionData.duration < 1) {
        alert('Duration must be at least 1 minute');
        setSaving(false);
        return;
      }

      const response = await axios.put(`/api/lessons/${lessonId}`, submissionData);
      
      console.log('✅ Update successful:', response.data);
      alert('Lesson updated successfully!');
      navigate(`/courses/${courseId}/manage-content`);
      
    } catch (error) {
      console.error('❌ Error updating lesson:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      let errorMessage = 'Error updating lesson';
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          // Mongoose validation errors
          const errorDetails = Object.values(error.response.data.errors)
            .map(err => err.message)
            .join('\n');
          errorMessage = `Validation errors:\n${errorDetails}`;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Error updating lesson: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Resource management functions - UPDATED TO MATCH BACKEND SCHEMA
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You are not authorized to edit this lesson.</p>
            <Link
              to={`/courses/${courseId}/manage-content`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Manage
            </Link>
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
          <p className="text-gray-600">Loading lesson data...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Not Found</h2>
          <p className="text-gray-600 mb-4">The lesson you're trying to edit doesn't exist.</p>
          <Link
            to={`/courses/${courseId}/manage-content`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Manage Content
          </Link>
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
            <span className="text-gray-900">Edit Lesson</span>
          </nav>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Lesson</h1>
              <p className="text-gray-600 mt-2">Update lesson: "{lesson.title}"</p>
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
                  This is a free lesson
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
                placeholder="https://youtube.com/embed/..."
              />
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
                placeholder="Enter lesson content (markdown supported)"
              />
            </div>

            {/* Resources Section - UPDATED TO MATCH BACKEND SCHEMA */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Resources
                </label>
                <button
                  type="button"
                  onClick={addResource}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                >
                  Add Resource
                </button>
              </div>
              
              {formData.resources.map((resource, index) => (
                <div key={index} className="flex items-center space-x-4 mb-3 p-3 bg-gray-50 rounded">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name *</label>
                      <input
                        type="text"
                        placeholder="Resource Name"
                        value={resource.name}
                        onChange={(e) => updateResource(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">URL *</label>
                      <input
                        type="url"
                        placeholder="Resource URL"
                        value={resource.url}
                        onChange={(e) => updateResource(index, 'url', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Type</label>
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
                    className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}/manage-content`)}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Lesson'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditLesson;