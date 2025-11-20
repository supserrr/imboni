import { Modal, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface HelpRequestModalProps {
  visible: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function HelpRequestModal({ visible, onYes, onNo }: HelpRequestModalProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const colorScheme = useColorScheme();
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onNo}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor }]}>
          <Text style={[styles.modalText, { color: textColor }]}>I'm not fully sure. Would you like to connect to a volunteer?</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor }]}
              onPress={onNo}
              accessibilityLabel="No"
              accessibilityRole="button"
            >
              <Text style={[styles.textStyle, { color: textColor }]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor }]}
              onPress={onYes}
              accessibilityLabel="Yes"
              accessibilityRole="button"
            >
              <Text style={[styles.textStyle, { color: textColor }]}>Yes</Text>
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
  textStyle: {
    fontFamily: 'Ubuntu_700Bold',
    textAlign: 'center',
    fontSize: 18,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Ubuntu_700Bold',
  },
});

