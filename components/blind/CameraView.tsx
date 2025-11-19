import { CameraView as ExpoCameraView } from 'expo-camera';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useCameraStream } from '@/hooks/use-camera-stream';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CameraViewProps {
  onSnap: (base64: string) => void;
  isProcessing: boolean;
}

export default function CameraView({ onSnap, isProcessing }: CameraViewProps) {
  const { permission, requestPermission, facing, toggleCameraFacing, cameraRef, takePicture } = useCameraStream();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', padding: 20 }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
            <Text style={{color: 'white'}}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSnap = async () => {
      if (isProcessing) return;
      const photo = await takePicture();
      if (photo && photo.base64) {
          onSnap(photo.base64);
      }
  };

  return (
    <View style={styles.container}>
      <ExpoCameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <IconSymbol name="arrow.triangle.2.circlepath.camera.fill" size={32} color="white" />
            </TouchableOpacity>
        </View>
        <View style={styles.bottomControls}>
            <TouchableOpacity 
                style={[styles.snapButton, isProcessing && styles.disabledButton]} 
                onPress={handleSnap}
                disabled={isProcessing}
                accessibilityLabel="Take picture"
                accessibilityRole="button"
            >
                {isProcessing ? (
                    <ActivityIndicator color="black" size="large" />
                ) : (
                    <View style={styles.innerSnapButton} />
                )}
            </TouchableOpacity>
        </View>
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
  permissionButton: {
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 8,
      marginTop: 10,
  },
  flipButton: {
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
  },
  snapButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  innerSnapButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'white',
      borderWidth: 2,
      borderColor: 'black',
  },
  disabledButton: {
      opacity: 0.7,
  }
});

