import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CategorySelectionModal = ({
                                  visible,
                                  categories,
                                  onSelect,
                                  onCancel,
                                  theme,
                                  title = 'Select Collection',
                                }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
            <Text style={[styles.title, { color: theme.textColor }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category, index) => (
              <TouchableOpacity
                key={`${category}-${index}`}
                style={[
                  styles.categoryItem,
                  { borderBottomColor: theme.borderColor },
                  index === categories.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => onSelect(category)}
              >
                <Text style={[styles.categoryText, { color: theme.textColor }]}>
                  {category}
                </Text>
                <Icon
                  name="chevron-right"
                  size={24}
                  color={theme.secondaryTextColor}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.borderColor }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.inputBackground }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textColor }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategorySelectionModal;