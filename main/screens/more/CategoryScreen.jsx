import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function CategoryScreen({
  currentTheme,
  setScreens,
  libraryDAO,
}) {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const res = await AsyncStorage.getItem('Categories');
      if (res) {
        setCategories(JSON.parse(res));
      } else {
        setCategories(['default']);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function saveCategories(categoriesToSave) {
    try {
      await AsyncStorage.setItem(
        'Categories',
        JSON.stringify(categoriesToSave),
      );
    } catch (error) {
      console.error('Error saving categories:', error);
    }
  }

  async function addCategories() {
    const newCategoryName = findValidName('New Category');
    const updated = [...categories, newCategoryName];
    setCategories(updated);
    await saveCategories(updated);
  }

  function findValidName(name, count = 0) {
    const testName = count === 0 ? name : `${name} ${count}`;
    if (categories.includes(testName)) {
      return findValidName(name, count + 1);
    }
    return testName;
  }

  function showDeleteConfirmation(category) {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category}"?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => removeCategories(category),
          style: 'destructive',
        },
      ],
      { cancelable: false },
    );
  }

  async function removeCategories(removedCategory) {
    const updated = categories.filter(category => category !== removedCategory);
    setCategories(updated);
    await saveCategories(updated);
    await libraryDAO.deleteCollection(removedCategory);
  }

  async function updateCategory(oldName, newName) {
    const trimmedName = newName.trim();

    if (!trimmedName || trimmedName === oldName) {
      setEditingId(null);
      setEditValue('');
      return;
    }

    if (
      categories.some(
        cat =>
          cat.toLowerCase() === trimmedName.toLowerCase() && cat !== oldName,
      )
    ) {
      Alert.alert(
        'Duplicate Name',
        `A category named "${trimmedName}" already exists.`,
        [{ text: 'OK', onPress: () => {} }],
      );
      return;
    }

    const updated = categories.map(cat =>
      cat === oldName ? trimmedName : cat,
    );
    setCategories(updated);

    await saveCategories(updated);

    await libraryDAO.renameCollection(oldName, trimmedName);

    setEditingId(null);
    setEditValue('');
  }
  function startEditing(category) {
    setEditingId(category);
    setEditValue(category);
  }

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme?.backgroundColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme?.textColor,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: currentTheme?.borderColor,
      backgroundColor: currentTheme?.cardBackground,
      gap: 12,
    },
    categoryInput: {
      flex: 1,
      fontSize: 16,
      color: currentTheme?.textColor,
      padding: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: currentTheme?.primaryColor,
      backgroundColor: currentTheme?.inputBackground,
    },
    categoryText: {
      flex: 1,
      fontSize: 16,
      color: currentTheme?.textColor,
      paddingVertical: 8,
    },
    iconButton: {
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 16,
      borderRadius: 8,
      backgroundColor: currentTheme?.primaryColor,
      gap: 8,
    },
    addButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 16,
      color: currentTheme?.secondaryTextColor,
      textAlign: 'center',
    },
  });

  function onBack() {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack}>
            <Icon name="arrow-back" size={24} color={currentTheme?.textColor} />
          </TouchableOpacity>
          <Text style={styles.title}>Manage Categories</Text>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No categories yet. Tap the button below to add one.
            </Text>
          </View>
        ) : (
          categories.map(category => (
            <View key={category} style={styles.categoryItem}>
              {editingId === category ? (
                <>
                  <TextInput
                    style={styles.categoryInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder="Category name"
                    placeholderTextColor={currentTheme?.placeholderColor}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => updateCategory(category, editValue)}
                  >
                    <Icon
                      name="check"
                      size={24}
                      color={currentTheme?.primaryColor}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setEditingId(null);
                      setEditValue('');
                    }}
                  >
                    <Icon
                      name="close"
                      size={24}
                      color={currentTheme?.secondaryTextColor}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.categoryText}>{category}</Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => startEditing(category)}
                  >
                    <Icon
                      name="edit"
                      size={24}
                      color={currentTheme?.textColor}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => showDeleteConfirmation(category)}
                  >
                    <Icon name="delete" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <TouchableOpacity style={styles.addButton} onPress={addCategories}>
          <Icon name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}