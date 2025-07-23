import ky from "ky";
let DomParser = require("react-native-html-parser").DOMParser;

export async function fetchChapter(workId, chapterId, currentTheme = null, settingsDAO) {
  try {
    const url = `https://archiveofourown.org/works/${workId}/chapters/${chapterId}?view_adult=true`;

    console.log(`Fetching chapter from: ${url}`);
    const response = await ky.get(url).text();
    const doc = new DomParser().parseFromString(response, "text/html");

    // Find the chapter div
    const chapterDiv = doc.getElementsByClassName("chapter")[1];
    if (!chapterDiv) {
      console.log("No chapter content found");
      return null;
    }

    // Extract CSS styles from the work div
    const workDiv = doc.getElementsByClassName("work")[0];
    let cssStyles = "";
    if (workDiv) {
      const styleElements = workDiv.getElementsByTagName("style");
      for (let i = 0; i < styleElements.length; i++) {
        const styleContent = getElementText(styleElements[i]);
        if (styleContent) {
          cssStyles += styleContent + "\n";
        }
      }
    }

    // Get the HTML content of the chapter div as a string
    const chapterHtml = getElementHtml(chapterDiv);

    // Create a complete HTML document with embedded CSS
    const completeHtml = await createCompleteHtml(chapterHtml, cssStyles, currentTheme, settingsDAO);

    console.log(`Successfully fetched chapter ${chapterId} from work ${workId}`);

    return completeHtml;
  } catch (error) {
    console.error("Error fetching chapter:", error);
    return null;
  }
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
  // Generate theme-based CSS variables
  const themeCSS = currentTheme ? generateThemeCSS(currentTheme) : '';

  const settings = await settingsDAO.getSettings();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter</title>
  <style>
    /* Theme variables */
    ${themeCSS}
    
    .landmark {
        visibility: hidden;
    }
    
    .title {
      display: none;
    }
    
    /* Base styles for better readability with theme integration */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
      text-decoration: none;
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
    
    #workskin .byline {
      color: var(--secondary-text-color, #6b7280);
    }
    
    #workskin .byline a {
      color: var(--primary-color, #3b82f6);
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

  // For react-native-html-parser, we need to reconstruct the HTML manually
  // since it doesn't have innerHTML property
  let html = `<${element.tagName}`;

  // Add attributes
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      html += ` ${attr.name}="${attr.value}"`;
    }
  }

  html += '>';

  // Add child nodes
  if (element.childNodes) {
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      if (child.nodeType === 3) {
        // Text node
        html += child.nodeValue;
      } else if (child.nodeType === 1) {
        // Element node
        html += getElementHtml(child);
      }
    }
  }

  html += `</${element.tagName}>`;

  return html;
}
