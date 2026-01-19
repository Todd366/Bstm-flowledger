// components/Camera.jsx
// Real camera implementation with GPS, compression, and offline support

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

const CameraComponent = ({ onCapture, label, required = true, quality = 0.8 }) => {
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Get GPS coordinates
  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        () => resolve(null), // Fail silently if GPS denied
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  // Start camera
  const startCamera = async () => {
    try {
      setError(null);
      
      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);

      // Get GPS in background
      const coords = await getLocation();
      setLocation(coords);
      
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please enable camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Switch camera (front/back)
  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add timestamp watermark
    const timestamp = new Date().toLocaleString();
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(10, canvas.height - 60, 400, 50);
    context.fillStyle = 'white';
    context.font = 'bold 16px Arial';
    context.fillText(timestamp, 20, canvas.height - 35);
    
    // Add GPS watermark if available
    if (location) {
      context.fillText(
        `GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
        20,
        canvas.height - 15
      );
    }

    // Convert to blob with compression
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    // Convert blob to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const photoData = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        location: location,
        data: reader.result, // base64 string
        size: blob.size,
        width: canvas.width,
        height: canvas.height,
        facingMode: facingMode
      };

      setCaptured(photoData);
      stopCamera();
    };
    reader.readAsDataURL(blob);
  };

  // Confirm and save photo
  const confirmPhoto = () => {
    if (captured && onCapture) {
      onCapture(captured);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCaptured(null);
    startCamera();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Render captured photo view
  if (captured) {
    return (
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="relative">
          <img 
            src={captured.data} 
            alt="Captured" 
            className="w-full h-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 text-white text-xs">
            <p>{new Date(captured.timestamp).toLocaleString()}</p>
            {captured.location && (
              <p>GPS: {captured.location.lat.toFixed(6)}, {captured.location.lng.toFixed(6)}</p>
            )}
            <p>Size: {(captured.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
        <div className="flex gap-2 p-3 bg-gray-50">
          <button
            onClick={retakePhoto}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-300"
          >
            <RotateCcw className="w-5 h-5" />
            Retake
          </button>
          <button
            onClick={confirmPhoto}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700"
          >
            <Check className="w-5 h-5" />
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // Render camera view
  if (cameraActive) {
    return (
      <div className="border-2 border-blue-500 rounded-lg overflow-hidden">
        <div className="relative bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Camera controls overlay */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={switchCamera}
              className="bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
            >
              <RotateCcw className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-500 bg-opacity-80 p-2 rounded-full hover:bg-opacity-100"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* GPS indicator */}
          {location && (
            <div className="absolute top-3 left-3 bg-green-500 bg-opacity-80 px-3 py-1 rounded-full text-white text-xs font-semibold">
              GPS ✓
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50">
          <button
            onClick={capturePhoto}
            className="w-full bg-blue-600 text-white px-4 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-6 h-6" />
            Capture Photo
          </button>
        </div>
      </div>
    );
  }

  // Render initial state (not captured, camera off)
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      {error ? (
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={startCamera}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center mb-4">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Open Camera {required && '*'}
          </button>
          <p className="text-sm text-gray-500 mt-3">{label}</p>
          <p className="text-xs text-gray-400 mt-2">
            📍 GPS coordinates will be captured automatically
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraComponent;

// Usage Example:
/*
import CameraComponent from './components/Camera';

function MyComponent() {
  const handlePhotoCapture = (photoData) => {
    console.log('Photo captured:', photoData);
    // photoData contains: id, timestamp, location, data (base64), size, width, height
    
    // Save to state or send to API
    setPhotos(prev => [...prev, photoData]);
  };

  return (
    <CameraComponent 
      onCapture={handlePhotoCapture}
      label="Take photo of items"
      required={true}
      quality={0.8} // 0.0 to 1.0, default 0.8
    />
  );
}
*/
