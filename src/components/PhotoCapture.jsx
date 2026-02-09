import React, { useState } from 'react';
import { Camera } from 'lucide-react';

const PhotoCapture = ({ onCapture, label, required = true }) => {
  const [captured, setCaptured] = useState(null);

  const handleCapture = () => {
    const photo = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      location: 'GPS: -24.6282, 25.9231 (mock)',
      quality: 'high'
    };
    setCaptured(photo);
    onCapture(photo);
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {captured ? (
        <div className="space-y-2">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 rounded flex items-center justify-center relative">
            <Camera className="w-10 h-10 text-gray-500" />
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">✓ Verified</div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {captured.location}
            </div>
          </div>
          <p className="text-xs text-center text-gray-600">
            {new Date(captured.timestamp).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-gray-50 h-32 rounded flex items-center justify-center">
            <Camera className="w-10 h-10 text-gray-400" />
          </div>
          <button
            onClick={handleCapture}
            className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            📸 Capture Photo
          </button>
          <p className="text-xs text-center text-gray-500">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;
