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

export default function HelpScreen({setScreens, currentTheme}) {
  function onBack() {
    setScreens((prev) => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Help</Text>
      </View>
      <ScrollView>
        <View style={styles.mainContent}>
          <Image style={styles.image} source={require("../../res/CO3.png")} />
          <View style={[styles.separator, {backgroundColor: currentTheme.borderColor}]} />
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            Client Of Our Own
          </Text>
          <Text style={[{ paddingTop: 20, color: currentTheme.textColor }]}>Do you need help or do you have an issue ?</Text>
        </View>
        <View style={[{margin: 16}]}>
          <LinkButton
            url="https://discord.gg/3wMGWu2xMF"
            label="Ask on the discord"
            theme={currentTheme}
          />
          <LinkButton
            url="https://github.com/tbvns/CO3/issues"
            label="Open an issue on github"
            theme={currentTheme}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
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
