import { getUsername } from '../../storage/Credentials';
import ky from 'ky';
import { parseWorkElements } from '../browse/fetchWorks';
let DomParser = require("react-native-html-parser").DOMParser;

export async function fetchBookmarks(page, username) {
  let url;
  try {
    if (username) {
      url = `https://archiveofourown.org/users/${username}/bookmarks?page=${page}`;
    } else {
      url = `https://archiveofourown.org/users/${await getUsername()}/bookmarks?page=${page}`;
    }

    console.log(`Fetching works from: ${url}`);
    const response = await ky.get(url).text();
    const doc = new DomParser().parseFromString(response, "text/html");

    const mainDiv = doc.getElementById("main");

    if (!mainDiv) {
      console.log("No main div found");
      return null;
    }

    const olElements = mainDiv.getElementsByTagName("ol");
    if (!olElements || olElements.length === 0) {
      console.log("No ol element found");
      return null;
    }

    let workElements = Array.from(olElements[0].getElementsByTagName("li"))
      .filter(li => li.getAttribute("class")?.includes("bookmark blurb"));

    if (workElements.length === 0) {
      workElements = Array.from(olElements[1].getElementsByTagName("li"))
        .filter(li => li.getAttribute("class")?.includes("bookmark blurb"));
    }

    return parseWorkElements(workElements)

  } catch (error) {
    console.error(error);
    return null;
  } finally {
    console.log("finished loading", url);
  }
}