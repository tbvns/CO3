import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import autoComplete from '../web/browse/autoComplete';
import { fetchFilteredWorks } from '../web/browse/fetchWorks';
import SmallBookCard from '../components/common/SmallBookCard';
import Toast from 'react-native-toast-message';
import WorkScreen from './workScreen';
import { searchJsonPreset } from '../storage/jsonSearches';

const SECTION_META = {
  'Library': { icon: 'bookmark-outline' },
  'Works': { icon: 'book-outline' },
  'All Tags': { icon: 'tag-outline' },
  'Fandoms': { icon: 'television-play' },
  'Relationships':{ icon: 'heart-outline' },
  'Characters': { icon: 'account-outline' },
  'Freeform': { icon: 'text-box-outline' },
};

function SearchItem({ value, onPress, currentTheme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor: currentTheme.inputBackground,
          borderColor: currentTheme.borderColor,
        },
      ]}
      activeOpacity={0.7}
    >
      <Icon
        name="pound"
        size={13}
        color={currentTheme.primaryColor}
        style={styles.itemIcon}
      />
      <Text
        style={[styles.itemText, { color: currentTheme.textColor }]}
        numberOfLines={1}
      >
        {value.name}
      </Text>
      <Icon
        name="chevron-right"
        size={16}
        color={currentTheme.iconColor}
      />
    </TouchableOpacity>
  );
}

function PresetItem({ value, onPress, currentTheme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor: currentTheme.inputBackground,
          borderColor: currentTheme.borderColor,
        },
      ]}
      activeOpacity={0.7}
    >
      <Icon
        name="layers-search-outline"
        size={13}
        color={currentTheme.primaryColor}
        style={styles.itemIcon}
      />
      <Text
        style={[styles.itemText, { color: currentTheme.textColor }]}
        numberOfLines={1}
      >
        {value.name}
      </Text>
      <Icon
        name="chevron-right"
        size={16}
        color={currentTheme.iconColor}
      />
    </TouchableOpacity>
  );
}

function SectionHeader({ name, count, currentTheme }) {
  const meta = SECTION_META[name] ?? { icon: 'magnify' };
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: currentTheme.tagBackground }]}>
        <Icon name={meta.icon} size={15} color={currentTheme.primaryColor} />
      </View>
      <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
        {name}
      </Text>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: currentTheme.tagBackground }]}>
          <Text style={[styles.countText, { color: currentTheme.primaryColor }]}>
            {Math.min(count, 5)}
          </Text>
        </View>
      )}
    </View>
  );
}

function WorksList({ name, values, currentTheme, libraryDAO, workDAO, setScreens, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, chapterDAO}) {
  if (!values || values?.length === 0) return null;

  console.log(values);

  return (
    <View style={styles.section}>
      <SectionHeader name={name} count={values.length} currentTheme={currentTheme} />
      <View style={[styles.itemsCard, { borderColor: currentTheme.borderColor }]}>
        {values.slice(0, 5).map((v, i) => (
          <View key={i}>
            <SmallBookCard
              work={v}
              theme={currentTheme}
              onPress={() => {
                setScreens(prev => [...prev,
                  <WorkScreen
                    workId={v.id}
                    currentTheme={currentTheme}
                    settingsDAO={settingsDAO}
                    workDAO={workDAO}
                    libraryDAO={libraryDAO}
                    setScreens={setScreens}
                    historyDAO={historyDAO}
                    progressDAO={progressDAO}
                    kudoHistoryDAO={kudoHistoryDAO}
                    chapterDAO={chapterDAO}
                  />
                ])
              }}
            />
            {i < Math.min(values.length, 5) - 1 && (
              <View style={[styles.divider, { backgroundColor: currentTheme.borderColor }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function ItemsList({ name, values, currentTheme, setScreens, openTagSearch }) {
  if (values.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader name={name} count={values.length} currentTheme={currentTheme} />
      <View style={[styles.itemsCard, { borderColor: currentTheme.borderColor }]}>
        {values.slice(0, 5).map((v, i) => (
          <View key={i}>
            <SearchItem
              value={v}
              currentTheme={currentTheme}
              onPress={() => {
                openTagSearch(v.id)
              }}
            />
            {i < Math.min(values.length, 5) - 1 && (
              <View style={[styles.divider, { backgroundColor: currentTheme.borderColor }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function PresetList({ name, values, currentTheme, setActiveScreen, openPreset }) {
  if (values.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader name={name} count={values.length} currentTheme={currentTheme} />
      <View style={[styles.itemsCard, { borderColor: currentTheme.borderColor }]}>
        {values.slice(0, 5).map((v, i) => (
          <View key={i}>
            <PresetItem
              value={v}
              currentTheme={currentTheme}
              onPress={() => {
                openPreset(v.name)
                setActiveScreen("browse")
              }}
            />
            {i < Math.min(values.length, 5) - 1 && (
              <View style={[styles.divider, { backgroundColor: currentTheme.borderColor }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyState({ currentTheme }) {
  return (
    <View style={styles.emptyState}>
      <Icon name="magnify" size={48} color={currentTheme.iconColor} style={{ opacity: 0.4 }} />
      <Text style={[styles.emptyTitle, { color: currentTheme.textColor }]}>
        Start searching
      </Text>
      <Text style={[styles.emptySubtitle, { color: currentTheme.secondaryTextColor }]}>
        Search across tags, fandoms, ships, characters, and more
      </Text>
    </View>
  );
}

export default function GlobalSearchScreen({ currentTheme, searchTerm, setActiveScreen, libraryDAO, setScreens, settingsDAO, workDAO, historyDAO, progressDAO, kudoHistoryDAO, chapterDAO, openTagSearch, setSelectedPreset }) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const [presetResults, setPresetResults] = useState([]);
  const [libraryResults, setLibraryResults] = useState([]);
  const [worksResult, setWorksResultResult] = useState([]);
  const [tags, setTags] = useState([]);
  const [fandoms, setFandoms] = useState([]);
  const [ships, setShips] = useState([]);
  const [chars, setChars] = useState([]);
  const [freeform, setFreeform] = useState([]);

  console.log(libraryResults);

  useEffect(() => {
    const timer = setTimeout(() => {
      const term = searchTerm.trim();
      setDebouncedSearchTerm(term);

      if (!term) {
        setTags([]); setFandoms([]); setShips([]); setChars([]); setFreeform([]);
        return;
      }

      searchJsonPreset(term).then(setPresetResults)
      libraryDAO.search(term).then(setLibraryResults)
      fetchFilteredWorks({"work_search[query]": term, "work_search[sort_column]": "hits"})
        .then(setWorksResultResult)
        .catch(e => Toast.show({ type: "error", text1: "Error fetching works", text2: e.message }))
      autoComplete.fetchAutocompleteSuggestions('tag', term).then(setTags);
      autoComplete.fetchFandomSuggestions(term).then(setFandoms);
      autoComplete.fetchRelationshipSuggestions(term).then(setShips);
      autoComplete.fetchCharacterSuggestions(term).then(setChars);
      autoComplete.fetchFreeformSuggestions(term).then(setFreeform);
    }, 500);

    return () => clearTimeout(timer);
  }, [libraryDAO, searchTerm]);

  const hasResults =
    tags.length > 0 ||
    fandoms.length > 0 ||
    ships.length > 0 ||
    chars.length > 0 ||
    freeform.length > 0;

  return (
    <ScrollView
      style={{ backgroundColor: currentTheme.backgroundColor }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={[styles.libraryRow, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}
        activeOpacity={0.7}
        onPress={() => setActiveScreen("library")}
      >
        <View style={[styles.sectionIconWrap, { backgroundColor: currentTheme.tagBackground }]}>
          <Icon name="book-search-outline" size={15} color={currentTheme.primaryColor} />
        </View>
        <Text style={[styles.libraryText, { color: currentTheme.textColor }]}>
          Search in library
        </Text>
        {searchTerm ? (
          <Text style={[styles.libraryQuery, { color: currentTheme.secondaryTextColor }]} numberOfLines={1}>
            "{searchTerm.trim()}"
          </Text>
        ) : null}
        <Icon name="chevron-right" size={18} color={currentTheme.iconColor} />
      </TouchableOpacity>

      {!debouncedSearchTerm ? (
        <EmptyState currentTheme={currentTheme} />
      ) : !hasResults ? (
        <View style={styles.emptyState}>
          <Icon name="magnify-close" size={48} color={currentTheme.iconColor} style={{ opacity: 0.4 }} />
          <Text style={[styles.emptyTitle, { color: currentTheme.textColor }]}>
            No results
          </Text>
          <Text style={[styles.emptySubtitle, { color: currentTheme.secondaryTextColor }]}>
            Nothing found for "{debouncedSearchTerm}"
          </Text>
        </View>
      ) : (
        <>
          <PresetList name="Presets" values={presetResults} currentTheme={currentTheme} setActiveScreen={setActiveScreen} openPreset={setSelectedPreset} />
          <WorksList name="Library"
                     values={libraryResults.map(r => r.work)}
                     currentTheme={currentTheme}
                     settingsDAO={settingsDAO}
                     workDAO={workDAO}
                     libraryDAO={libraryDAO}
                     setScreens={setScreens}
                     historyDAO={historyDAO}
                     progressDAO={progressDAO}
                     kudoHistoryDAO={kudoHistoryDAO}
                     chapterDAO={chapterDAO}
          />
          <WorksList name="Works"
                     values={worksResult?.works}
                     currentTheme={currentTheme}
                     settingsDAO={settingsDAO}
                     workDAO={workDAO}
                     libraryDAO={libraryDAO}
                     setScreens={setScreens}
                     historyDAO={historyDAO}
                     progressDAO={progressDAO}
                     kudoHistoryDAO={kudoHistoryDAO}
                     chapterDAO={chapterDAO}
          />
          <ItemsList name="All Tags" values={tags} currentTheme={currentTheme} openTagSearch={openTagSearch} />
          <ItemsList name="Fandoms" values={fandoms} currentTheme={currentTheme} openTagSearch={openTagSearch} />
          <ItemsList name="Relationships" values={ships} currentTheme={currentTheme} openTagSearch={openTagSearch} />
          <ItemsList name="Characters" values={chars} currentTheme={currentTheme} openTagSearch={openTagSearch} />
          <ItemsList name="Freeform" values={freeform} currentTheme={currentTheme} openTagSearch={openTagSearch} />

          <Text style={{color: currentTheme.placeholderColor}}>
            You reached the end !
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  libraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  libraryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  libraryQuery: {
    fontSize: 13,
    maxWidth: 120,
  },

  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.1,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },

  itemsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  itemIcon: {
    marginTop: 1,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  divider: {
    height: 1,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});