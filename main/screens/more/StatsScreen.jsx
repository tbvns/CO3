import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import * as Stats from '../../storage/Stats';
import UserInfoScreen from '../UserInfo';

function StatCard({ icon, label, value, currentTheme, accent }) {
  const isLoading = value === undefined || value === null;

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: currentTheme.cardBackground,
          borderColor: currentTheme.borderColor,
        },
      ]}
    >
      <View style={[styles.iconBadge, styles.iconBadgeMargin, { backgroundColor: accent + '22' }]}>
        <Icon name={icon} size={22} color={accent} />
      </View>
      <Text style={[styles.statLabel, { color: currentTheme.secondaryTextColor }]}>
        {label}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={styles.spinner} />
      ) : (
        <Text style={[styles.statValue, { color: currentTheme.textColor }]}>
          {String(value)}
        </Text>
      )}
    </View>
  );
}

function AuthorList({ authors, currentTheme, accent, setScreens, workDAO, libraryDAO, historyDAO, settingsDAO, progressDAO, kudoHistoryDAO, chapterDAO, }) {
  const isLoading = authors === undefined || authors === null;

  function onBack() {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  return (
    <View
      style={[
        styles.wideCard,
        {
          backgroundColor: currentTheme.cardBackground,
          borderColor: currentTheme.borderColor,
        },
      ]}
    >
      <View style={styles.wideCardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: accent + '22' }]}>
          <Icon name="person" size={22} color={accent} />
        </View>
        <Text style={[styles.wideCardLabel, { color: currentTheme.secondaryTextColor }]}>
          Favourite Authors
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={styles.spinner} />
      ) : Array.isArray(authors) && authors.length > 0 ? (
        authors.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.listRow,
              i < authors.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: currentTheme.borderColor,
              },
            ]}
            activeOpacity={0.6}
            onPress={() => {
              setScreens( prev =>
                [...prev,
                  <UserInfoScreen
                    currentTheme={currentTheme}
                    username={item.author}
                    onBack={onBack}
                    setScreens={setScreens}
                    workDAO={workDAO}
                    libraryDAO={libraryDAO}
                    historyDAO={historyDAO}
                    settingsDAO={settingsDAO}
                    progressDAO={progressDAO}
                    kudoHistoryDAO={kudoHistoryDAO}
                    chapterDAO={chapterDAO}
                  />
                ]
              )
            }}
          >
            <Text style={[styles.rankText, { color: currentTheme.secondaryTextColor }]}>
              {i + 1}
            </Text>
            <Text
              style={[styles.listRowText, { color: currentTheme.textColor }]}
              numberOfLines={1}
            >
              {item.author}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: accent + '22' }]}>
              <Text style={[styles.countText, { color: accent }]}>
                {item.author_count} {item.author_count === 1 ? 'work' : 'works'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: currentTheme.secondaryTextColor }]}>
          No data yet
        </Text>
      )}
    </View>
  );
}

function TagList({ tags, currentTheme, accent, openTagSearch }) {
  const isLoading = tags === undefined || tags === null;

  return (
    <View
      style={[
        styles.wideCard,
        {
          backgroundColor: currentTheme.cardBackground,
          borderColor: currentTheme.borderColor,
        },
      ]}
    >
      <View style={styles.wideCardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: accent + '22' }]}>
          <Icon name="local-offer" size={22} color={accent} />
        </View>
        <Text
          style={[
            styles.wideCardLabel,
            { color: currentTheme.secondaryTextColor },
          ]}
        >
          Preferred Tags
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={styles.spinner} />
      ) : Array.isArray(tags) && tags.length > 0 ? (
        <View style={styles.tagRow}>
          {tags.map((tag, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.tag,
                { backgroundColor: accent + '18', borderColor: accent + '40' },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                openTagSearch(tag.tag_name);
              }}
            >
              <Text style={[styles.tagText, { color: accent }]}>
                {tag.tag_name}
                <Text style={[styles.tagSep, { color: accent + '88' }]}>
                  {' '}
                  ·{' '}
                </Text>
                <Text style={[styles.tagCountText, { color: accent + 'aa' }]}>
                  {tag.usage_count}
                </Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text
          style={[styles.emptyText, { color: currentTheme.secondaryTextColor }]}
        >
          No data yet
        </Text>
      )}
    </View>
  );
}

export default function StatsScreen({ currentTheme, setScreens, databaseObj, openTagSearch, workDAO, libraryDAO, historyDAO, settingsDAO, progressDAO, kudoHistoryDAO, chapterDAO }) {
  function onBack() {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  const [totalChapterRead, setTotalChapterRead] = useState();
  const [totalWorksStarted, setTotalWorksStarted] = useState();
  const [preferedTags, setPreferedTags] = useState();
  const [preferedAuthor, setPreferedAuthor] = useState();

  useEffect(() => {
    Stats.totalChaptersRead(databaseObj).then(result => setTotalChapterRead(result));
    Stats.totalWorksStarted(databaseObj).then(result => setTotalWorksStarted(result));
    Stats.preferredTag(databaseObj).then(result => setPreferedTags(result));
    Stats.preferredAuthor(databaseObj).then(result => setPreferedAuthor(result));
  }, [databaseObj]);

  const accent = currentTheme.primaryColor;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Statistics</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={[styles.sectionLabel, { color: currentTheme.secondaryTextColor }]}>
          READING ACTIVITY
        </Text>
        <View style={styles.cardRow}>
          <StatCard
            icon="menu-book"
            label="Chapters Read"
            value={totalChapterRead}
            currentTheme={currentTheme}
            accent={accent}
          />
          <StatCard
            icon="auto-stories"
            label="Works Started"
            value={totalWorksStarted}
            currentTheme={currentTheme}
            accent={accent}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: currentTheme.secondaryTextColor }]}>
          YOUR PREFERENCES
        </Text>

        <AuthorList
          authors={preferedAuthor}
          currentTheme={currentTheme}
          accent={accent}
          setScreens={setScreens}
          workDAO={workDAO}
          libraryDAO={libraryDAO}
          historyDAO={historyDAO}
          settingsDAO={settingsDAO}
          progressDAO={progressDAO}
          kudoHistoryDAO={kudoHistoryDAO}
          chapterDAO={chapterDAO}
        />

        <TagList
          tags={preferedTags}
          currentTheme={currentTheme}
          accent={accent}
          openTagSearch={openTagSearch}
          setScreens={setScreens}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeMargin: {
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  wideCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  wideCardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wideCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginLeft: 10,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  listRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagSep: {
    fontWeight: '400',
  },
  tagCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
});