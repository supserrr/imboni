import { Modal, StyleSheet, View, TouchableOpacity, Text } from 'react-native';

interface HelpRequestModalProps {
  visible: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function HelpRequestModal({ visible, onYes, onNo }: HelpRequestModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onNo}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>I'm not fully sure. Would you like to connect to a volunteer?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onNo}
              accessibilityLabel="No"
              accessibilityRole="button"
            >
              <Text style={styles.textStyle}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonOpen]}
              onPress={onYes}
              accessibilityLabel="Yes"
              accessibilityRole="button"
            >
              <Text style={styles.textStyle}>Yes</Text>
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
  },
  buttonContainer: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 20,
  },
  button: {
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonOpen: {
    backgroundColor: '#007AFF',
  },
  buttonClose: {
    backgroundColor: '#FF3B30',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

