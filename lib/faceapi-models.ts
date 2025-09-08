let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export const loadFaceApiModels = async (): Promise<void> => {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const faceapi = await import('face-api.js');
      
      // Load models from public/models directory
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      
      modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
    } catch (error) {
      console.error('Error loading face-api models:', error);
      throw error;
    }
  })();

  return loadingPromise;
};

export const areModelsLoaded = (): boolean => modelsLoaded;