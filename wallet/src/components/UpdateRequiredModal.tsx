import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { getStoreUrl } from '../services/versionCheckService';

interface UpdateRequiredModalProps {
  visible: boolean;
  minVersion: string;
}

export const UpdateRequiredModal: React.FC<UpdateRequiredModalProps> = ({ visible, minVersion }) => {
  const handleUpdate = () => {
    const storeUrl = getStoreUrl();
    Linking.openURL(storeUrl);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent closing the modal
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Update Required</Text>
          <Text style={styles.message}>
            Please update your app to version {minVersion} or higher to continue using the application.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#0D0D0D',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#CCCCCC',
  },
  button: {
    backgroundColor: '#5C1EE0', // Purple color matching the app's theme
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 