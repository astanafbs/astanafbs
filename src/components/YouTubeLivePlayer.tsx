import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

import { colors, radius, spacing } from '../theme';

type NavigationRequest = {
  url: string;
  isTopFrame?: boolean;
};

type HttpErrorEvent = {
  nativeEvent: {
    url: string;
  };
};

type PlayerSource = {
  uri: string;
  headers?: Record<string, string>;
};

type YouTubeLivePlayerProps = {
  videoId?: string | null;
  playerSource?: PlayerSource | null;
  title?: string;
};

const youtubeVideoIdPattern = /^[a-zA-Z0-9_-]{6,32}$/;
const playerOrigin = 'https://billiardhub.app';
const appLogoSource = require('../../assets/preview.png');

function normalizeVideoId(videoId?: string | null) {
  const value = videoId?.trim();
  if (!value || !youtubeVideoIdPattern.test(value)) return null;
  return value;
}

function buildEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '1',
    enablejsapi: '1',
    origin: playerOrigin,
    widget_referrer: playerOrigin,
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function buildPlayerHtml(embedUrl: string, title: string) {
  const escapedTitle = title
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body, #player { margin: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe { display: block; width: 100%; height: 100%; border: 0; background: #000; }
    </style>
  </head>
  <body>
    <iframe
      id="player"
      title="${escapedTitle}"
      src="${embedUrl}"
      referrerpolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}

function getHost(url: URL) {
  return url.hostname.toLowerCase().replace(/^www\./, '');
}

function isAllowedPlayerRequest(urlValue: string, videoId?: string | null, playerUri?: string | null) {
  if (urlValue === 'about:blank') return true;

  let url: URL;

  try {
    url = new URL(urlValue);
  } catch {
    return false;
  }

  const host = getHost(url);
  const playerOriginUrl = new URL(playerOrigin);

  if (playerUri) {
    try {
      const allowedPlayerUrl = new URL(playerUri);
      if (url.origin === allowedPlayerUrl.origin && url.pathname === allowedPlayerUrl.pathname) {
        return true;
      }
    } catch {
      return false;
    }
  }

  if (url.origin === playerOrigin || host === getHost(playerOriginUrl)) return true;

  if (url.protocol !== 'https:') return false;
  if (host === 'youtu.be' || host === 'm.youtube.com') return false;

  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return false;
  if (url.pathname === '/watch' || url.pathname.startsWith('/watch/')) return false;
  if (!url.pathname.startsWith('/embed/')) return false;
  if (!videoId) return true;

  const embedPath = `/embed/${videoId}`;
  return url.pathname === embedPath || url.pathname.startsWith(`${embedPath}/`);
}

const injectedNavigationGuard = `
  (function () {
    document.addEventListener('click', function (event) {
      var node = event.target;
      while (node && !node.href) {
        node = node.parentElement;
      }
      if (node && node.href && node.href.indexOf('/embed/') === -1) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  })();
  true;
`;

export function YouTubeLivePlayer({ videoId, playerSource, title = 'Прямая трансляция' }: YouTubeLivePlayerProps) {
  const [failed, setFailed] = useState(false);
  const { width, height } = useWindowDimensions();
  const normalizedVideoId = useMemo(() => normalizeVideoId(videoId), [videoId]);
  const embedUrl = useMemo(
    () => (normalizedVideoId ? buildEmbedUrl(normalizedVideoId) : null),
    [normalizedVideoId],
  );
  const playerHtml = useMemo(
    () => (embedUrl ? buildPlayerHtml(embedUrl, title) : ''),
    [embedUrl, title],
  );
  const activePlayerUri = playerSource?.uri ?? null;
  const webViewSource = activePlayerUri && playerSource
    ? playerSource
    : {
        html: playerHtml,
        baseUrl: playerOrigin,
      };
  const isLandscape = width > height;

  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => undefined);

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [activePlayerUri, normalizedVideoId]);

  const handleShouldStartLoadWithRequest = useCallback(
    (request: NavigationRequest) => {
      if (request.isTopFrame === false) return true;

      return isAllowedPlayerRequest(request.url, normalizedVideoId, activePlayerUri);
    },
    [activePlayerUri, normalizedVideoId],
  );

  const handleExitFullscreen = useCallback(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => undefined);
  }, []);

  const handleHttpError = useCallback(
    (event: HttpErrorEvent) => {
      if (activePlayerUri && event.nativeEvent.url.startsWith(activePlayerUri)) {
        setFailed(true);
      }
      if (embedUrl && event.nativeEvent.url.startsWith(embedUrl)) {
        setFailed(true);
      }
    },
    [activePlayerUri, embedUrl],
  );

  const renderPlayer = () => (
    <View style={styles.playerSurface}>
      <WebView
        source={webViewSource}
        style={styles.webView}
        containerStyle={styles.webViewContainer}
        originWhitelist={['https://*', 'http://*', 'about:blank']}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        allowsAirPlayForMediaPlayback={false}
        setSupportMultipleWindows={false}
        thirdPartyCookiesEnabled
        startInLoadingState
        injectedJavaScript={injectedNavigationGuard}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onOpenWindow={() => undefined}
        onError={() => setFailed(true)}
        onHttpError={handleHttpError}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brass400} />
          </View>
        )}
      />
      <Pressable
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onPress={() => undefined}
        style={styles.youtubeLinkBlocker}
      >
        <Image source={appLogoSource} resizeMode="contain" style={styles.youtubeLinkLogo} />
      </Pressable>
    </View>
  );

  if (!activePlayerUri && (!normalizedVideoId || !embedUrl)) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Эфир пока недоступен</Text>
        <Text style={styles.emptyBody}>Трансляция еще не добавлена организатором.</Text>
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Не удалось открыть эфир</Text>
        <Text style={styles.emptyBody}>Проверьте доступность YouTube Live.</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar hidden={isLandscape} />
      {!isLandscape ? (
        <View style={styles.inlineFrame} accessibilityLabel={title}>
          {renderPlayer()}
        </View>
      ) : null}
      <Modal visible={isLandscape} animationType="fade" presentationStyle="fullScreen" supportedOrientations={['landscape']}>
        <View style={styles.fullscreen}>
          {renderPlayer()}
          <Pressable
            accessibilityLabel="Закрыть полноэкранный режим"
            onPress={handleExitFullscreen}
            style={styles.closeButton}
          >
            <X color={colors.white} size={24} strokeWidth={2.2} />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inlineFrame: {
    aspectRatio: 16 / 9,
    alignSelf: 'stretch',
    minHeight: 210,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: '#000000',
    marginBottom: spacing.md,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  playerSurface: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  youtubeLinkBlocker: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 70,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderTopRightRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    zIndex: 4,
  },
  youtubeLinkLogo: {
    width: 56,
    height: 30,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  empty: {
    alignSelf: 'stretch',
    minHeight: 210,
    justifyContent: 'center',
    gap: 8,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.cardDark,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
});
