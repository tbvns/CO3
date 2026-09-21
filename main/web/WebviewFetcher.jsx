import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';

const queue = [];
let triggerNext = null;

function enqueue(item) {
  queue.push(item);
  triggerNext?.();
}

export function fetchViaWebView(url, { cfWarning = false } = {}) {
  return new Promise((resolve, reject) =>
    enqueue({ url, resolve, reject, cfWarning, method: 'GET' }),
  );
}

export function postViaWebView(
  url,
  { body = null, headers = {}, cfWarning = false } = {},
) {
  return new Promise((resolve, reject) =>
    enqueue({ url, resolve, reject, cfWarning, method: 'POST', body, headers }),
  );
}

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

function isCFChallenge(headers) {
  return headers?.['cf-mitigated'] === 'challenge';
}

function buildGetScript(url) {
  return `
(async () => {
  try {
    const r = await fetch(${JSON.stringify(url)}, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',
    });
    const headers = {};
    r.headers.forEach((v, k) => { headers[k] = v; });
    const text = await r.text();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      ok: true,
      status: r.status,
      statusText: r.statusText,
      url: r.url,
      headers,
      text,
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      ok: false,
      error: e.message,
    }));
  }
})(); true;`;
}

function buildPostScript(url, body, headers) {
  return `
(async () => {
  try {
    const r = await fetch(${JSON.stringify(url)}, {
      method: 'POST',
      credentials: 'include',
      headers: ${JSON.stringify(headers)},
      ${body != null ? `body: ${JSON.stringify(body)},` : ''}
    });
    const respHeaders = {};
    r.headers.forEach((v, k) => { respHeaders[k] = v; });
    const text = await r.text();
    window.ReactNativeWebView.postMessage(JSON.stringify({
      ok: true,
      status: r.status,
      statusText: r.statusText,
      url: r.url,
      headers: respHeaders,
      text,
    }));
  } catch (e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      ok: false,
      error: e.message,
    }));
  }
})(); true;`;
}

export default function WebviewFetcher() {
  const [source, setSource] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showCFWarning, setShowCFWarning] = useState(false);
  const webViewRef = useRef(null);
  const currentRef = useRef(null);
  const httpErrorRef = useRef(null);
  const pendingPostRef = useRef(null);

  const loadCurrent = () => {
    const item = currentRef.current;
    if (!item) return;
    const { url, method, body, headers, cfWarning } = item;

    if (cfWarning) {
      item.cfWarning = false;
      setShowCFWarning(true);
      setSource(null);
      setVisible(false);
      return;
    }

    if (method === 'POST') {
      pendingPostRef.current = { url, body, headers };
      setSource({ uri: new URL(url).origin + '/' });
    } else {
      setSource({ uri: url });
    }
  };

  const processNext = () => {
    if (currentRef.current || queue.length === 0) return;
    currentRef.current = queue.shift();
    httpErrorRef.current = null;
    loadCurrent();
  };

  useEffect(() => {
    triggerNext = processNext;
    return () => {
      triggerNext = null;
    };
  }, []);

  const onWarningDismiss = () => {
    setShowCFWarning(false);
    loadCurrent();
  };

  const settle = (value, error) => {
    const item = currentRef.current;
    currentRef.current = null;
    pendingPostRef.current = null;
    setSource(null);
    setVisible(false);
    error ? item?.reject(error) : item?.resolve(value);
    setTimeout(processNext, 150);
  };

  const onLoadEnd = () => {
    if (pendingPostRef.current) {
      const { url, body, headers } = pendingPostRef.current;
      pendingPostRef.current = null;
      webViewRef.current?.injectJavaScript(buildPostScript(url, body, headers));
      return;
    }

    const item = currentRef.current;
    if (item) {
      webViewRef.current?.injectJavaScript(buildGetScript(item.url));
    }
  };

  const onMessage = ({ nativeEvent }) => {
    try {
      const data = JSON.parse(nativeEvent.data);
      if (data.ok) {
        if (isCFChallenge(data.headers)) {
          setVisible(true);
          return;
        }
        settle(
          {
            status: data.status,
            statusText: data.statusText,
            url: data.url,
            text: data.text,
          },
          null,
        );
      } else {
        settle(
          null,
          new WebViewFetchError(
            data.status ?? 0,
            data.error ?? 'Unknown error',
            currentRef.current?.url,
          ),
        );
      }
    } catch {
      settle(
        null,
        new WebViewFetchError(0, 'Parse error', currentRef.current?.url),
      );
    }
  };

  const onHttpError = ({ nativeEvent }) => {
    httpErrorRef.current = {
      status: nativeEvent.statusCode,
      statusText: nativeEvent.description || String(nativeEvent.statusCode),
      url: nativeEvent.url,
    };
  };

  const onError = ({ nativeEvent }) => {
    settle(
      null,
      new WebViewFetchError(
        nativeEvent.code ?? 0,
        nativeEvent.description ?? 'Network error',
        nativeEvent.url,
      ),
    );
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
              AO3 is currently blocking automated requests. Pages will load
              slower until the restriction lifts (up to 8 hours).{'\n\n'}
              Some features like kudos, bookmarks and read later may not work
              properly during this time.
            </Text>
            <Pressable style={styles.button} onPress={onWarningDismiss}>
              <Text style={styles.buttonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {source && (
        <View
          style={[styles.webviewBase, visible ? styles.visible : styles.hidden]}
        >
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
  webviewBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
