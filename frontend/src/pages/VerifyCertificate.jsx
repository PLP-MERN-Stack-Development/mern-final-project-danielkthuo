import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyCertificate = () => {
  const { verificationCode } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyCertificate();
  }, [verificationCode]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/certificates/verify/${verificationCode}`);
      
      if (response.data.success) {
        setCertificate(response.data.certificate);
      } else {
        setError('Certificate not found or invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setError('Invalid certificate or verification code');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Certificate</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verified</h1>
            <p className="text-gray-600">This certificate is authentic and valid</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Certificate Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Student:</span>
                <p className="text-gray-900">{certificate.student.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-900">{certificate.student.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Course:</span>
                <p className="text-gray-900">{certificate.course.title}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Instructor:</span>
                <p className="text-gray-900">{certificate.instructor.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Completion Date:</span>
                <p className="text-gray-900">{new Date(certificate.completionDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Certificate ID:</span>
                <p className="text-gray-900 font-mono">{certificate.certificateId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Verification Code:</span>
                <p className="text-gray-900 font-mono">{certificate.verificationCode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified ✓
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              This certificate was issued by {certificate.instructor.name} and is verified as authentic.
            </p>
            <div className="space-x-4">
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Return Home
              </Link>
              <Link
                to="/courses"
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;