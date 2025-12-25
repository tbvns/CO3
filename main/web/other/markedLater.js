import { getUsername } from '../../storage/Credentials';
import ky from 'ky';
import { parseWorkElements } from '../browse/fetchWorks';

let DomParser = require("react-native-html-parser").DOMParser;

export async function fetchMarkedLater(page){
  const url = `https://archiveofourown.org/users/${await getUsername()}/readings?show=to-read&page=${page}`;

  const res = await ky.get(url).text();
  const doc = await new DomParser().parseFromString(res, "text/html");

  const workElements = Array.from(doc.getElementsByTagName("li"))
    .filter(li => li.getAttribute("class")?.includes("work blurb"));

  return parseWorkElements(workElements);
}

export async function markForLater(work) {
  try {
    const workId = work.id;
    const url = `https://archiveofourown.org/works/${workId}`;

    const pageResponse = await fetch(url, {
      credentials: 'include',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    //Fuck DOM parsing, this is easier. Imma do more of that since it works so much better
    const html = await pageResponse.text();

    const formMatch = html.match(
      /action="([^"]*\/mark_for_later[^"]*)"/
    );
    if (!formMatch) {
      throw new Error('Mark for later form not found');
    }

    const action = formMatch[1];

    const tokenMatch = html.match(
      /name="authenticity_token"\s+value="([^"]+)"/
    );
    if (!tokenMatch) {
      throw new Error('Authenticity token not found');
    }

    const token = tokenMatch[1];
    const markUrl = `https://archiveofourown.org${action}`;

    const formData = new FormData();
    formData.append('authenticity_token', token);
    formData.append('_method', 'patch');

    const response = await fetch(markUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': url,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(
        `Failed to mark for later: ${response.status} ${response.statusText}`
      );
    }

    console.log('Marked for later successfully!');
    return true;

  } catch (error) {
    console.error('Error marking for later:', error);
    throw error;
  }
}