import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import login, { validateCookie } from "../../web/account/login"; // Adjust path
import {
  setCredsPasswd,
  getCredsPasswd, // Now also importing getCredsPasswd
  setCredsToken,
  getCredsToken,
  deleteCredsPasswd, // New function for deleting password
  deleteCredsToken, // New function for deleting token
} from "../../storage/Credentials"; // Adjust path
import CustomAlert from "../../components/CustomAlert"; // Adjust path

const LoginScreen = ({ currentTheme, setScreens }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [validating, setValidating] = useState(true);
  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      setValidating(true);
      const storedToken = await getCredsToken();

      if (storedToken) {
        const isValid = await validateCookie(storedToken);
        setIsLoggedIn(isValid);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Token validation error:", error);
      // Even if getCredsToken throws, we should not block the UI
      setIsLoggedIn(false);
    } finally {
      setValidating(false);
    }
  };

  const showAlert = (title, message) => {
    setAlert({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlert({ ...alert, visible: false });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("Error", "Please enter both username and password");
      return;
    }

    setIsLoading(true);
    try {
      const sessionToken = await login(username, password);

      if (sessionToken) {
        // Always save the token
        await setCredsToken(sessionToken);

        // Only save password if "Remember password" is checked
        if (rememberPassword) {
          await setCredsPasswd(username, password);
        } else {
          // If rememberPassword was unchecked, ensure old password is removed
          // In case user logged in without remembering, then logs out.
          await deleteCredsPasswd();
        }

        setIsLoggedIn(true);
        showAlert("Success", "Logged in successfully!");
      } else {
        showAlert("Login Failed", "Invalid credentials or server error");
      }
    } catch (error) {
      console.error("Login error:", error);
      showAlert("Login Error", "An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await deleteCredsToken(); // Always delete the token
      await deleteCredsPasswd(); // Always delete the password on logout

      // Reset state
      setIsLoggedIn(false);
      setUsername("");
      setPassword("");
      setRememberPassword(false);
    } catch (error) {
      console.error("Logout error:", error);
      showAlert("Error", "Failed to logout properly");
    }
  };

  const showRememberPasswordInfo = () => {
    showAlert(
      "Remember Password",
      "When enabled, we securely store your username and password using your device's biometric authentication or passcode. " +
      "This allows us to automatically re-login in the background if your session expires, without interrupting your reading experience. " +
      "Your login information is encrypted and never sent to external servers, only stored securely on your device.",
    );
  };

  const openForgotPassword = () => {
    Linking.openURL("https://archiveofourown.org/users/password/new");
  };

  const openGetInvited = () => {
    Linking.openURL("https://archiveofourown.org/invite_requests");
  };

  if (validating) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: currentTheme.textColor }]}>
              Account Status
            </Text>

            <View style={[styles.statusContainer, { backgroundColor: currentTheme.cardBackground }]}>
              <Icon name="check-circle" size={48} color="green" />
              <Text style={[styles.statusText, { color: currentTheme.textColor }]}>
                You are logged in
              </Text>
              <Text style={[styles.statusSubtext, { color: currentTheme.placeholderColor }]}>
                Your session is active
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: currentTheme.primaryColor }]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} onClose={hideAlert} theme={currentTheme} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            Login with your AO3 account
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>
                Username
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.textColor,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: currentTheme.textColor }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: currentTheme.inputBackground,
                    borderColor: currentTheme.borderColor,
                    color: currentTheme.textColor,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />
            </View>

            <View style={styles.rememberContainer}>
              <TouchableOpacity style={styles.rememberButton} onPress={() => setRememberPassword(!rememberPassword)}>
                <Icon
                  name={rememberPassword ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color={currentTheme.primaryColor}
                />
                <Text style={[styles.rememberText, { color: currentTheme.textColor }]}>
                  Remember my password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={showRememberPasswordInfo} style={styles.infoButton}>
                <Icon name="info-outline" size={20} color={currentTheme.placeholderColor} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: currentTheme.primaryColor }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>{isLoading ? "Logging in..." : "Login"}</Text>
            </TouchableOpacity>

            <View style={styles.footerButtons}>
              <TouchableOpacity onPress={openForgotPassword} style={styles.footerButton}>
                <Text style={[styles.footerButtonText, { color: currentTheme.primaryColor }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={openGetInvited} style={styles.footerButton}>
                <Text style={[styles.footerButtonText, { color: currentTheme.primaryColor }]}>
                  Get invited
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} onClose={hideAlert} theme={currentTheme} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  rememberButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rememberText: {
    fontSize: 16,
    marginLeft: 8,
  },
  infoButton: {
    padding: 5,
  },
  loginButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerButton: {
    padding: 10,
  },
  footerButtonText: {
    fontSize: 16,
  },
  statusContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
  },
  statusSubtext: {
    fontSize: 16,
    marginTop: 5,
  },
  logoutButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default LoginScreen;
