import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const MyCertificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/certificates/my-certificates');
      
      if (response.data.success) {
        setCertificates(response.data.certificates);
      } else {
        setError('Failed to load certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Error loading certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 const downloadCertificate = async (certificateId, certificateNumber) => {
  try {
    console.log('📥 Starting download for certificate:', certificateId);
    
    const response = await fetch(`/api/certificates/download/${certificateId}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);

    if (!response.ok) {
      // Try to get error message
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    // Check if response is PDF
    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);

    if (!contentType || !contentType.includes('application/pdf')) {
      console.warn('⚠️ Response is not PDF');
      // Try to parse as JSON error
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server returned non-PDF response');
      } catch {
        throw new Error('Server returned invalid response');
      }
    }

    const blob = await response.blob();
    console.log('📦 Blob size:', blob.size, 'type:', blob.type);

    if (blob.size === 0) {
      throw new Error('Empty PDF file received');
    }

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate-${certificateNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Clean up
    setTimeout(() => window.URL.revokeObjectURL(url), 100);

    console.log('✅ Download completed successfully');

  } catch (error) {
    console.error('❌ Download error:', error);
    alert('Download failed: ' + error.message);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link to="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">My Certificates</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-600 mt-2">
            Your earned certificates for completed courses
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Certificates Yet</h2>
            <p className="text-gray-600 mb-6">
              Complete courses to earn certificates and showcase your achievements.
            </p>
            <div className="space-x-4">
              <Link
                to="/courses"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                to="/dashboard"
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-800">
                  You have earned {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate, index) => (
                <div key={certificate._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                    <h3 className="text-white font-semibold text-lg">Certificate of Completion</h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {certificate.course?.title || 'Course Title'}
                    </h4>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>Completed:</span>
                        <span className="font-medium">
                          {certificate.completionDate ? 
                            new Date(certificate.completionDate).toLocaleDateString() : 
                            'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <span className="font-medium">
                          {certificate.instructor?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Certificate ID:</span>
                        <span className="font-mono text-xs">
                          {certificate.certificateId?.substring(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadCertificate(certificate._id, certificate.certificateId)}
                      className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCertificates;