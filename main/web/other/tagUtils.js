import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function checkTagCanonical(tagName) {
  if (!tagName) {
    throw new Error('checkTagCanonical: tagName is required');
  }

  const encodedTag = encodeURIComponent(tagName.replace(/\//g, '*s*'));
  const url = `https://archiveofourown.org/tags/${encodedTag}`;

  console.log(`Checking tag: ${url}`);

  let response;
  try {
    response = await getUrl(url);
  } catch (error) {
    console.error('checkTagCanonical: network error', error);
    throw error;
  }

  if (!response) {
    return { isCanonical: false, exists: false, category: null, canonicalFor: null };
  }

  const doc = new DomParser().parseFromString(response, 'text/html');

  const notices = Array.from(doc.getElementsByTagName('p'))
    .map(p => p.getAttribute('class') || '');
  const mainDiv = doc.getElementById('main');
  if (!mainDiv) {
    return { isCanonical: false, exists: false, category: null, canonicalFor: null };
  }

  const allLinks = Array.from(doc.getElementsByTagName('a'));
  const canonicalLink = allLinks.find(
    a => (a.getAttribute('href') || '').includes('/faq/glossary#canonicaldef')
  );

  const isCanonical = Boolean(canonicalLink);


  let category = null;
  if (isCanonical && canonicalLink) {
    const parentP = canonicalLink.parentNode;
    if (parentP) {
      const fullText = getNodeText(parentP);
      const categoryMatch = fullText.match(/belongs to the (.+?) Category/i);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
      }
    }
  }

  let canonicalFor = null;
  if (!isCanonical) {
    const allParagraphs = Array.from(doc.getElementsByTagName('p'));
    for (const p of allParagraphs) {
      const text = getNodeText(p);
      if (text.toLowerCase().includes('synonym of') || text.toLowerCase().includes('merger of')) {
        // Find the linked canonical tag name
        const synonymLink = Array.from(p.getElementsByTagName('a')).find(a => {
          const href = a.getAttribute('href') || '';
          return href.startsWith('/tags/') && !href.includes('/works') && !href.includes('/bookmarks');
        });
        if (synonymLink) {
          canonicalFor = getNodeText(synonymLink);
        }
        break;
      }
    }
  }

  const bodyText = getNodeText(doc.getElementsByTagName('body')[0] || doc);
  const exists = !bodyText.toLowerCase().includes("couldn't find the tag");

  console.log(`Tag "${tagName}": exists=${exists}, isCanonical=${isCanonical}, category=${category}, canonicalFor=${canonicalFor}`);

  return { isCanonical, exists, category, canonicalFor };
}

function getNodeText(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.nodeValue ?? '';
  return Array.from(node.childNodes ?? [])
    .map(child => getNodeText(child))
    .reduce((acc, text) => acc + text, '');
}