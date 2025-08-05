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
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import login, { validateCookie } from "../../web/account/login";
import {
  setCredsPasswd,
  getCredsPasswd,
  setCredsToken,
  getCredsToken,
  deleteCredsPasswd,
  deleteCredsToken,
} from "../../storage/Credentials";
import CustomAlert from "../../components/CustomAlert";

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
  const [sessionInfo, setSessionInfo] = useState({
    visible: false,
    username: "",
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

  const showSessionInfo = async () => {
    try {
      // Try to get username from stored credentials first
      const storedCreds = await getCredsPasswd();
      if (storedCreds) {
        setSessionInfo({
          visible: true,
          username: storedCreds.username,
        });
        return;
      }

      // If no stored credentials, show anonymous session
      setSessionInfo({
        visible: true,
        username: "Anonymous (not stored)",
      });
    } catch (error) {
      console.error("Error retrieving session info:", error);
      showAlert("Error", "Failed to retrieve session information");
    }
  };

  const hideSessionInfo = () => {
    setSessionInfo({ ...sessionInfo, visible: false });
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
        await setCredsToken(sessionToken);

        if (rememberPassword) {
          await setCredsPasswd(username, password);
        } else {
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
      await deleteCredsToken();
      await deleteCredsPasswd();

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
              style={[styles.secondaryButton, { backgroundColor: currentTheme.cardBackground }]}
              onPress={showSessionInfo}
            >
              <Text style={[styles.secondaryButtonText, { color: currentTheme.textColor }]}>
                Check current session
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: currentTheme.primaryColor }]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Session Info Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={sessionInfo.visible}
          onRequestClose={hideSessionInfo}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: currentTheme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>
                Current Session
              </Text>
              <View style={styles.sessionInfoContainer}>
                <Text style={[styles.sessionLabel, { color: currentTheme.placeholderColor }]}>
                  Username:
                </Text>
                <Text style={[styles.sessionValue, { color: currentTheme.textColor }]}>
                  {sessionInfo.username}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.primaryColor }]}
                onPress={hideSessionInfo}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <CustomAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={hideAlert}
          theme={currentTheme}
        />
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

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        theme={currentTheme}
      />
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
    marginBottom: 20,
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
    marginTop: 10,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryButton: {
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sessionInfoContainer: {
    width: "100%",
    marginBottom: 20,
  },
  sessionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sessionValue: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  modalButton: {
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    width: "100%",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
