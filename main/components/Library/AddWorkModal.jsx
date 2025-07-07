import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AddWorkModal = ({ isOpen, onClose, onAdd, theme }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    tags: '',
    warnings: '',
    language: 'English',
    image: '',
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      Alert.alert('Error', 'Please fill in at least the title and author');
      return;
    }

    const workData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      warnings: formData.warnings.split(',').map(warning => warning.trim()).filter(warning => warning),
      lastUpdated: new Date().toISOString().split('T')[0],
      likes: 0,
      bookmarks: 0,
      views: 0,
    };

    onAdd(workData);
    setFormData({
      title: '',
      author: '',
      description: '',
      tags: '',
      warnings: '',
      language: 'English',
      image: '',
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.textColor }]}>
                Add New Work
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Title *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.title}
                  onChangeText={(value) => handleInputChange('title', value)}
                  placeholder="Enter book title"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Author *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.author}
                  onChangeText={(value) => handleInputChange('author', value)}
                  placeholder="Enter author name"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Description
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="Enter book description"
                  placeholderTextColor={theme.placeholderColor}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Tags
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.tags}
                  onChangeText={(value) => handleInputChange('tags', value)}
                  placeholder="Enter tags separated by commas"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Warnings
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.warnings}
                  onChangeText={(value) => handleInputChange('warnings', value)}
                  placeholder="Enter warnings separated by commas"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Language
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.language}
                  onChangeText={(value) => handleInputChange('language', value)}
                  placeholder="Enter language"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Image URL
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.textColor,
                      borderColor: theme.borderColor,
                    }
                  ]}
                  value={formData.image}
                  onChangeText={(value) => handleInputChange('image', value)}
                  placeholder="Enter image URL (optional)"
                  placeholderTextColor={theme.placeholderColor}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.borderColor }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primaryColor }]}
                onPress={handleSubmit}
              >
                <Text style={styles.addButtonText}>Add Work</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
  },
  modal: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddWorkModal;
