import { getUsername } from '../../storage/Credentials';
import { parseWorkElements } from '../browse/fetchWorks';
import getUrl, { postUrl } from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function fetchMarkedLater(page){
  const url = `https://archiveofourown.org/users/${await getUsername()}/readings?show=to-read&page=${page}`;

  const res = await getUrl(url);
  const doc = await new DomParser().parseFromString(res, "text/html");

  const workElements = Array.from(doc.getElementsByTagName("li"))
    .filter(li => li.getAttribute("class")?.includes("work blurb"));

  return parseWorkElements(workElements);
}


export async function markForLater(work) {
  try {
    const workId = work.id;
    const url = `https://archiveofourown.org/works/${workId}?view_adult=true`;

    const html = await getUrl(url);
    const doc = new DomParser().parseFromString(html, 'text/html');

    const forms = Array.from(doc.getElementsByTagName('form'));
    console.log(forms);
    const form = forms.find(f =>
      f.getAttribute('action')?.includes('/mark_for_later'),
    );

    if (!form) throw new Error('Mark for later form not found');

    const inputs = Array.from(doc.getElementsByTagName('input'));
    const token = inputs
      .find(i => i.getAttribute('name') === 'authenticity_token')
      ?.getAttribute('value');
    if (!token) throw new Error('Authenticity token not found');

    const markUrl = `https://archiveofourown.org${form.getAttribute('action')}`;

    const body = new URLSearchParams({
      authenticity_token: token,
      _method: 'patch',
    }).toString();

    const response = await postUrl(markUrl, {
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to mark for later: ${response.status} ${response.statusText}`,
      );
    }

    console.log('Marked for later successfully!');
    return true;
  } catch (error) {
    console.error('Error marking for later:', error);
    throw error;
  }
}