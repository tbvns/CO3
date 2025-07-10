import ky from "ky";
let DomParser = require("react-native-html-parser").DOMParser;

class Chapter {
  constructor({ id, name, workId, date }) {
    this.id = id;
    this.name = name;
    this.workId = workId;
    this.date = date;
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

function parseChapterElements(chapterElements, workId) {
  return chapterElements.map(chapterElement => {
    const linkElement = chapterElement.getElementsByTagName("a")[0];
    const dateElement = chapterElement.getElementsByClassName("datetime")[0];

    if (!linkElement) return null;

    const href = linkElement.getAttribute("href");
    const chapterName = getElementText(linkElement);
    const dateText = getElementText(dateElement);

    let chapterId = null;
    if (href) {
      const match = href.match(/\/chapters\/(\d+)/);
      if (match) {
        chapterId = match[1];
      }
    }

    // Clean up date text - remove parentheses
    const cleanDate = dateText ? dateText.replace(/[()]/g, '') : null;

    return new Chapter({
      id: chapterId,
      name: chapterName,
      workId: workId,
      date: cleanDate
    });
  }).filter(chapter => chapter !== null);
}

export async function fetchChapters(workId) {
  try {
    const url = `https://archiveofourown.org/works/${workId}/navigate`;

    console.log(`Fetching chapters from: ${url}`);
    const response = await ky.get(url).text();
    const doc = new DomParser().parseFromString(response, "text/html");

    // Find the chapter index list
    const chapterList = doc.getElementsByClassName("chapter index group")[0];
    if (!chapterList) {
      console.log("No chapter list found");
      return [];
    }

    // Get all list items from the chapter list
    const chapterElements = Array.from(chapterList.getElementsByTagName("li"));

    const chapters = parseChapterElements(chapterElements, workId);

    console.log(`Found ${chapters.length} chapters for work ${workId}`);

    return chapters;
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}
