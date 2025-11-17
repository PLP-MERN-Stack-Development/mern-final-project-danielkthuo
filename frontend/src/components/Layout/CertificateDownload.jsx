import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const CertificateDownload = ({ courseId, courseTitle }) => {
  const { user } = useAuth();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCertificate();
  }, [courseId]);

  const checkCertificate = async () => {
    try {
      const response = await axios.get('/api/certificates/my-certificates');
      const courseCertificate = response.data.certificates.find(
        cert => cert.course._id === courseId
      );
      setCertificate(courseCertificate);
    } catch (error) {
      console.error('Error checking certificate:', error);
    }
  };

  const generateCertificate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post(`/api/certificates/generate/${courseId}`);
      
      if (response.data.success) {
        setCertificate(response.data.certificate);
        setMessage('Certificate generated successfully!');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      setMessage(error.response?.data?.message || 'Error generating certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const response = await axios.get(`/api/certificates/download/${certificate._id}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificate.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      setMessage('Error downloading certificate');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Course Certificate</h3>
      
      {certificate ? (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            Congratulations! You've earned a certificate for completing "{courseTitle}"
          </p>
          <button
            onClick={downloadCertificate}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Download Certificate
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Certificate ID: {certificate.certificateId}
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            Complete all lessons to earn your certificate
          </p>
          <button
            onClick={generateCertificate}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default CertificateDownload;