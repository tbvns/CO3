import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

// --- Queue ---

const queue = [];
let triggerNext = null;

function enqueue(item) {
  queue.push(item);
  triggerNext?.();
}

export function fetchViaWebView(url, { cfWarning = false } = {}) {
  return new Promise((resolve, reject) => enqueue({ url, resolve, reject, cfWarning }));
}

// --- Error ---

export class WebViewFetchError extends Error {
  constructor(status, statusText, url) {
    super(`${status} ${statusText}`);
    this.name = 'WebViewFetchError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.response = { status, statusText, url };
  }
}

// --- CF detection ---

const CF_CHALLENGE_DETECTION = `
  (function() {
    const isChallenge =
      typeof window._cf_chl_opt !== 'undefined' ||
      !!document.querySelector('script[src*="cdn-cgi/challenge-platform"]') ||
      !!document.querySelector('script[src*="challenges.cloudflare.com"]');

    if (isChallenge) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'challenge' }));
      return;
    }

    localStorage.setItem('accepted_tos', '20241119');
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'success',
      body: document.documentElement.outerHTML,
    }));
  })();
  true;
`;

const CF_INTERIM_STATUSES = new Set([403, 503]);

// --- Component ---

export default function WebviewFetcher() {
  const [source, setSource] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showCFWarning, setShowCFWarning] = useState(false);
  const webViewRef = useRef(null);
  const currentRef = useRef(null);
  const httpErrorRef = useRef(null);

  const loadCurrent = () => {
    setVisible(false);
    setSource({ uri: currentRef.current.url });
  };

  const processNext = () => {
    if (currentRef.current || queue.length === 0) return;
    currentRef.current = queue.shift();
    httpErrorRef.current = null;
    loadCurrent();
  };

  useEffect(() => {
    triggerNext = processNext;
    return () => { triggerNext = null; };
  }, []);

  const onWarningDismiss = () => {
    setShowCFWarning(false);
    loadCurrent();
  };

  const settle = (value, error) => {
    const item = currentRef.current;
    currentRef.current = null;
    setSource(null);
    setVisible(false);
    error ? item?.reject(error) : item?.resolve(value);
    setTimeout(processNext, 150);
  };

  const onLoadEnd = () => {
    const err = httpErrorRef.current;
    httpErrorRef.current = null;

    if (err && !CF_INTERIM_STATUSES.has(err.status)) {
      settle(null, new WebViewFetchError(err.status, err.statusText, err.url));
      return;
    }

    webViewRef.current?.injectJavaScript(CF_CHALLENGE_DETECTION);
  };

  const onHttpError = ({ nativeEvent }) => {
    httpErrorRef.current = {
      status: nativeEvent.statusCode,
      statusText: nativeEvent.description || String(nativeEvent.statusCode),
      url: nativeEvent.url,
    };
  };

  const onError = ({ nativeEvent }) => {
    settle(null, new WebViewFetchError(
      nativeEvent.code ?? 0,
      nativeEvent.description ?? 'Network error',
      nativeEvent.url,
    ));
  };

  const onMessage = ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data);
      if (data.type === 'challenge') {
        if (currentRef.current?.cfWarning) {
          setShowCFWarning(true);
        } else {
          setVisible(true);
        }
        return;
      }
      if (data.type === 'success') { settle(data.body, null); return; }
      settle(null, new WebViewFetchError(0, data.error ?? 'WebView extraction failed', source?.uri));
    } catch (e) {
      settle(null, e);
    }
  };

  return (
    <>
      <Modal
        visible={showCFWarning}
        transparent
        animationType="fade"
        onRequestClose={onWarningDismiss}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>AO3 anti-bot mode active</Text>
            <Text style={styles.body}>
              AO3 is currently blocking automated requests. Pages will load slower
              until the restriction lifts (up to 8 hours).{'\n\n'}
              Some features like kudos, bookmarks and read later may not work properly
              during this time.
            </Text>
            <Pressable style={styles.button} onPress={onWarningDismiss}>
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {source && (
        <View style={[styles.webviewBase, visible ? styles.visible : styles.hidden]}>
          <WebView
            ref={webViewRef}
            source={source}
            onLoadEnd={onLoadEnd}
            onHttpError={onHttpError}
            onError={onError}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            cacheEnabled
            startInLoadingState={visible}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // WebView
  webviewBase: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
  },
  visible: {
    backgroundColor: 'white',
    opacity: 1,
    pointerEvents: 'auto',
  },
  hidden: {
    opacity: 0,
    pointerEvents: 'none',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    gap: 12,
    maxWidth: 360,
    width: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  button: {
    marginTop: 4,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});