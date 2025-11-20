import { Modal, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface VolunteerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function VolunteerModal({ visible, onAccept, onDecline }: VolunteerModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Incoming Request!</Text>
          <Text style={[styles.message, { color: textColor }]}>A user needs your visual assistance.</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor }]}
              onPress={onDecline}
            >
              <Text style={[styles.textStyle, { color: textColor }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor }]}
              onPress={onAccept}
            >
              <Text style={[styles.textStyle, { color: textColor }]}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(20, 20, 20, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  title: {
      fontSize: 24,
      fontFamily: 'Ubuntu_700Bold',
      marginBottom: 10,
  },
  message: {
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 16,
      fontFamily: 'Ubuntu_400Regular',
  },
  buttonContainer: {
      flexDirection: 'row',
      gap: 20,
      width: '100%',
      justifyContent: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  textStyle: {
    fontFamily: 'Ubuntu_700Bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

