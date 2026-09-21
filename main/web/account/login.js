import { fetchLoginAuthenticityToken } from './fetchAuthenticityToken';
import Toast from 'react-native-toast-message';
import {
  deleteCredsPasswd,
  getCredsToken,
  hasStoredPassword,
  setCredsToken,
  setLastLogin,
  setUsernameOnly,
} from '../../storage/Credentials';
import getUrl, { postUrl } from '../requestManager';
import i18n from 'i18next';

let DomParser = require('react-native-html-parser').DOMParser;

const SESSION_PLACEHOLDER = 'cookie-jar';

export class LoginError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LoginError';
    this.code = code;
  }
}

export const handleLogin = async (username, password) => {
  const t = i18n.t;

  if (!username || !password) {
    throw t('screen_account_login_missing_fields', {
      defaultValue: 'Please enter both username and password',
    });
  }

  try {
    await login(username, password);
    await setCredsToken(SESSION_PLACEHOLDER);
    await setUsernameOnly(username);
    await setLastLogin();

    Toast.show({
      type: 'success',
      text1: t('general_success'),
      text2: t('screen_account_login_success'),
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof LoginError && error.code === 'BAD_CREDENTIALS') {
      throw t('screen_account_login_failed_invalid_creds', {
        defaultValue: 'Wrong username or password',
      });
    }
    throw t('screen_account_login_failed_generic');
  }
};

export default async function login(username, password) {
  let token;
  try {
    token = await fetchLoginAuthenticityToken();
  } catch (err) {
    if (err?.message?.includes('already logged in')) return;
    throw new LoginError('NETWORK', err?.message ?? 'Could not fetch token');
  }

  const body = new URLSearchParams({
    authenticity_token: token,
    'user[login]': username,
    'user[password]': password,
    'user[remember_me]': '1',
    commit: 'Log in',
  }).toString();

  let response;
  try {
    response = await postUrl('https://archiveofourown.org/users/login', {
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err) {
    throw new LoginError('NETWORK', err?.message ?? 'Request failed');
  }

  if (!response.ok) {
    throw new LoginError(
      'BLOCKED',
      `Login failed: ${response.status} ${response.statusText}`,
    );
  }

  if (response.url === 'https://archiveofourown.org/users/login') {
    throw new LoginError('BAD_CREDENTIALS', 'Wrong username or password');
  }
}

export async function validateCookie() { //TODO: Replace that with a page loader or some shit
  const token = await getCredsToken();
  const isLoggedIn = !!token;
  console.log(isLoggedIn ? 'Session present.' : 'Session missing.');
  return isLoggedIn;
}