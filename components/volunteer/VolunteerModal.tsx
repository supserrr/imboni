import { Modal, View, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface VolunteerModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function VolunteerModal({ visible, onAccept, onDecline }: VolunteerModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onDecline}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Incoming Request!</Text>
          <Text style={styles.message}>A user needs your visual assistance.</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonDecline]}
              onPress={onDecline}
            >
              <Text style={styles.textStyle}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonAccept]}
              onPress={onAccept}
            >
              <Text style={styles.textStyle}>Accept</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
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
      fontWeight: 'bold',
      marginBottom: 10,
  },
  message: {
      marginBottom: 20,
      textAlign: 'center',
      fontSize: 16,
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
  buttonAccept: {
    backgroundColor: '#34C759',
  },
  buttonDecline: {
    backgroundColor: '#FF3B30',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

