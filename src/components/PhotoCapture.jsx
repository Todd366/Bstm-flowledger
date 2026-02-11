import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';

const PhotoCapture = ({ onCapture, label, required = true }) => {
  const [captured, setCaptured] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // rear camera – change to 'user' for selfie
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait until video is actually playing (important on mobile)
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      alert(
        'Cannot access camera.\n\n' +
          (err.name === 'NotAllowedError'
            ? 'Camera permission denied.'
            : 'Camera not available / secure context required (https).')
      );
      // Optional: still allow mock capture if you want
      // handleMockCapture();
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoData = canvas.toDataURL('image/jpeg', 0.92); // \~92% quality

    const photo = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      location: 'GPS: -24.6282, 25.9231 (mock – replace with real geolocation)',
      quality: 'high',
      data: photoData,
    };

    setCaptured(photo);
    onCapture(photo);

    // Immediately stop camera – very important for battery + privacy
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (captured) {
      // Optional: allow recapture
      setCaptured(null);
      startCamera();
    } else {
      startCamera().then(() => {
        // Small delay gives video time to show – better UX
        setTimeout(() => {
          if (videoRef.current?.srcObject) {
            takePhoto();
          }
        }, 800);
      });
    }
  };

  // Cleanup on unmount or when component is removed
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {captured ? (
        <div className="space-y-2">
          <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-48 rounded overflow-hidden">
            <img
              src={captured.data}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              ✓ Verified
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {captured.location}
            </div>
          </div>
          <p className="text-xs text-center text-gray-600">
            {new Date(captured.timestamp).toLocaleString()}
          </p>
          <button
            onClick={() => setCaptured(null)}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors"
          >
            Take New Photo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-black rounded overflow-hidden h-48 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <button
            onClick={handleCapture}
            disabled={!!streamRef.current} // prevent double-click spam
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition-colors disabled:opacity-50"
          >
            <Camera className="inline mr-2" size={18} />
            {streamRef.current ? 'Capturing...' : 'Capture Photo'}
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
