import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getUserInfo, getUserInfoByPseud } from '../web/user/getUserInfo';
import { useEffect, useState } from 'react';
import HtmlTextRenderer from '../components/common/HtmlTextRenderer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BookmarksScreen from './more/BookmarksScreen';
import UserWorkScreen from './more/UserWorkScreen';
import LoadingSpinner from '../components/History/Spinner';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export default function UserInfoScreen({
  route
}) {
  const {
    currentTheme,
    username,
    onBack,
    setScreens,
    workDAO,
    libraryDAO,
    historyDAO,
    settingsDAO,
    progressDAO,
    kudoHistoryDAO,
    chapterDAO,
  } = route.params;

  const navigation = useNavigation();

  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState();
  const [error, setError] = useState(false);
  const [properUsername, setProperUsername] = useState();
  const [properPseud, setProperPseud] = useState();

  useEffect(() => {
    let parsedUsername = username;
    let parsedPseud = null;

    if (username.includes('(')) {
      const match = username.match(/^([^(]+?)\s*\(([^)]*)\)$/);
      if (match) {
        parsedPseud = match[1].trim();
        parsedUsername = match[2];
      }
    }

    setProperUsername(parsedUsername);
    setProperPseud(parsedPseud);
    loadUserInfo(parsedUsername, parsedPseud);
  }, [username]);

  const loadUserInfo = async (parsedUsername, parsedPseud) => {
    console.log('loadUserInfo');
    setError(false);
    setUserInfo(undefined);
    const fetch = parsedPseud
      ? getUserInfoByPseud(parsedUsername, parsedPseud)
      : getUserInfo(parsedUsername);
    fetch
      .then(data => {
        const bioHtml = data.bio ? data.bio.toString() : undefined;
        setUserInfo({ ...data, bio: bioHtml });
      })
      .catch(err => {
        console.error(err);
        setError(true);
      });
  };

  function userHeader() {
    if (error) {
      return (
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: currentTheme.backgroundColor },
          ]}
        >
          <View style={styles.errorContainer}>
            <Icon
              name="error-outline"
              size={48}
              color={currentTheme.iconColor}
            />
            <Text style={[styles.errorText, { color: currentTheme.textColor }]}>
              {t('screen_user_profile_error_load')}
            </Text>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: currentTheme.primaryColor },
              ]}
              onPress={loadUserInfo}
            >
              <Text style={styles.retryButtonText}>{t('general_retry')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    if (!userInfo)
      return (
        <LoadingSpinner
          currentTheme={currentTheme}
          message={t('screen_user_profile_loading')}
        />
      );

    return (
      <SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            {t('screen_user_profile_title')}
          </Text>
        </View>
        <ScrollView>
          {userInfo ? (
            <>
              <View style={styles.headerContainer}>
                <View style={styles.profileHeader}>
                  <Image
                    source={{ uri: userInfo.avatarUrl }}
                    style={[
                      styles.icon,
                      {
                        borderColor: currentTheme.borderColor,
                        marginBottom: 0,
                      },
                    ]}
                  />
                  <View style={styles.userDetails}>
                    <Text
                      style={[
                        styles.username,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {properPseud ? properPseud : properUsername}
                    </Text>
                    {userInfo.joinDate && (
                      <Text
                        style={[
                          styles.joinDate,
                          { color: currentTheme.secondaryTextColor },
                        ]}
                      >
                        {t('screen_user_profile_joined', {
                          date: userInfo.joinDate,
                        })}
                      </Text>
                    )}
                    {properPseud && (
                      <TouchableOpacity
                        onPress={() => {
                          navigation.push("User", {
                            username: properUsername,
                            currentTheme: currentTheme,
                            onBack: onBack,
                            setScreens: setScreens,
                            workDAO: workDAO,
                            libraryDAO: libraryDAO,
                            historyDAO: historyDAO,
                            chapterDAO: chapterDAO,
                            progressDAO: progressDAO,
                            kudoHistoryDAO: kudoHistoryDAO,
                          })
                        }}
                      >
                        <Text
                          style={[
                            styles.joinDate,
                            { color: currentTheme.secondaryTextColor },
                          ]}
                        >
                          {t('screen_user_profile_pseud_of', {
                            username: properUsername,
                          })}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {userInfo.bio && (
                  <>
                    <Text
                      style={[
                        styles.subTitle,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      {t('screen_user_profile_bio')}
                    </Text>
                    <HtmlTextRenderer
                      html={userInfo.bio}
                      currentTheme={currentTheme}
                    />
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.bookMarkButton,
                  { borderColor: currentTheme.borderColor },
                ]}
                onPress={() => {
                  navigation.push("Bookmarks", {
                    setScreens: setScreens,
                    historyDAO: historyDAO,
                    settingsDAO: settingsDAO,
                    progressDAO: progressDAO,
                    workDAO: workDAO,
                    libraryDAO: libraryDAO,
                    kudoHistoryDAO: kudoHistoryDAO,
                    currentTheme: currentTheme,
                    username: properUsername,
                    chapterDAO: chapterDAO,
                    pseud: properPseud,
                  });
                }}
              >
                <Text
                  style={[
                    styles.bookMarkButtonText,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('screen_user_profile_bookmark_button')}
                </Text>
                <Icon
                  name={'chevron-right'}
                  size={24}
                  color={currentTheme.iconColor}
                  style={[{}]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.workButton,
                  { borderColor: currentTheme.borderColor },
                ]}
                onPress={() => {
                  navigation.push("UserWork", {
                    setScreens: setScreens,
                    historyDAO: historyDAO,
                    settingsDAO: settingsDAO,
                    progressDAO: progressDAO,
                    workDAO: workDAO,
                    libraryDAO: libraryDAO,
                    kudoHistoryDAO: kudoHistoryDAO,
                    currentTheme: currentTheme,
                    username: properUsername,
                    chapterDAO: chapterDAO,
                    pseud: properPseud,
                  })
                }}
              >
                <Text
                  style={[
                    styles.bookMarkButtonText,
                    { color: currentTheme.textColor },
                  ]}
                >
                  {t('screen_user_profile_works_button')}
                </Text>
                <Icon
                  name={'chevron-right'}
                  size={24}
                  color={currentTheme.iconColor}
                  style={[{}]}
                />
              </TouchableOpacity>
            </>
          ) : (
            <ActivityIndicator />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {userHeader()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    alignItems: 'flex-start',
  },
  loader: {
    marginTop: 50,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  bioWrapper: {
    width: '100%',
  },
  subTitle: {
    fontSize: 30,
    fontWeight: "bold"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    width: "70%",
  },
  username: {
    fontSize: 20,
    paddingLeft: 10,
  },
  joinDate: {
    fontSize: 15,
    paddingLeft: 10,
  },
  bookMarkButton: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workButton: {
    borderBottomWidth: 1,
    padding: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 64,
  },
  bookMarkButtonText: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});