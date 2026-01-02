import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  theme,
  confirmText = 'OK',
  onConfirm,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose}>
          <View style={styles.container}>
            <Pressable
              style={[
                styles.alertBox,
                { backgroundColor: theme.cardBackground },
              ]}
              onPress={() => {}}
            >
              <Text style={[styles.title, { color: theme.textColor }]}>
                {title}
              </Text>
              <Text style={[styles.message, { color: theme.textColor }]}>
                {message}
              </Text>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primaryColor }]}
                onPress={handleConfirm}
              >
                <Text style={styles.buttonText}>{confirmText}</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 300,
  },
  alertBox: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomAlert;
