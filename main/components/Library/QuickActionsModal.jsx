import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import CategorySelectionModal from '../WorkScreen/CategorySelectionModal';
import { markForLater } from '../../web/other/markedLater';
import { bookmark } from '../../web/other/bookmarks';

const QuickActionsModal = ({
                             isOpen,
                             onClose,
                             work,
                             theme,
                             libraryDAO,
                             workDAO,
                           }) => {
  const [inLibrary, setInLibrary] = useState(false);
  const [categories, setCategories] = useState(null);
  const [categoryAction, setCategoryAction] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await AsyncStorage.getItem('Categories');
        if (res) {
          const loadedCategories = JSON.parse(res);
          setCategories(
            loadedCategories.includes('Default')
              ? loadedCategories
              : ['Default', ...loadedCategories]
          );
        } else {
          setCategories(['Default']);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories(['Default']);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const checkLibraryStatus = async () => {
      try {
        const isInLib = await libraryDAO.isInLibrary(work.id);
        setInLibrary(isInLib);
      } catch (error) {
        console.error('Error checking library status:', error);
      }
    };
    checkLibraryStatus();
  }, [libraryDAO, work]);

  const showCategorySelection = async (action = 'add') => {
    if (action === 'remove') {
      await libraryDAO.remove(work.id);
      setInLibrary(false);
      return false;
    }

    if (categories.length === 1) {
      await addToLibrary(categories[0]);
      return false;
    }

    setCategoryAction('add');
    setShowCategoryModal(true);
    return true;
  };

  const addToLibrary = async (collection) => {
    try {
      const existingWork = await workDAO.get(work.id);
      if (!existingWork) {
        await workDAO.add(work);
      }

      await libraryDAO.add(work.id, collection);
      setInLibrary(true);
    } catch (error) {
      console.error('Error adding to library:', error);
    }
  };

  const handleAddToLibrary = useCallback(async () => {
    if (inLibrary) {
      return await showCategorySelection('remove');
    } else {
      return await showCategorySelection('add');
    }
  }, [inLibrary, categories]);

  const handleMarkForLater = async () => {
    onClose();
    try {
      await markForLater(work);
      Toast.show({
        type: 'success',
        text1: 'Marked for Later',
        text2: 'Successfully marked this work for later',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Mark for Later',
        text2: error.message || 'An error occurred',
      });
    }
  };

  const handleCategorySelect = async (collection) => {
    setShowCategoryModal(false);
    await addToLibrary(collection);
    onClose();
  };

  const handleBookmark = async () => {
    onClose();
    try {
      await bookmark(work);
      Toast.show({
        type: 'success',
        text1: 'Bookmarked',
        text2: 'Successfully bookmarked this work',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Bookmark',
        text2: error.message || 'An error occurred',
      });
    }
  };

  if (!work) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainerWrapper} pointerEvents="box-none">
          <View style={styles.modalContainer}>
            <View
              style={[styles.modal, { backgroundColor: theme.cardBackground }]}
            >
              <View style={[styles.header, { borderBottomColor: theme.borderColor }]}>
                <Text
                  style={[styles.title, { color: theme.textColor }]}
                  numberOfLines={2}
                >
                  {work.title}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={theme.iconColor} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.primaryColor,
                    },
                  ]}
                  onPress={() => {
                    handleAddToLibrary().then((willShowModal) => {
                      if (willShowModal === false) {
                        onClose();
                      }
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={inLibrary ? "remove" : "add"}
                    size={24}
                    color="white"
                  />
                  <Text style={styles.actionButtonText}>
                    {inLibrary ? "Remove from library" : "Add to Library"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.primaryColor,
                    },
                  ]}
                  onPress={handleMarkForLater}
                  activeOpacity={0.7}
                >
                  <Icon name="schedule" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Mark for Later</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: theme.primaryColor,
                    },
                  ]}
                  onPress={handleBookmark}
                  activeOpacity={0.7}
                >
                  <Icon name="bookmark" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Bookmark</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <CategorySelectionModal
        visible={showCategoryModal}
        categories={categories}
        onSelect={handleCategorySelect}
        onCancel={() => setShowCategoryModal(false)}
        theme={theme}
        title="Add to Collection"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
  },
  modal: {
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default QuickActionsModal;