import ky from 'ky';
import { Work } from '../../storage/models/work';
import { getJsonSettings } from '../../storage/jsonSettings';
import { fetchChapters } from './fetchChapters';
import { processQueue } from '../../downloads/DownloadManager';
import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

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

function extractChapters(doc) {
  const chapters = [];

  const selectElement = doc.getElementById("selected_id");
  if (!selectElement) return chapters;

  const options = selectElement.getElementsByTagName("option");

  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    const chapterId = option.getAttribute("value");
    const optionText = getElementText(option);

    if (!chapterId || !optionText) continue;

    const match = optionText.match(/^(\d+)\.\s+(.+?)(?:\s+\[warning:.*\])?$/);

    if (match) {
      const chapterNumber = parseInt(match[1], 10);
      let chapterName = match[2].trim();

      chapterName = chapterName.replace(/\s*\[warning:.*\].*$/i, '').trim();

      chapters.push({
        id: parseInt(chapterId, 10),
        workId: null,
        number: chapterNumber,
        name: `${chapterNumber}. ${chapterName}`,
        date: null
      });
    }
  }

  return chapters;
}

export function extractWorkContent(doc) {
  const result = {
    title: null,
    author: null,
    summary: null,
    summaryHTML: ""
  };

  const workskinElement = doc.getElementById("workskin");
  if (!workskinElement) return result;

  const h2Elements = workskinElement.getElementsByTagName("h2");
  for (let i = 0; i < h2Elements.length; i++) {
    if (h2Elements[i].getAttribute("class") === "title heading") {
      result.title = getElementText(h2Elements[i]);
      break;
    }
  }

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

  const divElements = workskinElement.getElementsByTagName("div");
  for (let i = 0; i < divElements.length; i++) {
    if (divElements[i].getAttribute("class") === "summary module") {
      const blockquote = divElements[i].getElementsByTagName("blockquote")?.[0];
      if (blockquote) {
        result.summary = getElementText(blockquote);

        if (blockquote && blockquote.childNodes) {
          for (let j = 0; j < blockquote.childNodes.length; j++) {
            result.summaryHTML += blockquote.childNodes[j].toString();
          }
        }
        result.summaryHTML = result.summaryHTML.trim() || null;
      }
      break;
    }
  }

  return result;
}

export async function fetchWorkFromWorkID(workId, workDAO, chapterDAO, force = false, downloadOnUpdate = false) {
  try {
    if (!force) {
      const cachedWork = await workDAO.get(workId);

      if (cachedWork) {
        const cachedChapters = await chapterDAO.getChaptersForWork(workId);

        if (cachedChapters && cachedChapters.length > 0) {
          console.log(
            `[Cache] Returning complete work ${workId} with ${cachedChapters.length} chapters.`,
          );
          cachedWork.chapters = cachedChapters;
          return cachedWork;
        } else {
          console.log(
            `[Cache] Work ${workId} exists, but has NO chapters. Fetching from web...`,
          );
        }
      }
    }

    const url = `https://archiveofourown.org/works/${workId}?view_adult=true`;
    console.log(`[Web] Fetching work from: ${url}`);

    const response = await getUrl(url);
    const doc = new DomParser().parseFromString(response, 'text/html');

    if (!doc) {
      console.error(`Failed to parse HTML for work ${workId}`);
      return null;
    }

    const metadata = extractWorkMetadata(doc);
    const content = extractWorkContent(doc);

    let rawChapters = (await getJsonSettings()).showChapterDate
      ? await fetchChapters(workId)
      : extractChapters(doc);

    if (!rawChapters || rawChapters.length === 0) {
      console.log('No chapters found in dropdown. Assuming One-Shot.');
      rawChapters = [
        {
          id: -parseInt(workId, 10),
          workId: workId,
          number: 1,
          name: content.title || 'One-shot',
          date: metadata.published
            ? new Date(metadata.published).getTime()
            : Date.now(),
        },
      ];
    }

    const cleanChapters = rawChapters.map((ch, index) => ({
      id: ch.id,
      workId: workId,
      number: ch.number || index + 1,
      name: ch.name || `Chapter ${index + 1}`,
      date: ch.date ? new Date(ch.date).getTime() : Date.now(),
    }));

    const chapterInfo = parseChapters(metadata.chapters);
    const isCompleted = metadata.completed !== null;

    const warningStatus = metadata.warnings.some(w =>
      w.includes('Choose Not To Use Archive Warnings'),
    )
      ? 'Choose Not To Use Archive Warnings'
      : metadata.warnings.length > 0
      ? 'Yes'
      : 'No';

    const work = new Work({
      id: workId,
      title: content.title || 'Unknown Title',
      author: content.author || 'Anonymous',
      kudos: metadata.kudos || 0,
      hits: metadata.hits || 0,
      language: metadata.language || 'English',
      updated: metadata.published || Date.now(),
      bookmarks: metadata.bookmarks || 0,
      tags: metadata.tags || [],
      warnings: metadata.warnings || [],
      description: content.summary || '',
      descriptionHTML: content.summaryHTML || '',
      chapters: cleanChapters,
      currentChapter: chapterInfo.current,
      chapterCount: chapterInfo.total || "?",
      rating: metadata.rating || 'Not Rated',
      category: metadata.category || 'None',
      warningStatus: warningStatus,
      isCompleted: isCompleted ? 1 : 0,
    });

    console.log(`[DB] Updating Work Metadata...`);
    await workDAO.add(work);

    console.log(`[DB] Syncing ${cleanChapters.length} chapters...`);

    await chapterDAO.syncChaptersForWork(workId, cleanChapters, downloadOnUpdate);
    const jsonSetting = await getJsonSettings();
    if (jsonSetting.downloadOnUpdate && downloadOnUpdate) {
      processQueue()
    }

    console.log(`Successfully fetched and cached: ${work.title}`);
    return work;
  } catch (error) {
    console.error(`Error fetching work ${workId}:`, error);
    return null;
  }
}