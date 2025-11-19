import { useCameraPermissions, CameraType, CameraView } from 'expo-camera';
import { useState, useEffect, useRef } from 'react';

export const useCameraStream = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
        });
        return photo;
      } catch (error) {
        console.error('Failed to take picture:', error);
        throw error;
      }
    }
    return null;
  };

  return {
    permission,
    requestPermission,
    facing,
    toggleCameraFacing,
    cameraRef,
    takePicture,
  };
};

