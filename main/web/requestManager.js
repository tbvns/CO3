import ky from 'ky';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchViaWebView, WebViewFetchError } from './WebviewFetcher';

const CF_STORAGE_KEY = 'cf_domains'; // { [domain]: expiresAt }
const CF_MODE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

function isCFChallenge(html) {
  return html.includes('_cf_chl_opt') || html.includes('cdn-cgi/challenge-platform');
}

export default async function getUrl(url) {
  const { hostname } = new URL(url);

  if (await isCFMode(hostname)) {
    return fetchViaWebView(url);
  }

  try {
    const html = await ky.get(url).text();

    if (isCFChallenge(html)) {
      await enableCFMode(hostname);
      return fetchViaWebView(url, { cfWarning: true });
    }

    return html;
  } catch (err) {
    if (err?.response?.status === 403) {
      await enableCFMode(hostname);
      return fetchViaWebView(url, { cfWarning: true });
    }
    throw err;
  }
}