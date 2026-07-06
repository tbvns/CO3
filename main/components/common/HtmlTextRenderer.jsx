import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';

export default function HtmlTextRenderer({
  html,
  currentTheme,
  extraTagsStyles = {},
}) {
  const { width } = useWindowDimensions();

  const tagsStyles = useMemo(
    () => ({
      blockquote: {
        backgroundColor: currentTheme.inputBackground,
        padding: 12,
        borderLeftWidth: 4,
        borderLeftColor: currentTheme.primaryColor,
        marginVertical: 10,
        borderRadius: 4,
      },
      a: {
        color: currentTheme.primaryColor,
        textDecorationLine: 'underline',
      },
      h1: { color: currentTheme.textColor, fontSize: 20, marginBottom: 10 },
      h2: { color: currentTheme.textColor, fontSize: 18, marginBottom: 8 },
      h3: { color: currentTheme.textColor, fontSize: 16, marginBottom: 6 },
      p: {
        color: currentTheme.textColor,
        marginBottom: 10,
        lineHeight: 22,
      },
      li: {
        color: currentTheme.textColor,
      },
      ...extraTagsStyles,
    }),
    [currentTheme, extraTagsStyles],
  );

  if (!html) return null;

  return (
    <RenderHtml
      contentWidth={width - 40}
      source={{ html: typeof html === 'string' ? html : html.toString() }}
      baseStyle={{
        color: currentTheme.textColor,
        fontSize: 16,
      }}
      tagsStyles={tagsStyles}
    />
  );
}