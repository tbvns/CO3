import ky from 'ky';
import { getDownloaded, isDownloaded } from '../../downloads/Downloader';
import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function fetchChapter(workId, chapterId) {
  let url;
  if (!chapterId || String(chapterId) === String(workId)) {
    url = `https://archiveofourown.org/works/${workId}?view_adult=true`;
  } else {
    url = `https://archiveofourown.org/works/${workId}/chapters/${chapterId}?view_adult=true`;
  }

  console.log(`Fetching chapter from: ${url}`);
  const response = await getUrl(url);
  const doc = new DomParser().parseFromString(response, 'text/html');

  let chapterDiv = doc.getElementById('workskin');

  if (!chapterDiv) {
    const userstuffDivs = doc.getElementsByClassName('userstuff');
    if (userstuffDivs.length > 0) {
      let longest = userstuffDivs[0];
      let maxLen = 0;
      for (let i = 0; i < userstuffDivs.length; i++) {
        const txt = getElementText(userstuffDivs[i]) || '';
        if (txt.length > maxLen) {
          maxLen = txt.length;
          longest = userstuffDivs[i];
        }
      }
      chapterDiv = longest;
    }
  }

  if (!chapterDiv) {
    console.log('No chapter content found');
    return null;
  }

  console.log('chapterDiv', chapterDiv);

  let cssStyles = '';

  const workDiv = doc.getElementsByClassName('work')[0];
  if (workDiv) {
    const styleElements = workDiv.getElementsByTagName('style');
    for (let i = 0; i < styleElements.length; i++) {
      const styleContent = getElementText(styleElements[i]);
      if (styleContent) {
        cssStyles += styleContent + '\n';
      }
    }
  }

  if (chapterDiv.getAttribute('id') === 'workskin') {
    const styleElements = chapterDiv.getElementsByTagName('style');
    for (let i = 0; i < styleElements.length; i++) {
      const styleContent = getElementText(styleElements[i]);
      if (styleContent) cssStyles += styleContent + '\n';
    }
  }

  const allStyleElements = doc.getElementsByTagName('style');
  for (let i = 0; i < allStyleElements.length; i++) {
    const styleContent = getElementText(allStyleElements[i]);
    if (styleContent && styleContent.includes('#workskin')) {
      cssStyles += styleContent + '\n';
    }
  }

  return [getElementHtml(chapterDiv), cssStyles ];
}

export async function fetchChapterWithTheme(workId, chapterId, currentTheme = null, settingsDAO) {

  const isDL = await isDownloaded(workId, chapterId);

  if (isDL) {
    console.log(`Using downloaded resource for chapter ${chapterId} on work ${workId}`);
  }

  const dataSource = isDL
    ? getDownloaded
    : fetchChapter;

  const [chapterHtml, cssStyles] = await dataSource(workId, chapterId);

  const completeHtml = await createCompleteHtml(chapterHtml, cssStyles, currentTheme, settingsDAO);

  console.log(`Successfully fetched content for work ${workId}`);

  return completeHtml;
}

function getElementText(element) {
  if (!element) return null;
  let text = "";
  if (element.nodeType === 3) return element.nodeValue?.trim() || null;

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    text += child.nodeType === 3 ? child.nodeValue : getElementText(child) || "";
  }
  return text.trim() || null;
}

async function createCompleteHtml(chapterHtml, cssStyles, currentTheme, settingsDAO) {
  const themeCSS = currentTheme ? generateThemeCSS(currentTheme) : '';

  const settings = await settingsDAO.getSettings();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter</title>
  <base href="https://archiveofourown.org" />
  <style>
    /* Theme variables */
    ${themeCSS}
    ${settings.useCustomFont ? `@font-face {font-family: '${settings.fontFamily}'; src: url('${settings.font}')}` : ""}
    
    .landmark {
        visibility: hidden;
        display: none;
    }
    
    .title {
      display: none;
    }
    
    .byline {
       display: none;
    }

    /* Base styles for better readability with theme integration */
    body {
      font-family: ${settings.useCustomFont ? settings.fontFamily :  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"};
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: var(--bg-color, #fff);
      color: var(--text-color, #333);
      transition: background-color 0.3s ease, color 0.3s ease;
      font-size: ${settings.useCustomSize ? settings.fontSize + 'em' : '1em'};
    }
    
    #workskin h1, #workskin h2, #workskin h3, #workskin h4, #workskin h5, #workskin h6 {
      color: var(--text-color, #333);
      border-bottom: 2px solid var(--primary-color, #3b82f6);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    
    #workskin p {
      color: var(--text-color, #333);
      margin-bottom: 12px;
    }
    
    #workskin a {
      color: var(--primary-color, #3b82f6);
    }
    
    #workskin a:hover {
      text-decoration: underline;
    }
    
    #workskin blockquote {
      border-left: 4px solid var(--primary-color, #3b82f6);
      background-color: var(--input-bg-color, #f3f4f6);
      padding: 16px;
      margin: 16px 0;
      border-radius: 4px;
      color: var(--text-color, #333);
    }
    
    #workskin .notes {
      background-color: var(--input-bg-color, #f3f4f6);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    #workskin .notes h3 {
      color: var(--secondary-text-color, #6b7280);
      margin-top: 0;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }
    
    #workskin .title a {
      color: var(--primary-color, #3b82f6);
      font-weight: bold;
    }
    
    /* Image Specific Styles */
    #workskin img {
      max-width: 100%; /* Ensures images don't overflow the container */
      height: auto; /* Maintains aspect ratio */
      display: block; /* Allows margin: auto for centering */
      margin-left: auto;
      margin-right: auto;
    }

    /* Ensure custom work styles still work but respect theme colors where appropriate */
    #workskin *:not([style*="color"]) {
      color: inherit;
    }
    
    /* AO3 extracted styles (will override theme styles where specifically defined) */
    ${cssStyles}
  </style>
</head>
<body>
  <div id="workskin">
    ${chapterHtml}
  </div>
</body>
</html>`;
}

function generateThemeCSS(theme) {
  return `
    :root {
      --bg-color: ${theme.backgroundColor};
      --text-color: ${theme.textColor};
      --secondary-text-color: ${theme.secondaryTextColor};
      --card-bg-color: ${theme.cardBackground};
      --input-bg-color: ${theme.inputBackground};
      --border-color: ${theme.borderColor};
      --primary-color: ${theme.primaryColor};
      --icon-color: ${theme.iconColor};
      --placeholder-color: ${theme.placeholderColor};
    }
  `;
}

function getElementHtml(element) {
  if (!element) return null;

  let html = `<${element.tagName}`;

  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      html += ` ${attr.name}="${attr.value}"`;
    }
  }

  html += '>';

  if (element.childNodes) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === 3) {
        html += child.nodeValue;
      } else if (child.nodeType === 1) {
        html += getElementHtml(child);
      }
    }
  }

  html += `</${element.tagName}>`;

  return html;
}