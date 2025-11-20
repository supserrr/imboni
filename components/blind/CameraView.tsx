import { CameraView as ExpoCameraView, CameraType, PermissionResponse } from 'expo-camera';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RefObject } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CameraViewProps {
  cameraRef: RefObject<ExpoCameraView>;
  facing: CameraType;
  permission: PermissionResponse | null;
  requestPermission: () => Promise<PermissionResponse>;
  toggleCameraFacing: () => void;
  isProcessing: boolean;
  onManualCapture?: () => void;
}

/**
 * Pure presentation component for camera view.
 * All business logic is handled by useVideoSession hook.
 */
export default function CameraView({
  cameraRef,
  facing,
  permission,
  requestPermission,
  toggleCameraFacing,
  isProcessing,
  onManualCapture,
}: CameraViewProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#bf6f4a' : '#141414';
  const snapButtonBg = colorScheme === 'dark' ? '#bf6f4a' : '#141414';
  
  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.permissionText, { color: textColor }]}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[styles.permissionButton, { backgroundColor }]}>
          <Text style={[styles.permissionButtonText, { color: textColor }]}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <IconSymbol name="arrow.triangle.2.circlepath.camera.fill" size={32} color={iconColor} />
          </TouchableOpacity>
        </View>
        {onManualCapture && (
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={[styles.snapButton, { backgroundColor: snapButtonBg }, isProcessing && styles.disabledButton]}
              onPress={onManualCapture}
              disabled={isProcessing}
              accessibilityLabel="Take picture"
              accessibilityRole="button"
            >
              {isProcessing ? (
                <ActivityIndicator color={iconColor} size="large" />
              ) : (
                <View style={[styles.innerSnapButton, { backgroundColor: iconColor }]} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </ExpoCameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
  },
  bottomControls: {
      position: 'absolute',
      bottom: 50,
      width: '100%',
      alignItems: 'center',
      zIndex: 10,
  },
  permissionText: {
    textAlign: 'center',
    padding: 20,
    fontFamily: 'Ubuntu_400Regular',
  },
  permissionButton: {
      padding: 15,
      borderRadius: 8,
      marginTop: 10,
    alignSelf: 'center',
  },
  permissionButtonText: {
    fontFamily: 'Ubuntu_500Medium',
  },
  flipButton: {
    padding: 10,
    backgroundColor: 'rgba(20, 20, 20, 0.3)',
    borderRadius: 20,
  },
  snapButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(20, 20, 20, 0.3)',
  },
  innerSnapButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  disabledButton: {
      opacity: 0.7,
  },
});

