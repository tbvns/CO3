import * as Keychain from 'react-native-keychain';

export async function getCredsPasswd() {
  try {
    const creds = await Keychain.getGenericPassword({
      service: 'creds_passwd',
      authenticationPrompt: {
        title: 'Authenticate to access your password',
        subtitle: 'Use biometrics or your device passcode to unlock',
        description: 'Authentication is required to access the password.',
      },
    });

    if (creds) {
      console.log('Credentials successfully loaded for user ' + creds.username);
      return creds; // Return credentials
    } else {
      console.log('No credentials stored for password service');
      return null;
    }
  } catch (error) {
    console.error('Failed to retrieve password credentials:', error);
    return null; // Return null on error
  }
}

export async function setCredsPasswd(usrname, passwd) {
  try {
    await Keychain.setGenericPassword(usrname, passwd, {
      service: 'creds_passwd',
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE, // Allow biometrics or device passcode
    });
    console.log('Password successfully stored');
  } catch (error) {
    console.error('Failed to store password:', error);
    throw error; // Re-throw to allow calling function to handle
  }
}

export async function getCredsToken() {
  try {
    const creds = await Keychain.getGenericPassword({ service: 'creds_token' });

    if (creds) {
      console.log('Token successfully loaded for user ' + creds.username);
      return creds.password; // Return the token value (which is stored as password)
    } else {
      console.log('No token stored');
      return null; // Return null if no token is stored
    }
  } catch (error) {
    console.error('Failed to retrieve token credentials:', error);
    return null; // Return null on error
  }
}

export async function setCredsToken(token) {
  try {
    // Storing the token with a generic username 'ao3_token'
    await Keychain.setGenericPassword('ao3_token', token, { service: 'creds_token' });
    console.log('Token successfully stored');
  } catch (error) {
    console.error('Failed to store token:', error);
    throw error; // Re-throw to allow calling function to handle
  }
}

export async function deleteCredsPasswd() {
  try {
    await Keychain.resetGenericPassword({ service: 'creds_passwd' });
    console.log('Password credentials deleted.');
  } catch (error) {
    console.error('Failed to delete password credentials:', error);
    throw error;
  }
}

export async function deleteCredsToken() {
  try {
    await Keychain.resetGenericPassword({ service: 'creds_token' });
    console.log('Token credentials deleted.');
  } catch (error) {
    console.error('Failed to delete token credentials:', error);
    throw error;
  }
}
