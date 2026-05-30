import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomDropdown from '../components/common/CustomDropdown';
import {
  pushJsonPreset,
  getAllPresets,
  removePreset,
  containsPreset,
  setTempPreset,
  getTempPreset,
} from '../storage/jsonSearches';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AO3_BASE_URL = 'https://archiveofourown.org/autocomplete';

/**
 * Debounce function to limit how often a function is called.
 */
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Fetches autocomplete suggestions from the AO3 API.
 * @param {string} type - The type of tag to search for (e.g., 'fandom', 'character').
 * @param {string} term - The search term.
 * @returns {Promise<Array>} A promise that resolves to an array of suggestions.
 */
const fetchAutocompleteSuggestions = async (type, term) => {
  if (!term || term.length < 2) {
    return [];
  }
  const validTypes = ['character', 'relationship', 'freeform', 'fandom'];
  if (!validTypes.includes(type)) {
    console.error(`Invalid autocomplete type: ${type}`);
    return [];
  }
  try {
    const url = `${AO3_BASE_URL}/${type}?term=${encodeURIComponent(term)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(item => ({ id: item.id, name: item.name })) : [];
  } catch (error) {
    console.error(`Error fetching ${type} autocomplete:`, error);
    return [];
  }
};

export const fetchFandomSuggestions = (term) => fetchAutocompleteSuggestions('fandom', term);
export const fetchCharacterSuggestions = (term) => fetchAutocompleteSuggestions('character', term);
export const fetchRelationshipSuggestions = (term) => fetchAutocompleteSuggestions('relationship', term);
export const fetchFreeformSuggestions = (term) => fetchAutocompleteSuggestions('freeform', term);

/**
 * A reusable component for text inputs with autocomplete and tag-style multi-selection.
 */
const AutocompleteInput = ({ label, placeholder, fetchSuggestions, selectedItems, onItemsChange, theme, redText = false }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the fetch function to avoid excessive API calls
  const debouncedFetch = useMemo(() => debounce(async (term) => {
    if (term) {
      setLoading(true);
      const result = await fetchSuggestions(term);
      setSuggestions(result);
      setLoading(false);
    } else {
      setSuggestions([]);
    }
  }, 300), [fetchSuggestions]);

  const handleInputChange = (text) => {
    setInputValue(text);
    debouncedFetch(text);
  };

  const addItem = (item) => {
    // Avoid adding duplicates
    if (!selectedItems.find(selected => selected.name.toLowerCase() === item.name.toLowerCase())) {
      onItemsChange([...selectedItems, item]);
    }
    setInputValue('');
    setSuggestions([]);
  }

  const handleSelectSuggestion = (item) => {
    addItem(item);
  };

  const handleRemoveItem = (itemToRemove) => {
    onItemsChange(selectedItems.filter(item => item.id !== itemToRemove.id));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      const newItem = { id: `custom-${inputValue.trim()}`, name: inputValue.trim() };
      addItem(newItem);
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: theme.textColor }]}>{label}</Text>
      <View style={[styles.autocompleteContainer, { borderColor: theme.borderColor, backgroundColor: theme.inputBackground }, isFocused && { borderColor: theme.primaryColor, borderWidth: 1.5 }]}>
        <View style={styles.tagsContainer}>
          {selectedItems.map(item => (
            <View key={item.id} style={[styles.tag, { backgroundColor: theme.primaryColor }]}>
              <Text style={[styles.tagText, redText && {color: theme.secondaryTextColor}]}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveItem(item)} style={styles.tagDelete}>
                <Text style={[styles.tagDeleteText, redText && {color: theme.secondaryTextColor}]}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TextInput
          style={[styles.autocompleteInput, { color: theme.textColor }]}
          placeholder={selectedItems.length === 0 ? placeholder : ''}
          placeholderTextColor={theme.placeholderColor}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {loading && <ActivityIndicator size="small" color={theme.primaryColor} style={{ marginTop: 8 }} />}
      {isFocused && suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { borderColor: theme.borderColor, backgroundColor: theme.cardBackground }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsScrollView}
            nestedScrollEnabled={true}
          >
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={{ color: theme.textColor }}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};


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

const sortOptions = [ { label: 'Best Match', value: '_score' }, { label: 'Creator', value: 'authors_to_sort_on' }, { label: 'Title', value: 'title_to_sort_on' }, { label: 'Date Posted', value: 'created_at' }, { label: 'Date Updated', value: 'revised_at' }, { label: 'Word Count', value: 'word_count' }, { label: 'Hits', value: 'hits' }, { label: 'Kudos', value: 'kudos_count' }, { label: 'Comments', value: 'comments_count' }, { label: 'Bookmarks', value: 'bookmarks_count' }, ];
const sortDirectionOptions = [ { label: 'Ascending', value: 'asc' }, { label: 'Descending', value: 'desc' }, ];
const ratingOptions = [ { label: 'Not Rated', value: '9' }, { label: 'General Audiences', value: '10' }, { label: 'Teen And Up Audiences', value: '11' }, { label: 'Mature', value: '12' }, { label: 'Explicit', value: '13' }, ];
const warningOptions = [ { label: 'Creator Chose Not To Use Archive Warnings', value: '14' }, { label: 'Graphic Depictions Of Violence', value: '17' }, { label: 'Major Character Death', value: '18' }, { label: 'No Archive Warnings Apply', value: '16' }, { label: 'Rape/Non-Con', value: '19' }, { label: 'Underage Sex', value: '20' }, ];
const categoryOptions = [ { label: 'F/F', value: '116' }, { label: 'F/M', value: '22' }, { label: 'Gen', value: '21' }, { label: 'M/M', value: '23' }, { label: 'Multi', value: '2246' }, { label: 'Other', value: '24' }, ];
const crossoverOptions = [ { label: 'Include crossovers', value: '' }, { label: 'Exclude crossovers', value: 'F' }, { label: 'Only crossovers', value: 'T' }, ];
const excludeRatingOptions = [ { label: 'Not Rated', value: 'Not Rated' }, { label: 'General Audiences', value: 'General Audiences' }, { label: 'Teen And Up Audiences', value: 'Teen And Up Audiences' }, { label: 'Mature', value: 'Mature' }, { label: 'Explicit', value: 'Explicit' }, ];
const excludeWarningOptions = [ { label: 'Creator Chose Not To Use Archive Warnings', value: 'Creator Chose Not To Use Archive Warnings' }, { label: 'Graphic Depictions Of Violence', value: 'Graphic Depictions Of Violence' }, { label: 'Major Character Death', value: 'Major Character Death' }, { label: 'No Archive Warnings Apply', value: 'No Archive Warnings Apply' }, { label: 'Rape/Non-Con', value: 'Rape/Non-Con' }, { label: 'Underage Sex', value: 'Underage Sex' }, ];
const completionOptions = [ { label: 'All works', value: '' }, { label: 'Complete works only', value: 'T' }, { label: 'Works in progress only', value: 'F' }, ];
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
  { label: "العربية", value: "ar" },
  { label: "Nederlands", value: "nl" },
  { label: "Polski", value: "pl" },
  { label: "Türkçe", value: "tr" },
  { label: "Tiếng Việt", value: "vi" },
  { label: "Bahasa Indonesia", value: "id" },
  { label: "ไทย", value: "th" },
  { label: "فارسی", value: "fa" },
  { label: "עברית", value: "he" },
  { label: "हिन्दी", value: "hi" },
  { label: "বাংলা", value: "bn" },
  { label: "Filipino", value: "fil" },
  { label: "українська", value: "uk" },
  { label: "ελληνικά", value: "el" },
  { label: "Română", value: "ro" },
  { label: "magyar", value: "hu" },
  { label: "Svenska", value: "sv" },
  { label: "Čeština", value: "cs" },
  { label: "Dansk", value: "da" },
  { label: "suomi", value: "fi" },
  { label: "Norsk", value: "no" },
  { label: "Bahasa Malaysia", value: "ms" },
  { label: "Hrvatski", value: "hr" },
  { label: "Català", value: "ca" },
  { label: "Eesti", value: "et" },
  { label: "Slovenčina", value: "sk" },
  { label: "Afrikaans", value: "afr" },
  { label: "Български", value: "bg" },
  { label: "Latviešu", value: "lv" },
  { label: "Lietuvių", value: "lt" },
  { label: "Slovenščina", value: "slv" },
  { label: "Srpski", value: "sr" },
  { label: "Kiswahili", value: "sw" },
  { label: "Kurdî", value: "ku" },
  { label: "اردو", value: "urd" },
  { label: "தமிழ்", value: "ta" },
  { label: "తెలుగు", value: "tel" },
  { label: "ਪੰਜਾਬੀ", value: "pa" },
  { label: "മലയാളം", value: "ml" },
  { label: "ქართული", value: "kat" },
  { label: "հայերեն", value: "hy" },
  { label: "Kreyòl ayisyen", value: "ht" },
  { label: "Gaeilge", value: "ga" },
  { label: "Cymraeg", value: "cy" },
  { label: "Asturianu", value: "ast" },
  { label: "Euskara", value: "eu" },
  { label: "Galego", value: "gl" },
  { label: "Brezhoneg", value: "br" },
  { label: "Esperanto", value: "eo" },
  { label: "American Sign Language", value: "ase" },
  { label: "British Sign Language", value: "bfi" },
  { label: "Langue des signes québécoise", value: "fcs" },
  { label: "中文-广东话 粵語", value: "yue" },
  { label: "中文-闽南话 臺語", value: "nan" },
  { label: "中文-客家话", value: "hak" },
  { label: "中文-吴语", value: "wuu" },
  { label: "ʻŌlelo Hawaiʻi", value: "haw" },
  { label: "te reo Māori", value: "mri" },
  { label: "Chinuk Wawa", value: "chn" },
  { label: "Anishinaabemowin", value: "oji" },
  { label: "Diné bizaad", value: "nav" },
  { label: "Lingua latina", value: "la" },
  { label: "Eald Englisċ", value: "ang" },
  { label: "tlhIngan-Hol", value: "tlh" },
  { label: "Quenya", value: "qya" },
  { label: "Sindarin", value: "sjn" },
  { label: "toki pona", value: "tok" },
  { label: "Volapük", value: "vol" },
  { label: "af Soomaali", value: "so" },
  { label: "Aynu itak | アイヌ イタㇰ", value: "ain" },
  { label: "𒀝𒅗𒁺𒌑", value: "akk" },
  { label: "አማርኛ", value: "amh" },
  { label: "𓂋𓏺𓈖 𓆎𓅓𓏏𓊖", value: "egy" },
  { label: "ܐܪܡܝܐ | ארמיא", value: "arc" },
  { label: "Azərbaycan dili | آذربایجان دیلی", value: "azj" },
  { label: "Basa Jawa", value: "jv" },
  { label: "Башҡорт теле", value: "ba" },
  { label: "беларуская", value: "be" },
  { label: "Boarisch", value: "bar" },
  { label: "Bosanski", value: "bos" },
  { label: "Буряад хэлэн | ᠪᠤᠷᠢᠶᠠᠳ ᠮᠣᠩᠭᠣᠯ ᠬᠡᠯᠡ", value: "bua" },
  { label: "Cebuano", value: "ceb" },
  { label: "къырымтатар тили | qırımtatar tili", value: "crh" },
  { label: "Creolese", value: "gyn" },
  { label: "Hausa | هَرْشَن هَوْسَ", value: "hau" },
  { label: "Interlingua", value: "ia" },
  { label: "isiZulu", value: "zu" },
  { label: "Íslenska", value: "is" },
  { label: "Kalaallisut", value: "kal" },
  { label: "Хальмг Өөрдин келн", value: "xal" },
  { label: "ಕನ್ನಡ", value: "kan" },
  { label: "Kernewek", value: "cor" },
  { label: "ភាសាខ្មែរ", value: "khm" },
  { label: "Khuzdul", value: "qkz" },
  { label: "Кыргызча", value: "kir" },
  { label: "Lëtzebuergesch", value: "lb" },
  { label: "македонски", value: "mk" },
  { label: "Malti", value: "mt" },
  { label: "ᠮᠠᠨᠵᡠ ᡤᡳᠰᡠᠨ", value: "mnc" },
  { label: "Mando'a", value: "qmd" },
  { label: "मराठी", value: "mr" },
  { label: "Mikisúkî", value: "mik" },
  { label: "ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ᠌ | Монгол Кирилл үсэг", value: "mon" },
  { label: "မြန်မာဘာသာ", value: "my" },
  { label: "Эрзянь кель", value: "myv" },
  { label: "Nāhuatl", value: "nah" },
  { label: "Nawat", value: "ppl" },
  { label: "Нохчийн мотт", value: "ce" },
  { label: "O’odham Ñiok", value: "ood" },
  { label: "لسان عثمانى", value: "ota" },
  { label: "پښتو", value: "ps" },
  { label: "Plattdüütsch", value: "nds" },
  { label: "Pulaar", value: "fuc" },
  { label: "qazaqşa | қазақша", value: "kaz" },
  { label: "Uncategorized Constructed Languages", value: "qlq" },
  { label: "RRomani Ćhib", value: "rom" },
  { label: "Sámi", value: "smi" },
  { label: "саха тыла", value: "sah" },
  { label: "Scots", value: "sco" },
  { label: "Shqip", value: "sq" },
  { label: "සිංහල", value: "si" },
  { label: "Slověnьskъ Językъ", value: "sla" },
  { label: "Sprēkō Þiudiskō", value: "gem" },
  { label: "татар теле", value: "tat" },
  { label: "ትግርኛ", value: "tir" },
  { label: "Thermian", value: "tqx" },
  { label: "བོད་སྐད་", value: "bod" },
  { label: "ϯⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ", value: "cop" },
  { label: "Trinidadian Creole", value: "trf" },
  { label: "τσακώνικα", value: "tsd" },
  { label: "ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ", value: "chr" },
  { label: "Unangam Tunuu", value: "ale" },
  { label: "ئۇيغۇر تىلى", value: "uig" },
  { label: "יידיש", value: "yi" },
  { label: "maayaʼ tʼàan", value: "yua" },
  { label: "𒅴𒂠", value: "sux" },
  { label: "𐌲𐌿𐍄𐌹𐍃𐌺𐌰", value: "got" },
  { label: "Furlan", value: "fur" },
  { label: "Friisk", value: "frr" },
  { label: "Frysk", value: "fry" },
  { label: "Gàidhlig", value: "gd" },
  { label: "Finuʼ Chamorro", value: "cha" }
];

const AdvancedSearchScreen = ({ currentTheme, onClose, onSearch, savedFilters = {}, tagMode = { active: false, tagName: null } }) => {
  const stringToItems = (str) => str ? str.split(',').map((name, index) => ({ id: `${name}-${index}`, name: name.trim() })) : [];


  const [canonicalTagDismissed, setCanonicalTagDismissed] = useState(false);

  const activeCanonicalTag = canonicalTagDismissed
    ? null
    : (tagMode.active ? tagMode.tagName : null);

  const [presets, setPresets] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const [presetName, setPresetName] = useState();
  const [presetExists, setPresetExists] = useState();

  useEffect(() => {
    containsPreset(presetName).then(setPresetExists);
  }, [presetName])

  const [anyField, setAnyField] = useState(savedFilters['work_search[query]'] || '');
  const [title, setTitle] = useState(savedFilters['work_search[title]'] || '');
  const [creator, setCreator] = useState(savedFilters['work_search[creators]'] || '');
  const [date, setDate] = useState(savedFilters['work_search[revised_at]'] || '');
  const [completionStatus, setCompletionStatus] = useState(savedFilters['work_search[complete]'] || '');
  const [crossoverStatus, setCrossoverStatus] = useState(savedFilters['work_search[crossover]'] || '');
  const [singleChapter, setSingleChapter] = useState(savedFilters['work_search[single_chapter]'] === '1');
  const [wordCount, setWordCount] = useState(savedFilters['work_search[word_count]'] || '');
  const [language, setLanguage] = useState(savedFilters['work_search[language_id]'] || '');

  const [fandoms, setFandoms] = useState(stringToItems(savedFilters['work_search[fandom_names]']));
  const [rating, setRating] = useState(savedFilters['work_search[rating_ids]'] || '');
  const [warnings, setWarnings] = useState(savedFilters['work_search[archive_warning_ids][]'] || []);
  const [categories, setCategories] = useState(savedFilters['work_search[category_ids][]'] || []);
  const [characters, setCharacters] = useState(stringToItems(savedFilters['work_search[character_names]']));
  const [relationships, setRelationships] = useState(stringToItems(savedFilters['work_search[relationship_names]']));
  const [additionalTags, setAdditionalTags] = useState(stringToItems(savedFilters['work_search[freeform_names]']));

  const [excludedFandoms, setExcludedFandoms] = useState([]);
  const [excludedCharacters, setExcludedCharacters] = useState([]);
  const [excludedRelationships, setExcludedRelationships] = useState([]);
  const [excludedAdditionalTags, setExcludedAdditionalTags] = useState(stringToItems(savedFilters['work_search[excluded_tag_names]']));
  const [excludedRatings, setExcludedRatings] = useState([]);
  const [excludedWarnings, setExcludedWarnings] = useState([]);

  const [hits, setHits] = useState(savedFilters['work_search[hits]'] || '');
  const [kudos, setKudos] = useState(savedFilters['work_search[kudos_count]'] || '');
  const [comments, setComments] = useState(savedFilters['work_search[comments_count]'] || '');
  const [bookmarks, setBookmarks] = useState(savedFilters['work_search[bookmarks_count]'] || '');

  const [sortBy, setSortBy] = useState(savedFilters['work_search[sort_column]'] || 'revised_at');
  const [sortDirection, setSortDirection] = useState(savedFilters['work_search[sort_direction]'] || 'desc');

  useEffect(() => {
    if ( //This is fucking bad but it works really well so i'm not changing it
      anyField !== '' ||
      title !== '' ||
      creator !== '' ||
      date !== '' ||
      completionStatus !== '' ||
      crossoverStatus !== '' ||
      singleChapter !== false ||
      wordCount !== '' ||
      language !== '' ||
      fandoms.length !== 0 ||
      rating !== '' ||
      warnings.length !== 0 ||
      categories.length !== 0 ||
      characters.length !== 0 ||
      relationships.length !== 0 ||
      additionalTags.length !== 0 ||
      excludedFandoms.length !== 0 ||
      excludedCharacters.length !== 0 ||
      excludedRelationships.length !== 0 ||
      excludedAdditionalTags.length !== 0 ||
      excludedRatings.length !== 0 ||
      excludedWarnings.length !== 0 ||
      hits !== '' ||
      kudos !== '' ||
      comments !== '' ||
      bookmarks !== '' ||
      sortBy !== 'revised_at' ||
      sortDirection !== 'desc'
    ) {
      console.log("Filters applied, skipping loading temporary preset");
    } else {
      loadTempPreset();
    }
    loadPresetsFromStorage();
  }, []);

  const loadPresetsFromStorage = async () => {
    try {
      const loadedPresets = await getAllPresets();
      setPresets(loadedPresets);
      console.log(loadedPresets);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const handleSearch = useCallback(() => {
    const filters = {};
    const itemsToString = (items) => items.map(item => item.name).join(',');

    saveTempPreset();

    if (anyField) filters['work_search[query]'] = anyField;
    if (title) filters['work_search[title]'] = title;
    if (creator) filters['work_search[creators]'] = creator;
    if (date) filters['work_search[revised_at]'] = date;
    if (completionStatus) filters['work_search[complete]'] = completionStatus;
    if (crossoverStatus) filters['work_search[crossover]'] = crossoverStatus;
    if (singleChapter) filters['work_search[single_chapter]'] = '1';
    if (wordCount) filters['work_search[word_count]'] = wordCount;
    if (language) filters['work_search[language_id]'] = language;

    if (fandoms.length > 0) filters['work_search[fandom_names]'] = itemsToString(fandoms);
    if (rating) filters['work_search[rating_ids]'] = rating;
    if (warnings.length > 0) filters['work_search[archive_warning_ids][]'] = warnings;
    if (categories.length > 0) filters['work_search[category_ids][]'] = categories;
    if (characters.length > 0) filters['work_search[character_names]'] = itemsToString(characters);
    if (relationships.length > 0) filters['work_search[relationship_names]'] = itemsToString(relationships);
    if (additionalTags.length > 0) filters['work_search[freeform_names]'] = itemsToString(additionalTags);

    const allExcluded = [
      ...excludedFandoms,
      ...excludedCharacters,
      ...excludedRelationships,
      ...excludedAdditionalTags,
      ...excludedRatings.map(name => ({ name })),
      ...excludedWarnings.map(name => ({ name })),
    ];
    if (allExcluded.length > 0) filters['work_search[excluded_tag_names]'] = itemsToString(allExcluded);

    if (hits) filters['work_search[hits]'] = hits;
    if (kudos) filters['work_search[kudos_count]'] = kudos;
    if (comments) filters['work_search[comments_count]'] = comments;
    if (bookmarks) filters['work_search[bookmarks_count]'] = bookmarks;

    filters['work_search[sort_column]'] = sortBy;
    filters['work_search[sort_direction]'] = sortDirection;

    onSearch(filters, activeCanonicalTag);
  }, [
    anyField, title, creator, date, completionStatus, crossoverStatus, singleChapter, wordCount, language,
    fandoms, rating, warnings, categories, characters, relationships, additionalTags,
    excludedFandoms, excludedCharacters, excludedRelationships, excludedAdditionalTags, excludedRatings, excludedWarnings,
    hits, kudos, comments, bookmarks, sortBy, sortDirection, onSearch, tagMode, activeCanonicalTag
  ]);

  async function savePreset(name) {
    if (!name.trim()) {
      return;
    }

    const newPreset = {
      name: name,
      timestamp: Date.now(),
      preset: {
        anyField, title, creator, date, completionStatus, crossoverStatus,
        singleChapter, wordCount, language,
        fandoms, rating, warnings, categories, characters,
        relationships, additionalTags,
        excludedFandoms, excludedCharacters, excludedRelationships, excludedAdditionalTags, excludedRatings, excludedWarnings,
        hits, kudos, comments, bookmarks,
        sortBy, sortDirection,
        canonicalTagName: activeCanonicalTag,
      },
    };

    await pushJsonPreset(newPreset);
    await loadPresetsFromStorage();
  }

  async function saveTempPreset() {
    const newPreset = {
      timestamp: Date.now(),
      preset: {
        anyField, title, creator, date, completionStatus, crossoverStatus,
        singleChapter, wordCount, language,
        fandoms, rating, warnings, categories, characters,
        relationships, additionalTags,
        excludedFandoms, excludedCharacters, excludedRelationships, excludedAdditionalTags, excludedRatings, excludedWarnings,
        hits, kudos, comments, bookmarks,
        sortBy, sortDirection,
        canonicalTagName: activeCanonicalTag,
      },
    };

    await setTempPreset(newPreset);
  }

  async function loadTempPreset() {
    const presetToLoad = await getTempPreset();
    setAnyField(presetToLoad.preset.anyField);
    setTitle(presetToLoad.preset.title);
    setCreator(presetToLoad.preset.creator);
    setDate(presetToLoad.preset.date);
    setCompletionStatus(presetToLoad.preset.completionStatus);
    setCrossoverStatus(presetToLoad.preset.crossoverStatus);
    setSingleChapter(presetToLoad.preset.singleChapter);
    setWordCount(presetToLoad.preset.wordCount);
    setLanguage(presetToLoad.preset.language);

    setFandoms(presetToLoad.preset.fandoms);
    setRating(presetToLoad.preset.rating);
    setWarnings(presetToLoad.preset.warnings);
    setCategories(presetToLoad.preset.categories);
    setCharacters(presetToLoad.preset.characters);
    setRelationships(presetToLoad.preset.relationships);
    setAdditionalTags(presetToLoad.preset.additionalTags);
    setExcludedFandoms(presetToLoad.preset.excludedFandoms || []);
    setExcludedCharacters(presetToLoad.preset.excludedCharacters || []);
    setExcludedRelationships(presetToLoad.preset.excludedRelationships || []);
    setExcludedAdditionalTags(presetToLoad.preset.excludedAdditionalTags || presetToLoad.preset.excludedTags || []);
    setExcludedRatings(presetToLoad.preset.excludedRatings || []);
    setExcludedWarnings(presetToLoad.preset.excludedWarnings || []);
    setRestoredCanonicalTag(presetToLoad.preset.canonicalTagName || null);

    setHits(presetToLoad.preset.hits);
    setKudos(presetToLoad.preset.kudos);
    setComments(presetToLoad.preset.comments);
    setBookmarks(presetToLoad.preset.bookmarks);
    setSortBy(presetToLoad.preset.sortBy);
    setSortDirection(presetToLoad.preset.sortDirection);

    setPresetName(presetToLoad.name)
  }

  function loadPreset(presetToLoad) {
    setAnyField(presetToLoad.preset.anyField);
    setTitle(presetToLoad.preset.title);
    setCreator(presetToLoad.preset.creator);
    setDate(presetToLoad.preset.date);
    setCompletionStatus(presetToLoad.preset.completionStatus);
    setCrossoverStatus(presetToLoad.preset.crossoverStatus);
    setSingleChapter(presetToLoad.preset.singleChapter);
    setWordCount(presetToLoad.preset.wordCount);
    setLanguage(presetToLoad.preset.language);

    setFandoms(presetToLoad.preset.fandoms);
    setRating(presetToLoad.preset.rating);
    setWarnings(presetToLoad.preset.warnings);
    setCategories(presetToLoad.preset.categories);
    setCharacters(presetToLoad.preset.characters);
    setRelationships(presetToLoad.preset.relationships);
    setAdditionalTags(presetToLoad.preset.additionalTags);
    setExcludedFandoms(presetToLoad.preset.excludedFandoms || []);
    setExcludedCharacters(presetToLoad.preset.excludedCharacters || []);
    setExcludedRelationships(presetToLoad.preset.excludedRelationships || []);
    setExcludedAdditionalTags(presetToLoad.preset.excludedAdditionalTags || presetToLoad.preset.excludedTags || []);
    setExcludedRatings(presetToLoad.preset.excludedRatings || []);
    setExcludedWarnings(presetToLoad.preset.excludedWarnings || []);
    setRestoredCanonicalTag(presetToLoad.preset.canonicalTagName || null);

    setHits(presetToLoad.preset.hits);
    setKudos(presetToLoad.preset.kudos);
    setComments(presetToLoad.preset.comments);
    setBookmarks(presetToLoad.preset.bookmarks);
    setSortBy(presetToLoad.preset.sortBy);
    setSortDirection(presetToLoad.preset.sortDirection);

    setPresetName(presetToLoad.name)
  }


  const deletePreset = async (index) => {
    await removePreset(index);
    await loadPresetsFromStorage();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.backgroundColor }]}>

      {/* Add preset modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal}
        onRequestClose={() => {
          setShowAddModal(!showAddModal);
        }}
      >
        <View style={styles.modal}>
          <View style={[styles.modalBg, { backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.borderColor }]}>
            <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
              <Text style={[styles.headerTitle,  { color: currentTheme.textColor }]}>Save preset</Text>
              <TouchableOpacity onPress={() => {setShowAddModal(false)}}>
                <Icon style={[styles.icon, { color: currentTheme.iconColor }]} name={"close"} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: currentTheme.textColor }]}>Preset name</Text>
                <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="Enter preset name" placeholderTextColor={currentTheme.placeholderColor} value={presetName} onChangeText={setPresetName} />
              </View>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: currentTheme.primaryColor }]} onPress={() => {savePreset(presetName); setShowAddModal(false)}}>
                <Text style={styles.buttonText}>{presetExists ? "Update" : "Add"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preset modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPresetModal}
        onRequestClose={() => {
          setShowPresetModal(!showAddModal);
        }}
      >
        <View style={styles.modal}>
          <View style={[styles.modalBg, { backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.borderColor }]}>
            <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
              <Text style={[styles.headerTitle,  { color: currentTheme.textColor }]}>Preset</Text>
              <TouchableOpacity onPress={() => {setShowPresetModal(false)}}>
                <Icon style={[styles.icon, { color: currentTheme.iconColor }]} name={"close"} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <ScrollView>
                {presets.map((p, index) =>
                  <TouchableOpacity onPress={() => {loadPreset(presets[index]); setShowPresetModal(false)}}>
                    <View key={index} style={[styles.modalPresetObject, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
                      <Text style={[{ color: currentTheme.textColor }]} >{p.name}</Text>
                      <TouchableOpacity onPress={() => {deletePreset(index)}}>
                        <Icon style={[styles.iconDelete, { color: currentTheme.warningTextColor }]} name={"delete"} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}

                {presets.length == 0 ? <Text style={[{ color: currentTheme.textColor }]} >You don't have any preset yet !</Text> : null}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>Work Search</Text>
        <TouchableOpacity onPress={() => setShowPresetModal(true)}>
          <Text style={[styles.closeButton, { color: currentTheme.primaryColor }]}>Presets</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setShowAddModal(true);
        }}>
          <Text style={[styles.closeButton, { color: currentTheme.primaryColor }]}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={[styles.closeButton, { color: currentTheme.primaryColor }]}>Close</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {activeCanonicalTag ? (
          <View style={[styles.canonicalTagBanner, { backgroundColor: currentTheme.primaryColor + '22', borderColor: currentTheme.primaryColor }]}>
            <Icon name="local-offer" size={14} style={{ color: currentTheme.primaryColor, marginRight: 6 }} />
            <Text style={[styles.canonicalTagBannerText, { color: currentTheme.primaryColor, flex: 1 }]}>
              Browsing canonical tag: <Text style={{ fontWeight: 'bold' }}>{activeCanonicalTag}</Text>
            </Text>
            <TouchableOpacity onPress={() => setCanonicalTagDismissed(true)} style={styles.canonicalTagDismiss}>
              <Icon name="close" size={14} style={{ color: currentTheme.primaryColor }} />
            </TouchableOpacity>
          </View>
        ) :
          <View style={[styles.canonicalTagBanner, { backgroundColor: currentTheme.warningMessageBackground, borderColor: currentTheme.warningMessageTextColor }]}>
            <Icon name="local-offer" size={14} style={{ color: currentTheme.warningMessageTextColor, marginRight: 6 }} />
            <Text style={[styles.canonicalTagBannerText, { color: currentTheme.warningMessageTextColor, flex: 1 }]}>
              No canonical tag where provided. Excludes won't be available.
            </Text>
          </View>
        }

        <FilterSection title="Work Info" theme={currentTheme} defaultOpen={true}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Any Field</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="Search within all fields" placeholderTextColor={currentTheme.placeholderColor} value={anyField} onChangeText={setAnyField} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Title</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="Work title" placeholderTextColor={currentTheme.placeholderColor} value={title} onChangeText={setTitle} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Creator</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="Author/creator name" placeholderTextColor={currentTheme.placeholderColor} value={creator} onChangeText={setCreator} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Date</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >2023-01-01" placeholderTextColor={currentTheme.placeholderColor} value={date} onChangeText={setDate} />
          </View>
          <RadioGroup title="Completion Status" options={completionOptions} selected={completionStatus} onSelect={setCompletionStatus} theme={currentTheme} />
          <RadioGroup title="Crossovers" options={crossoverOptions} selected={crossoverStatus} onSelect={setCrossoverStatus} theme={currentTheme} />
          <View style={styles.groupContainer}>
            <ToggleCheckbox label="Single Chapter" checked={singleChapter} onToggle={() => setSingleChapter(!singleChapter)} theme={currentTheme} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Word Count</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >1000, 1000-5000" placeholderTextColor={currentTheme.placeholderColor} value={wordCount} onChangeText={setWordCount} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Language</Text>
            <View style={[styles.CustomDropdownContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
              <CustomDropdown theme={currentTheme} selectedValue={language} onValueChange={(itemValue) => setLanguage(itemValue)} style={{ color: currentTheme.textColor }} dropdownIconColor={currentTheme.textColor}>
                {languageOptions.map(opt => <CustomDropdown.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </CustomDropdown>
            </View>
          </View>
        </FilterSection>

        <FilterSection title="Work Tags" theme={currentTheme}>
          <AutocompleteInput
            label="Fandoms"
            placeholder="e.g., Harry Potter, Marvel"
            fetchSuggestions={fetchFandomSuggestions}
            selectedItems={fandoms}
            onItemsChange={setFandoms}
            theme={currentTheme}
          />
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Rating</Text>
            <View style={[styles.CustomDropdownContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
              <CustomDropdown theme={currentTheme} selectedValue={rating} onValueChange={(itemValue) => setRating(itemValue)} style={{ color: currentTheme.textColor }} dropdownIconColor={currentTheme.textColor}>
                <CustomDropdown.Item label="Any Rating" value="" />
                {ratingOptions.map(opt => <CustomDropdown.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </CustomDropdown>
            </View>
          </View>
          <CheckboxGroup title="Warnings" options={warningOptions} selected={warnings} onSelect={setWarnings} theme={currentTheme} />
          <CheckboxGroup title="Categories" options={categoryOptions} selected={categories} onSelect={setCategories} theme={currentTheme} />
          <AutocompleteInput
            label="Characters"
            placeholder="e.g., Harry Potter, Hermione Granger"
            fetchSuggestions={fetchCharacterSuggestions}
            selectedItems={characters}
            onItemsChange={setCharacters}
            theme={currentTheme}
          />
          <AutocompleteInput
            label="Relationships"
            placeholder="e.g., Harry Potter/Draco Malfoy"
            fetchSuggestions={fetchRelationshipSuggestions}
            selectedItems={relationships}
            onItemsChange={setRelationships}
            theme={currentTheme}
          />
          <AutocompleteInput
            label="Additional Tags"
            placeholder="e.g., Found Family, Hurt/Comfort"
            fetchSuggestions={fetchFreeformSuggestions}
            selectedItems={additionalTags}
            onItemsChange={setAdditionalTags}
            theme={currentTheme}
          />
        </FilterSection>

        {activeCanonicalTag &&
          <View>
            <FilterSection title="Work Tag Exclude" theme={currentTheme}>
              <AutocompleteInput
                label="Exclude Fandoms"
                placeholder="e.g., Harry Potter, Marvel"
                fetchSuggestions={fetchFandomSuggestions}
                selectedItems={excludedFandoms}
                onItemsChange={setExcludedFandoms}
                theme={{ ...currentTheme, primaryColor: currentTheme.warningBackground, secondaryTextColor: currentTheme.warningTextColor }}
                redText={true}
              />
              <AutocompleteInput
                label="Exclude Characters"
                placeholder="e.g., Draco Malfoy"
                fetchSuggestions={fetchCharacterSuggestions}
                selectedItems={excludedCharacters}
                onItemsChange={setExcludedCharacters}
                theme={{ ...currentTheme, primaryColor: currentTheme.warningBackground, secondaryTextColor: currentTheme.warningTextColor }}
                redText={true}
              />
              <AutocompleteInput
                label="Exclude Relationships"
                placeholder="e.g., Harry Potter/Ginny Weasley"
                fetchSuggestions={fetchRelationshipSuggestions}
                selectedItems={excludedRelationships}
                onItemsChange={setExcludedRelationships}
                theme={{ ...currentTheme, primaryColor: currentTheme.warningBackground, secondaryTextColor: currentTheme.warningTextColor }}
                redText={true}
              />
              <AutocompleteInput
                label="Exclude Additional Tags"
                placeholder="e.g., Angst, Hurt/Comfort"
                fetchSuggestions={fetchFreeformSuggestions}
                selectedItems={excludedAdditionalTags}
                onItemsChange={setExcludedAdditionalTags}
                theme={{ ...currentTheme, primaryColor: currentTheme.warningBackground, secondaryTextColor: currentTheme.warningTextColor }}
                redText={true}
              />
              <CheckboxGroup title="Exclude Ratings" options={excludeRatingOptions} selected={excludedRatings} onSelect={setExcludedRatings} theme={currentTheme} />
              <CheckboxGroup title="Exclude Warnings" options={excludeWarningOptions} selected={excludedWarnings} onSelect={setExcludedWarnings} theme={currentTheme} />
            </FilterSection>
          </View>
        }

        <FilterSection title="Work Stats" theme={currentTheme}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Hits</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >1000" placeholderTextColor={currentTheme.placeholderColor} value={hits} onChangeText={setHits} keyboardType="numeric" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Kudos</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >100" placeholderTextColor={currentTheme.placeholderColor} value={kudos} onChangeText={setKudos} keyboardType="numeric" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Comments</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >10" placeholderTextColor={currentTheme.placeholderColor} value={comments} onChangeText={setComments} keyboardType="numeric" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Bookmarks</Text>
            <TextInput style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]} placeholder="e.g., >50" placeholderTextColor={currentTheme.placeholderColor} value={bookmarks} onChangeText={setBookmarks} keyboardType="numeric" />
          </View>
        </FilterSection>

        <FilterSection title="Search Options" theme={currentTheme} defaultOpen={true}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Sort by</Text>
            <View style={[styles.CustomDropdownContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
              <CustomDropdown theme={currentTheme} selectedValue={sortBy} onValueChange={(itemValue) => setSortBy(itemValue)} style={{ color: currentTheme.textColor }} dropdownIconColor={currentTheme.textColor}>
                {sortOptions.map(opt => <CustomDropdown.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </CustomDropdown>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: currentTheme.textColor }]}>Sort Direction</Text>
            <View style={[styles.CustomDropdownContainer, { borderColor: currentTheme.borderColor, backgroundColor: currentTheme.inputBackground }]}>
              <CustomDropdown theme={currentTheme} selectedValue={sortDirection} onValueChange={(itemValue) => setSortDirection(itemValue)} style={{ color: currentTheme.textColor }} dropdownIconColor={currentTheme.textColor}>
                {sortDirectionOptions.map(opt => <CustomDropdown.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </CustomDropdown>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { fontSize: 16, fontWeight: '600' },
  container: { flex: 1 },
  contentContainer: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  CustomDropdownContainer: { borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
  sectionContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  sectionToggle: { fontSize: 24, fontWeight: 'bold' },
  sectionContent: { padding: 12 },
  groupContainer: { marginBottom: 16 },
  groupTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkLabel: { fontSize: 16, marginLeft: 12, flex: 1 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxMark: { color: 'white', fontWeight: 'bold' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 100 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  autocompleteContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minHeight: 48,
    justifyContent: 'center',
  },
  autocompleteInput: {
    fontSize: 16,
    paddingVertical: 5,
    flexGrow: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  tagText: {
    color: 'white',
    fontSize: 14,
    marginRight: 6,
  },
  tagDelete: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagDeleteText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 18,
  },
  suggestionsContainer: {
    maxHeight: 150, // This makes the list scrollable if it's too long
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
    zIndex: 10,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBg: {
    borderRadius: 12,
    width: '80%',
    borderWidth: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPresetObject: {
    borderRadius: 12,
    borderWidth: 1,
    margin: 4,
    padding: 8,
    display: "flex",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "center"
  },
  icon: {
    fontSize: 32,
  },
  iconDelete: {
    fontSize: 24,
  },
  canonicalTagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  canonicalTagDismiss: {
    marginLeft: 8,
    padding: 2,
  },
  canonicalTagBannerText: {
    fontSize: 13,
    flexShrink: 1,
  },
});

export default AdvancedSearchScreen;