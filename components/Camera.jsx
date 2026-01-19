import React, { useState, useRef } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

const CameraComponent = ({ onCapture, label = "Take photo" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [captured, setCaptured] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsOpen(true);
    } catch (err) {
      alert('Camera denied. Enable in phone settings.');
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = () => setCaptured(reader.result);
      reader.readAsDataURL(blob);
      video.srcObject.getTracks().forEach(track => track.stop());
    });
  };

  const confirm = () => {
    if (onCapture) onCapture({ data: captured, timestamp: new Date().toISOString() });
    setIsOpen(false);
    setCaptured(null);
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  if (captured) {
    return (
      <div className="space-y-4">
        <img src={captured} alt="Captured" className="w-full rounded-lg" />
        <div className="flex gap-3">
          <button onClick={retake} className="flex-1 bg-gray-300 p-3 rounded-lg">Retake</button>
          <button onClick={confirm} className="flex-1 bg-green-600 text-white p-3 rounded-lg">Use Photo</button>
        </div>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className="space-y-4">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
        <canvas ref={canvasRef} className="hidden" />
        <button onClick={takePhoto} className="w-full bg-blue-600 text-white p-4 rounded-lg text-lg font-bold">
          Capture
        </button>
        <button onClick={() => setIsOpen(false)} className="text-red-600">Cancel</button>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
        Open Camera - {label}
      </button>
    </div>
  );
};

export default CameraComponent;
