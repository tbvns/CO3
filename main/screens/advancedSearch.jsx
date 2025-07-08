import React, {useState, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// --- Data extracted from the AO3 HTML ---

const sortOptions = [
  { label: 'Best Match', value: '_score' },
  { label: 'Creator', value: 'authors_to_sort_on' },
  { label: 'Title', value: 'title_to_sort_on' },
  { label: 'Date Posted', value: 'created_at' },
  { label: 'Date Updated', value: 'revised_at' },
  { label: 'Word Count', value: 'word_count' },
  { label: 'Hits', value: 'hits' },
  { label: 'Kudos', value: 'kudos_count' },
  { label: 'Comments', value: 'comments_count' },
  { label: 'Bookmarks', value: 'bookmarks_count' },
];

const sortDirectionOptions = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' },
];

const ratingOptions = [
  { label: 'Not Rated', value: '9' },
  { label: 'General Audiences', value: '10' },
  { label: 'Teen And Up Audiences', value: '11' },
  { label: 'Mature', value: '12' },
  { label: 'Explicit', value: '13' },
];

const warningOptions = [
  { label: 'Creator Chose Not To Use Archive Warnings', value: '14' },
  { label: 'Graphic Depictions Of Violence', value: '17' },
  { label: 'Major Character Death', value: '18' },
  { label: 'No Archive Warnings Apply', value: '16' },
  { label: 'Rape/Non-Con', value: '19' },
  { label: 'Underage Sex', value: '20' },
];

const categoryOptions = [
  { label: 'F/F', value: '116' },
  { label: 'F/M', value: '22' },
  { label: 'Gen', value: '21' },
  { label: 'M/M', value: '23' },
  { label: 'Multi', value: '2246' },
  { label: 'Other', value: '24' },
];

const crossoverOptions = [
  { label: 'Include crossovers', value: '' },
  { label: 'Exclude crossovers', value: 'F' },
  { label: 'Only crossovers', value: 'T' },
];

const completionOptions = [
  { label: 'All works', value: '' },
  { label: 'Complete works only', value: 'T' },
  { label: 'Works in progress only', value: 'F' },
];

const languageOptions = [
  { label: "Any", value: "" },
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  { label: "Português brasileiro", value: "ptBR" },
  { label: "Português europeu", value: "ptPT" },
  { label: "日本語", value: "ja" },
  { label: "中文-普通话 國語", value: "zh" },
  { label: "한국어", value: "ko" },
  { label: "Русский", value: "ru" },
  { label: "Italiano", value: "it" },
];

// --- Reusable UI Components ---

const FilterSection = ({ title, children, theme, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
      <View style={[styles.sectionContainer, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity onPress={() => setIsOpen(!isOpen)} style={[styles.sectionHeader, { backgroundColor: theme.inputBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{title}</Text>
          <Text style={[styles.sectionToggle, { color: theme.secondaryTextColor }]}>{isOpen ? '−' : '+'}</Text>
        </TouchableOpacity>
        {isOpen && <View style={styles.sectionContent}>{children}</View>}
      </View>
  );
};

const CheckboxGroup = ({ title, options, selected, onSelect, theme }) => {
  const handleToggle = (value) => {
    const newSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
    onSelect(newSelected);
  };

  return (
      <View style={styles.groupContainer}>
        <Text style={[styles.groupTitle, { color: theme.textColor }]}>{title}</Text>
        {options.map((option) => (
            <TouchableOpacity key={option.value} style={styles.checkItem} onPress={() => handleToggle(option.value)}>
              <View style={[styles.checkbox, { borderColor: theme.placeholderColor }, selected.includes(option.value) && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}>
                {selected.includes(option.value) && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={[styles.checkLabel, { color: theme.textColor }]}>{option.label}</Text>
            </TouchableOpacity>
        ))}
      </View>
  );
};

const RadioGroup = ({ title, options, selected, onSelect, theme }) => {
  return (
      <View style={styles.groupContainer}>
        <Text style={[styles.groupTitle, { color: theme.textColor }]}>{title}</Text>
        {options.map(option => (
            <TouchableOpacity key={option.value} style={styles.checkItem} onPress={() => onSelect(option.value)}>
              <View style={[styles.radio, { borderColor: theme.placeholderColor }, selected === option.value && { borderColor: theme.primaryColor }]}>
                {selected === option.value && <View style={[styles.radioInner, { backgroundColor: theme.primaryColor }]} />}
              </View>
              <Text style={[styles.checkLabel, { color: theme.textColor }]}>{option.label}</Text>
            </TouchableOpacity>
        ))}
      </View>
  );
};

const ToggleCheckbox = ({ label, checked, onToggle, theme }) => {
  return (
      <TouchableOpacity style={styles.checkItem} onPress={onToggle}>
        <View style={[styles.checkbox, { borderColor: theme.placeholderColor }, checked && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor }]}>
          {checked && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={[styles.checkLabel, { color: theme.textColor }]}>{label}</Text>
      </TouchableOpacity>
  );
};

// --- Main Advanced Search Screen ---

const AdvancedSearchScreen = ({ currentTheme, onClose, onSearch, savedFilters = {} }) => {
  const [anyField, setAnyField] = useState('');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [date, setDate] = useState('');
  const [completionStatus, setCompletionStatus] = useState('');
  const [crossoverStatus, setCrossoverStatus] = useState('');
  const [singleChapter, setSingleChapter] = useState(false);
  const [wordCount, setWordCount] = useState('');
  const [language, setLanguage] = useState('');

  // Work Tags fields
  const [fandoms, setFandoms] = useState('');
  const [rating, setRating] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [characters, setCharacters] = useState('');
  const [relationships, setRelationships] = useState('');
  const [additionalTags, setAdditionalTags] = useState('');

  // Work Stats fields
  const [hits, setHits] = useState('');
  const [kudos, setKudos] = useState('');
  const [comments, setComments] = useState('');
  const [bookmarks, setBookmarks] = useState('');

  // Search options
  const [sortBy, setSortBy] = useState('revised_at');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      // Parse saved filters and set state
      if (savedFilters['work_search[query]']) setAnyField(savedFilters['work_search[query]']);
      if (savedFilters['work_search[title]']) setTitle(savedFilters['work_search[title]']);
      if (savedFilters['work_search[creators]']) setCreator(savedFilters['work_search[creators]']);
      if (savedFilters['work_search[revised_at]']) setDate(savedFilters['work_search[revised_at]']);
      if (savedFilters['work_search[complete]']) setCompletionStatus(savedFilters['work_search[complete]']);
      if (savedFilters['work_search[crossover]']) setCrossoverStatus(savedFilters['work_search[crossover]']);
      if (savedFilters['work_search[single_chapter]']) setSingleChapter(savedFilters['work_search[single_chapter]'] === '1');
      if (savedFilters['work_search[word_count]']) setWordCount(savedFilters['work_search[word_count]']);
      if (savedFilters['work_search[language_id]']) setLanguage(savedFilters['work_search[language_id]']);
      if (savedFilters['work_search[fandom_names]']) setFandoms(savedFilters['work_search[fandom_names]']);
      if (savedFilters['work_search[rating_ids]']) setRating(savedFilters['work_search[rating_ids]']);
      if (savedFilters['work_search[archive_warning_ids][]']) {
        const warningIds = Array.isArray(savedFilters['work_search[archive_warning_ids][]'])
            ? savedFilters['work_search[archive_warning_ids][]']
            : [savedFilters['work_search[archive_warning_ids][]']];
        setWarnings(warningIds);
      }
      if (savedFilters['work_search[category_ids][]']) {
        const categoryIds = Array.isArray(savedFilters['work_search[category_ids][]'])
            ? savedFilters['work_search[category_ids][]']
            : [savedFilters['work_search[category_ids][]']];
        setCategories(categoryIds);
      }
      if (savedFilters['work_search[character_names]']) setCharacters(savedFilters['work_search[character_names]']);
      if (savedFilters['work_search[relationship_names]']) setRelationships(savedFilters['work_search[relationship_names]']);
      if (savedFilters['work_search[freeform_names]']) setAdditionalTags(savedFilters['work_search[freeform_names]']);
      if (savedFilters['work_search[hits]']) setHits(savedFilters['work_search[hits]']);
      if (savedFilters['work_search[kudos_count]']) setKudos(savedFilters['work_search[kudos_count]']);
      if (savedFilters['work_search[comments_count]']) setComments(savedFilters['work_search[comments_count]']);
      if (savedFilters['work_search[bookmarks_count]']) setBookmarks(savedFilters['work_search[bookmarks_count]']);
      if (savedFilters['work_search[sort_column]']) setSortBy(savedFilters['work_search[sort_column]']);
      if (savedFilters['work_search[sort_direction]']) setSortDirection(savedFilters['work_search[sort_direction]']);
    }
  }, [savedFilters]);

  const handleSearch = useCallback(() => {
    const filters = {};

    // Work Info
    if (anyField) filters['work_search[query]'] = anyField;
    if (title) filters['work_search[title]'] = title;
    if (creator) filters['work_search[creators]'] = creator;
    if (date) filters['work_search[revised_at]'] = date;
    if (completionStatus) filters['work_search[complete]'] = completionStatus;
    if (crossoverStatus) filters['work_search[crossover]'] = crossoverStatus;
    if (singleChapter) filters['work_search[single_chapter]'] = '1';
    if (wordCount) filters['work_search[word_count]'] = wordCount;
    if (language) filters['work_search[language_id]'] = language;

    // Work Tags
    if (fandoms) filters['work_search[fandom_names]'] = fandoms;
    if (rating) filters['work_search[rating_ids]'] = rating;
    if (warnings.length > 0) filters['work_search[archive_warning_ids][]'] = warnings;
    if (categories.length > 0) filters['work_search[category_ids][]'] = categories;
    if (characters) filters['work_search[character_names]'] = characters;
    if (relationships) filters['work_search[relationship_names]'] = relationships;
    if (additionalTags) filters['work_search[freeform_names]'] = additionalTags;

    // Work Stats
    if (hits) filters['work_search[hits]'] = hits;
    if (kudos) filters['work_search[kudos_count]'] = kudos;
    if (comments) filters['work_search[comments_count]'] = comments;
    if (bookmarks) filters['work_search[bookmarks_count]'] = bookmarks;

    // Search options
    filters['work_search[sort_column]'] = sortBy;
    filters['work_search[sort_direction]'] = sortDirection;

    onSearch(filters);
  }, [
    anyField, title, creator, date, completionStatus, crossoverStatus, singleChapter, wordCount, language,
    fandoms, rating, warnings, categories, characters, relationships, additionalTags,
    hits, kudos, comments, bookmarks, sortBy, sortDirection, onSearch
  ]);


  return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
          <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>Work Search</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: currentTheme.primaryColor }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
          <FilterSection title="Work Info" theme={currentTheme} defaultOpen={true}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Any Field</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="Search within all fields"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={anyField}
                  onChangeText={setAnyField}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Title</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="Work title"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={title}
                  onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Creator</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="Author/creator name"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={creator}
                  onChangeText={setCreator}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Date</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >2023-01-01"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={date}
                  onChangeText={setDate}
              />
            </View>

            <RadioGroup title="Completion Status" options={completionOptions} selected={completionStatus} onSelect={setCompletionStatus} theme={currentTheme} />
            <RadioGroup title="Crossovers" options={crossoverOptions} selected={crossoverStatus} onSelect={setCrossoverStatus} theme={currentTheme} />

            <View style={styles.groupContainer}>
              <ToggleCheckbox label="Single Chapter" checked={singleChapter} onToggle={() => setSingleChapter(!singleChapter)} theme={currentTheme} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Word Count</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >1000, 1000-5000"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={wordCount}
                  onChangeText={setWordCount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Language</Text>
              <View style={[styles.pickerContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
                <Picker
                    selectedValue={language}
                    onValueChange={(itemValue) => setLanguage(itemValue)}
                    style={{ color: currentTheme.textColor }}
                    dropdownIconColor={currentTheme.textColor}
                >
                  {languageOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                </Picker>
              </View>
            </View>
          </FilterSection>

          <FilterSection title="Work Tags" theme={currentTheme}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Fandoms</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., Harry Potter, Marvel"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={fandoms}
                  onChangeText={setFandoms}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Rating</Text>
              <View style={[styles.pickerContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
                <Picker
                    selectedValue={rating}
                    onValueChange={(itemValue) => setRating(itemValue)}
                    style={{ color: currentTheme.textColor }}
                    dropdownIconColor={currentTheme.textColor}
                >
                  <Picker.Item label="Any Rating" value="" />
                  {ratingOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                </Picker>
              </View>
            </View>

            <CheckboxGroup title="Warnings" options={warningOptions} selected={warnings} onSelect={setWarnings} theme={currentTheme} />
            <CheckboxGroup title="Categories" options={categoryOptions} selected={categories} onSelect={setCategories} theme={currentTheme} />

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Characters</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., Harry Potter, Hermione Granger"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={characters}
                  onChangeText={setCharacters}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Relationships</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., Harry Potter/Draco Malfoy"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={relationships}
                  onChangeText={setRelationships}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Additional Tags</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., Found Family, Hurt/Comfort"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={additionalTags}
                  onChangeText={setAdditionalTags}
              />
            </View>
          </FilterSection>

          <FilterSection title="Work Stats" theme={currentTheme}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Hits</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >1000"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={hits}
                  onChangeText={setHits}
                  keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Kudos</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >100"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={kudos}
                  onChangeText={setKudos}
                  keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Comments</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >10"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={comments}
                  onChangeText={setComments}
                  keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Bookmarks</Text>
              <TextInput
                  style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
                  placeholder="e.g., >50"
                  placeholderTextColor={currentTheme.placeholderColor}
                  value={bookmarks}
                  onChangeText={setBookmarks}
                  keyboardType="numeric"
              />
            </View>
          </FilterSection>

          <FilterSection title="Search Options" theme={currentTheme} defaultOpen={true}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Sort by</Text>
              <View style={[styles.pickerContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
                <Picker
                    selectedValue={sortBy}
                    onValueChange={(itemValue) => setSortBy(itemValue)}
                    style={{ color: currentTheme.textColor }}
                    dropdownIconColor={currentTheme.textColor}
                >
                  {sortOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>Sort Direction</Text>
              <View style={[styles.pickerContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
                <Picker
                    selectedValue={sortDirection}
                    onValueChange={(itemValue) => setSortDirection(itemValue)}
                    style={{ color: currentTheme.textColor }}
                    dropdownIconColor={currentTheme.textColor}
                >
                  {sortDirectionOptions.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                </Picker>
              </View>
            </View>
          </FilterSection>

          <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.primaryColor }]} onPress={handleSearch}>
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
};

// --- Styles ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center'
  },
  sectionContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionToggle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 12,
  },
  groupContainer: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkLabel: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMark: {
    color: 'white',
    fontWeight: 'bold',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdvancedSearchScreen;