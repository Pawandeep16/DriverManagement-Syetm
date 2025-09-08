'use client';

import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Check, X } from 'lucide-react';

interface FaceRecognitionProps {
  onFaceVerified: (verified: boolean) => void;
  driverFaceDescriptor?: number[];
  isEnrolling?: boolean;
  onFaceEnrolled?: (descriptor: number[]) => void;
}

export default function FaceRecognition({ 
  onFaceVerified, 
  driverFaceDescriptor, 
  isEnrolling = false,
  onFaceEnrolled 
}: FaceRecognitionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'detecting' | 'verified' | 'failed'>('idle');

  useEffect(() => {
    loadModels();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading face-api models:', error);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    setIsDetecting(true);
    setStatus('detecting');

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const canvas = canvasRef.current;
        const displaySize = { width: 640, height: 480 };
        faceapi.matchDimensions(canvas, displaySize);

        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetection);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);

        if (isEnrolling) {
          setStatus('verified');
          onFaceEnrolled?.(Array.from(detection.descriptor));
        } else if (driverFaceDescriptor) {
          const distance = faceapi.euclideanDistance(
            detection.descriptor,
            new Float32Array(driverFaceDescriptor)
          );
          
          const isMatch = distance < 0.4; // Threshold for face matching
          setStatus(isMatch ? 'verified' : 'failed');
          onFaceVerified(isMatch);
        }
      } else {
        setStatus('failed');
        onFaceVerified(false);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      setStatus('failed');
      onFaceVerified(false);
    }

    setIsDetecting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {isEnrolling ? 'Face Enrollment' : 'Face Recognition'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            width="640"
            height="480"
            className="w-full rounded-lg bg-gray-100"
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            onClick={startCamera} 
            disabled={!!stream || !isLoaded}
            variant="outline"
          >
            Start Camera
          </Button>
          <Button 
            onClick={detectFace}
            disabled={!stream || isDetecting || !isLoaded}
            className="min-w-32"
          >
            {isDetecting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Detecting...
              </div>
            ) : (
              isEnrolling ? 'Enroll Face' : 'Verify Face'
            )}
          </Button>
          <Button 
            onClick={stopCamera} 
            disabled={!stream}
            variant="outline"
          >
            Stop Camera
          </Button>
        </div>

        {status !== 'idle' && (
          <div className={`flex items-center justify-center gap-2 p-4 rounded-lg ${
            status === 'verified' ? 'bg-green-50 text-green-700' :
            status === 'failed' ? 'bg-red-50 text-red-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {status === 'verified' && <Check className="h-5 w-5" />}
            {status === 'failed' && <X className="h-5 w-5" />}
            <span className="font-medium">
              {status === 'detecting' && 'Detecting face...'}
              {status === 'verified' && (isEnrolling ? 'Face enrolled successfully!' : 'Face verified successfully!')}
              {status === 'failed' && 'Face verification failed. Please try again.'}
            </span>
          </div>
        )}

        {!isLoaded && (
          <div className="text-center text-muted-foreground">
            Loading face recognition models...
          </div>
        )}
      </CardContent>
    </Card>
  );
}