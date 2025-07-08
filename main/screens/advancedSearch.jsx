import React, { useState, useCallback } from 'react';
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

const ratingOptions = [
  { label: 'Not Rated', value: '9' },
  { label: 'General Audiences', value: '10' },
  { label: 'Teen And Up Audiences', value: '11' },
  { label: 'Mature', value: '12' },
  { label: 'Explicit', value: '13' },
];

const warningOptions = [
  { label: 'Creator Chose Not To Use Archive Warnings', value: '14' },
  { label: 'No Archive Warnings Apply', value: '16' },
  { label: 'Graphic Depictions Of Violence', value: '17' },
  { label: 'Major Character Death', value: '18' },
  { label: 'Rape/Non-Con', value: '19' },
  { label: 'Underage', value: '20' },
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
  { label: 'Include Crossovers', value: '' },
  { label: 'Exclude Crossovers', value: 'F' },
  { label: 'Show Only Crossovers', value: 'T' },
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
];

// --- Reusable UI Components ---

const FilterSection = ({ title, children, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
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


// --- Main Advanced Search Screen ---

const AdvancedSearchScreen = ({ currentTheme, onClose, onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('revised_at');
  const [includeRatings, setIncludeRatings] = useState(null);
  const [includeWarnings, setIncludeWarnings] = useState([]);
  const [includeCategories, setIncludeCategories] = useState([]);
  const [otherIncludeTags, setOtherIncludeTags] = useState('');
  const [excludeRatings, setExcludeRatings] = useState(null);
  const [excludeWarnings, setExcludeWarnings] = useState([]);
  const [excludeCategories, setExcludeCategories] = useState([]);
  const [otherExcludeTags, setOtherExcludeTags] = useState('');
  const [completionStatus, setCompletionStatus] = useState('');
  const [crossoverStatus, setCrossoverStatus] = useState('');
  const [wordsFrom, setWordsFrom] = useState('');
  const [wordsTo, setWordsTo] = useState('');
  const [language, setLanguage] = useState('');

  const handleApplyFilters = useCallback(() => {
    const baseURL = 'https://archiveofourown.org/works';
    const params = new URLSearchParams();

    params.append('commit', 'Sort and Filter');
    if (searchQuery) params.append('work_search[query]', searchQuery);
    if (sortBy) params.append('work_search[sort_column]', sortBy);
    if (includeRatings) params.append('work_search[rating_ids][]', includeRatings);
    includeWarnings.forEach(val => params.append('work_search[archive_warning_ids][]', val));
    includeCategories.forEach(val => params.append('work_search[category_ids][]', val));
    if (otherIncludeTags) params.append('work_search[other_tag_names]', otherIncludeTags);
    if (excludeRatings) params.append('exclude_work_search[rating_ids][]', excludeRatings);
    excludeWarnings.forEach(val => params.append('exclude_work_search[archive_warning_ids][]', val));
    excludeCategories.forEach(val => params.append('exclude_work_search[category_ids][]', val));
    if (otherExcludeTags) params.append('work_search[excluded_tag_names]', otherExcludeTags);
    if (completionStatus) params.append('work_search[complete]', completionStatus);
    if (crossoverStatus) params.append('work_search[crossover]', crossoverStatus);
    if (wordsFrom) params.append('work_search[words_from]', wordsFrom);
    if (wordsTo) params.append('work_search[words_to]', wordsTo);
    if (language) params.append('work_search[language_id]', language);

    const url = `${baseURL}?${params.toString()}`;
    onSearch(url);
    onClose();
  }, [
    searchQuery, sortBy, includeRatings, includeWarnings, includeCategories, otherIncludeTags,
    excludeRatings, excludeWarnings, excludeCategories, otherExcludeTags,
    completionStatus, crossoverStatus, wordsFrom, wordsTo, language, onSearch, onClose
  ]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>Advanced Search</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeButton, { color: currentTheme.primaryColor }]}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: currentTheme.textColor }]}>Search within results</Text>
          <TextInput
            style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
            placeholder="e.g., coffee shops, slow burn"
            placeholderTextColor={currentTheme.placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

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

        <FilterSection title="Include" theme={currentTheme}>
          <RadioGroup title="Ratings" options={ratingOptions} selected={includeRatings} onSelect={setIncludeRatings} theme={currentTheme} />
          <CheckboxGroup title="Warnings" options={warningOptions} selected={includeWarnings} onSelect={setIncludeWarnings} theme={currentTheme} />
          <CheckboxGroup title="Categories" options={categoryOptions} selected={includeCategories} onSelect={setIncludeCategories} theme={currentTheme} />
          <Text style={[styles.groupTitle, { color: currentTheme.textColor }]}>Other tags to include</Text>
          <TextInput
            style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
            placeholder="e.g., 'Found Family', 'Hurt/Comfort'"
            placeholderTextColor={currentTheme.placeholderColor}
            value={otherIncludeTags}
            onChangeText={setOtherIncludeTags}
          />
        </FilterSection>

        <FilterSection title="Exclude" theme={currentTheme}>
          <RadioGroup title="Ratings" options={ratingOptions} selected={excludeRatings} onSelect={setExcludeRatings} theme={currentTheme} />
          <CheckboxGroup title="Warnings" options={warningOptions} selected={excludeWarnings} onSelect={setExcludeWarnings} theme={currentTheme} />
          <CheckboxGroup title="Categories" options={categoryOptions} selected={excludeCategories} onSelect={setExcludeCategories} theme={currentTheme} />
          <Text style={[styles.groupTitle, { color: currentTheme.textColor }]}>Other tags to exclude</Text>
          <TextInput
            style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}
            placeholder="e.g., 'Modern AU', 'Angst'"
            placeholderTextColor={currentTheme.placeholderColor}
            value={otherExcludeTags}
            onChangeText={setOtherExcludeTags}
          />
        </FilterSection>

        <FilterSection title="More Options" theme={currentTheme}>
          <RadioGroup title="Completion Status" options={completionOptions} selected={completionStatus} onSelect={setCompletionStatus} theme={currentTheme} />
          <RadioGroup title="Crossover Status" options={crossoverOptions} selected={setCrossoverStatus} onSelect={setCrossoverStatus} theme={currentTheme} />

          <Text style={[styles.groupTitle, { color: currentTheme.textColor }]}>Word Count</Text>
          <View style={styles.rangeContainer}>
            <TextInput style={[styles.input, styles.rangeInput, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="From" value={wordsFrom} onChangeText={setWordsFrom} keyboardType="number-pad" placeholderTextColor={currentTheme.placeholderColor} />
            <TextInput style={[styles.input, styles.rangeInput, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="To" value={wordsTo} onChangeText={setWordsTo} keyboardType="number-pad" placeholderTextColor={currentTheme.placeholderColor} />
          </View>

          <Text style={[styles.groupTitle, { color: currentTheme.textColor }]}>Language</Text>
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
        </FilterSection>

        <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.primaryColor }]} onPress={handleApplyFilters}>
          <Text style={styles.buttonText}>Apply Filters</Text>
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
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 1,
    marginHorizontal: 4,
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
