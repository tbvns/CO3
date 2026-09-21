import { getUsername } from '../../storage/Credentials';
import { parseWorkElements } from '../browse/fetchWorks';
import getUrl, { postUrl } from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function fetchBookmarks(page, username, pseud, noWebview = false) {
  let url;
  try {
    const resolvedUsername = username || await getUsername();
    if (pseud) {
      url = `https://archiveofourown.org/users/${resolvedUsername}/pseuds/${encodeURIComponent(pseud)}/bookmarks?page=${page}`;
    } else {
      url = `https://archiveofourown.org/users/${resolvedUsername}/bookmarks?page=${page}`;
    }

    console.log(`Fetching bookmarks from: ${url}`);
    const response = await getUrl(url, noWebview);
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

    return parseWorkElements(workElements);

  } catch (error) {
    throw error;
  } finally {
    console.log("finished loading", url);
  }
}

export async function bookmark(work) {
  try {
    const workId = work.id;
    const url = `https://archiveofourown.org/works/${workId}/bookmarks/new`;
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const html = await getUrl(url, {
      credentials: 'include',
      headers: { 'User-Agent': userAgent },
    });

    const getAttributeValue = (tagString, attributeName) => {
      const regex = new RegExp(`${attributeName}="([^"]+)"`, 'i');
      const match = tagString.match(regex);
      return match ? match[1] : null;
    };

    const tokenTagMatch = html.match(/<input[^>]*name="authenticity_token"[^>]*>/i);
    if (!tokenTagMatch) throw new Error('Authenticity token tag not found');
    const token = getAttributeValue(tokenTagMatch[0], 'value');

    const pseudTagMatch = html.match(/<input[^>]*name="bookmark\[pseud_id\]"[^>]*>/i);

    let pseudId = null;
    if (pseudTagMatch) {
      pseudId = getAttributeValue(pseudTagMatch[0], 'value');
    } else {
      const selectMatch = html.match(/<select[^>]*name="bookmark\[pseud_id\]"[^>]*>[\s\S]*?<option[^>]*value="([^"]+)"[^>]*selected/i);
      pseudId = selectMatch ? selectMatch[1] : null;
    }

    if (!token || !pseudId) {
      throw new Error(`Extraction failed. Token: ${!!token}, Pseud: ${!!pseudId}`);
    }

    const body = new URLSearchParams({
      authenticity_token: token,
      'bookmark[pseud_id]': pseudId,
      'bookmark[private]': '0',
      'bookmark[rec]': '0',
      commit: 'Create',
    }).toString();

    const postResponse = await postUrl(
      `https://archiveofourown.org/works/${workId}/bookmarks`,
      {
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: url,
          'User-Agent': userAgent,
        },
      },
    );

    if (postResponse.ok || postResponse.status === 302) {
      console.log('Bookmarked successfully!');
      return true;
    }

    throw new Error(`Post failed with status: ${postResponse.status}`);

  } catch (error) {
    console.error('Error bookmarking:', error);
    throw error;
  }
}