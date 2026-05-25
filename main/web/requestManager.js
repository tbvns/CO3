import ky from 'ky';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchViaWebView } from './WebviewFetcher';

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
  return html.includes('_cf_chl_opt');
}

export default async function getUrl(url) {
  const { hostname } = new URL(url);

  if (await isCFMode(hostname)) {
    console.log(`using webview to fetch ${url}`);
    return fetchViaWebView(url);
  }

  try {
    const html = await ky.get(url).text();

    if (isCFChallenge(html)) {
      console.log(`isCfChalenged fiered with ${html}`);
      await enableCFMode(hostname);
      return fetchViaWebView(url, { cfWarning: true });
    }

    console.log(`fetched ${url} via ky.`);
    return html;
  } catch (err) {
    if (err?.response?.status === 403) {
      await enableCFMode(hostname);
      return fetchViaWebView(url, { cfWarning: true });
    }
    throw err;
  }
}