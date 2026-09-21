import ky, { TimeoutError } from 'ky';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchViaWebView, postViaWebView } from './WebviewFetcher';
import { Platform } from 'react-native';
import {
  deleteCredsPasswd,
  deleteCredsToken,
  deleteLastLogin,
  getCredsPasswd,
  getLastLogin,
  getUsername,
  hasStoredPassword,
} from '../storage/Credentials';
import Toast from 'react-native-toast-message';
import { navigationRef } from '../app';
import { handleLogin } from './account/login';

const CF_STORAGE_KEY = 'cf_domains';
const CF_MODE_DURATION = 8 * 60 * 60 * 1000; // 8 hours

async function getCFMap() {
  const raw = await AsyncStorage.getItem(CF_STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

async function isCFMode(domain) {
  const map = await getCFMap();
  if (!map[domain]) return false;
  if (Date.now() > map[domain]) {
    delete map[domain];
    await AsyncStorage.setItem(CF_STORAGE_KEY, JSON.stringify(map));
    return false;
  }
  return true;
}

async function enableCFMode(domain) {
  const map = await getCFMap();
  map[domain] = Date.now() + CF_MODE_DURATION;
  await AsyncStorage.setItem(CF_STORAGE_KEY, JSON.stringify(map));
}

function isCFChallenge(res) {
  return res.headers.get('cf-mitigated') === 'challenge';
}

const cloudflareErrorCodes = [403, 525, 418, 520, 522, 503];

function canUseWebView() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function checkSessionExpiry() {
  const time = await getLastLogin();
  if (!time || time === 0) return;
  if (Date.now() - time <= 14 * 24 * 60 * 60 * 1000) return;

  Toast.show({
    type: 'error',
    text1: 'You have been logged out!',
    text2: "It's been two weeks since you last logged in.",
    onPress: async () => {
      if (await hasStoredPassword()) {
        try {
          await handleLogin(await getUsername(), await getCredsPasswd());
        } catch (e) {
          Toast.show({
            type: 'error',
            text1: 'Login failed.',
            text2: e,
            onPress: () => navigationRef.navigate('Account', {}),
          });
          deleteLastLogin();
          deleteCredsPasswd();
          deleteCredsToken();
        }
      } else {
        navigationRef.navigate('Account', {});
      }
    },
  });

  if (!(await hasStoredPassword())) {
    deleteLastLogin();
    deleteCredsPasswd();
    deleteCredsToken();
  }
}

export default async function getUrl(url, noWebview = false) {
  const { hostname } = new URL(url);

  if (noWebview) {
    checkSessionExpiry().catch(console.error);
  }

  if (!canUseWebView()) noWebview = true;

  if (!noWebview && (await isCFMode(hostname))) {
    console.log(`[GET] using webview for ${url}`);
    const r = await fetchViaWebView(url);
    return r.text;
  }

  try {
    const res = await ky.get(url);
    const html = await res.text();

    if (isCFChallenge(res)) {
      console.log(`[GET] CF challenge for ${url}`);
      await enableCFMode(hostname);
      const r = await fetchViaWebView(url, { cfWarning: true });
      return r.text;
    }

    console.log(`[GET] fetched via ky: ${url}`);
    return html;
  } catch (err) {
    if (
      cloudflareErrorCodes.includes(err?.response?.status) ||
      err instanceof TimeoutError
    ) {
      await enableCFMode(hostname);
      const r = await fetchViaWebView(url);
      return r.text;
    }
    throw err;
  }
}

export async function postUrl(
  url,
  { body = null, headers = {}, noWebview = false } = {},
) {
  const { hostname } = new URL(url);

  if (!canUseWebView()) noWebview = true;

  if (!noWebview && (await isCFMode(hostname))) {
    console.log(`[POST] using webview for ${url}`);
    const r = await postViaWebView(url, { body, headers });
    return { ...r, ok: r.status >= 200 && r.status < 300 };
  }

  try {
    const res = await ky.post(url, { body, headers });
    const text = await res.text();

    if (isCFChallenge(res)) {
      console.log(`[POST] CF challenge for ${url}`);
      await enableCFMode(hostname);
      const r = await postViaWebView(url, { body, headers, cfWarning: true });
      return { ...r, ok: r.status >= 200 && r.status < 300 };
    }

    console.log(`[POST] fetched via ky: ${url}`);
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      text,
    };
  } catch (err) {
    if (
      cloudflareErrorCodes.includes(err?.response?.status) ||
      err instanceof TimeoutError
    ) {
      await enableCFMode(hostname);
      const r = await postViaWebView(url, { body, headers });
      return { ...r, ok: r.status >= 200 && r.status < 300 };
    }
    throw err;
  }
}
