import ky from "ky";
import {Work} from "../../storage/models/work";
let DomParser = require("react-native-html-parser").DOMParser;

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

function parseDate(dateString) {
  if (!dateString) return null;
  try {
    return new Date(dateString).getTime();
  } catch {
    return null;
  }
}

function parseChapters(chapterText) {
  if (!chapterText) return { current: 1, total: null };

  const match = chapterText.match(/(\d+)\/(\d+|\?)/);
  if (match) {
    return {
      current: parseInt(match[1], 10),
      total: match[2] === '?' ? null : parseInt(match[2], 10)
    };
  }
  return { current: 1, total: null };
}

function extractWorkMetadata(doc) {
  const result = {
    rating: null,
    warnings: [],
    category: null,
    language: null,
    tags: [],
    published: null,
    completed: null,
    words: null,
    chapters: null,
    comments: null,
    kudos: null,
    bookmarks: null,
    hits: null
  };

  // Find the main dl element with class "work meta group"
  const dlElements = doc.getElementsByTagName("dl");
  let metaDL = null;
  for (let i = 0; i < dlElements.length; i++) {
    if (dlElements[i].getAttribute("class") === "work meta group") {
      metaDL = dlElements[i];
      break;
    }
  }

  if (!metaDL) return result;

  const dtElements = metaDL.getElementsByTagName("dt");
  const ddElements = metaDL.getElementsByTagName("dd");

  for (let i = 0; i < dtElements.length && i < ddElements.length; i++) {
    const dtClass = dtElements[i].getAttribute("class");
    const ddElement = ddElements[i];

    if (dtClass === "rating tags") {
      const ratingLink = ddElement.getElementsByTagName("a")?.[0];
      if (ratingLink) {
        result.rating = getElementText(ratingLink);
      }
    } else if (dtClass === "warning tags") {
      const warningLinks = ddElement.getElementsByTagName("a");
      for (let j = 0; j < warningLinks.length; j++) {
        const warningText = getElementText(warningLinks[j]);
        if (warningText) {
          result.warnings.push(warningText);
        }
      }
    } else if (dtClass === "category tags") {
      const categoryLink = ddElement.getElementsByTagName("a")?.[0];
      if (categoryLink) {
        result.category = getElementText(categoryLink);
      }
    } else if (dtClass === "language") {
      result.language = getElementText(ddElement);
    } else if (dtClass === "relationship tags" || dtClass === "freeform tags") {
      const tagLinks = ddElement.getElementsByTagName("a");
      for (let j = 0; j < tagLinks.length; j++) {
        const tagText = getElementText(tagLinks[j]);
        if (tagText) {
          result.tags.push(tagText);
        }
      }
    } else if (dtClass === "stats") {
      // Handle nested stats dl
      const statsDL = ddElement.getElementsByTagName("dl")?.[0];
      if (statsDL) {
        const statsDTs = statsDL.getElementsByTagName("dt");
        const statsDDs = statsDL.getElementsByTagName("dd");

        for (let j = 0; j < statsDTs.length && j < statsDDs.length; j++) {
          const statClass = statsDTs[j].getAttribute("class");
          const statText = getElementText(statsDDs[j]);

          if (statClass === "published") {
            result.published = parseDate(statText);
          } else if (statClass === "words") {
            result.words = parseInt(statText?.replace(/,/g, '') || '0', 10) || 0;
          } else if (statClass === "chapters") {
            result.chapters = statText;
          } else if (statClass === "hits") {
            result.hits = parseInt(statText?.replace(/,/g, '') || '0', 10) || 0;
          } else if (statClass === "comments") {
            result.comments = parseInt(statText?.replace(/,/g, '') || '0', 10) || 0;
          } else if (statClass === "kudos") {
            result.kudos = parseInt(statText?.replace(/,/g, '') || '0', 10) || 0;
          } else if (statClass === "bookmarks") {
            // Check if bookmarks is a link
            const bookmarkLink = statsDDs[j].getElementsByTagName("a")?.[0];
            const bookmarkText = bookmarkLink ? getElementText(bookmarkLink) : statText;
            result.bookmarks = parseInt(bookmarkText?.replace(/,/g, '') || '0', 10) || 0;
          }
        }
      }
    }
  }

  return result;
}

function extractWorkContent(doc) {
  const result = {
    title: null,
    author: null,
    summary: null
  };

  const workskinElement = doc.getElementById("workskin");
  if (!workskinElement) return result;

  // Extract title from h2 with class "title heading"
  const h2Elements = workskinElement.getElementsByTagName("h2");
  for (let i = 0; i < h2Elements.length; i++) {
    if (h2Elements[i].getAttribute("class") === "title heading") {
      result.title = getElementText(h2Elements[i]);
      break;
    }
  }

  // Extract author from h3 with class "byline heading"
  const h3Elements = workskinElement.getElementsByTagName("h3");
  for (let i = 0; i < h3Elements.length; i++) {
    if (h3Elements[i].getAttribute("class") === "byline heading") {
      const authorLink = h3Elements[i].getElementsByTagName("a")?.[0];
      if (authorLink) {
        result.author = getElementText(authorLink);
      }
      break;
    }
  }

  // Extract summary from div with class "summary module"
  const divElements = workskinElement.getElementsByTagName("div");
  for (let i = 0; i < divElements.length; i++) {
    if (divElements[i].getAttribute("class") === "summary module") {
      const blockquote = divElements[i].getElementsByTagName("blockquote")?.[0];
      if (blockquote) {
        result.summary = getElementText(blockquote);
      }
      break;
    }
  }

  return result;
}

export async function fetchWorkFromWorkID(workId) {
  try {
    const url = `https://archiveofourown.org/works/${workId}?view_adult=true`;

    console.log(`Fetching work from: ${url}`);
    const response = await ky.get(url, ).text();
    const doc = new DomParser().parseFromString(response, "text/html");

    if (!doc) {
      console.error(`Failed to parse HTML for work ${workId}`);
      return null;
    }

    const metadata = extractWorkMetadata(doc);
    const content = extractWorkContent(doc);

    const chapterInfo = parseChapters(metadata.chapters);

    // Determine completion status
    const isCompleted = metadata.completed !== null;

    // Determine warning status
    const warningStatus = metadata.warnings.length > 0 &&
    metadata.warnings.some(warning => warning.includes("Choose Not To Use Archive Warnings"))
      ? "Choose Not To Use Archive Warnings"
      : metadata.warnings.length > 0 ? "Yes" : "No";

    const work = new Work({
      id: workId,
      title: content.title || null,
      author: content.author || null,
      kudos: metadata.kudos || 0,
      hits: metadata.hits || 0,
      language: metadata.language || null,
      updated: metadata.completed || metadata.published || null,
      bookmarks: metadata.bookmarks || 0,
      tags: metadata.tags || [],
      warnings: metadata.warnings || [],
      description: content.summary || null,
      chapters: [],
      currentChapter: chapterInfo.current,
      chapterCount: chapterInfo.total,
      rating: metadata.rating || null,
      category: metadata.category || null,
      warningStatus: warningStatus,
      isCompleted: isCompleted
    });

    console.log(`Successfully fetched work: ${content.title || 'Unknown Title'}`);
    return work;

  } catch (error) {
    console.error(`Error fetching work ${workId}:`, error);
    return null;
  }
}
