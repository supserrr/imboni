import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';

export interface CameraComponentRef {
  takePicture: () => Promise<string | undefined>;
}

interface Props {
  onCapture?: (uri: string) => void;
  colors?: any;
  dark?: boolean;
}

const CameraComponent = forwardRef<CameraComponentRef, Props>(({ onCapture, colors, dark }, ref) => {
  const facing: CameraType = 'back';
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { t } = useTranslation();
  
  const styles = createStyles(colors, dark);

  useImperativeHandle(ref, () => ({
    takePicture: async () => {
      if (cameraRef.current) {
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.5,
            base64: true,
            skipProcessing: true, // Faster capture for AI analysis
          });
          if (photo?.uri) {
             onCapture?.(photo.uri);
             return photo.uri;
          }
        } catch (error) {
          console.error('Failed to take picture:', error);
        }
      }
      return undefined;
    },
  }));

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('camera_permission')}</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
    </View>
  );
});

function createStyles(colors: any, dark: boolean) {
  return StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
  },
  message: {
    textAlign: 'center',
      paddingBottom: 20,
    color: '#fff',
      fontSize: 16,
      fontWeight: '500',
  },
  camera: {
    flex: 1,
  },
  button: {
      backgroundColor: colors?.primary || '#5C3A3A',
      paddingVertical: 18,
      borderRadius: 12,
    alignItems: 'center',
      width: '100%',
      maxWidth: 400,
  },
  text: {
      color: colors?.background || '#E8D4E8',
      fontSize: 17,
      fontWeight: '600',
  },
});
}

export default CameraComponent;

