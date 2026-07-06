import {
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export default function HelpScreen({ route }) {
  const {setScreens, currentTheme} = route.params;
  const navigation = useNavigation();
  function onBack() {
    navigation.goBack();
  }

  const { t } = useTranslation();

  return (
    <SafeAreaView style={[{backgroundColor: currentTheme.backgroundColor}, styles.container]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          {t('screen_help_title')}
        </Text>
      </View>
      <ScrollView>
        <View style={styles.mainContent}>
          <Image style={styles.image} source={require('../../res/CO3.png')} />
          <View
            style={[
              styles.separator,
              { backgroundColor: currentTheme.borderColor },
            ]}
          />
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            {t('general_app_name')}
          </Text>
          <Text
            style={[
              { paddingTop: 20, margin: 16, color: currentTheme.textColor },
            ]}
          >
            {t('screen_help_sub')}
          </Text>
        </View>
        <View style={[{ margin: 16 }]}>
          <LinkButton
            url="https://tbvns.xyz/discord"
            label={t('screen_help_discord')}
            theme={currentTheme}
          />
          <LinkButton
            url="https://github.com/tbvns/CO3/issues"
            label={t('screen_help_github')}
            theme={currentTheme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkButton({ url, label, theme }) {
  return (
    <TouchableOpacity
      style={[
        {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 16,
        },
      ]}
      onPress={() => Linking.openURL(url)}
    >
      <Icon name={"link"} size={20} color={theme.textColor} />
      <Text style={[styles.buttonText, { color: theme.textColor}]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  mainContent: {
    alignItems: 'center',
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
  buttonText: {
    fontSize: 20,
    fontWeight: 'ultralight',
    textDecorationLine: 'underline',
    marginLeft: 16,
  },
  image: {
    width: 100,
    height: 100,
    margin: 35,
  },
  separator: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  }
});
