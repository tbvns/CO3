import { fetchKudoAuthenticityToken } from '../account/fetchAuthenticityToken';
import { getCredsToken } from '../../storage/Credentials';

const KUDOS_URL = 'https://archiveofourown.org/kudos';

export default async function sendKudo(workId) {
  const authenticityToken = await fetchKudoAuthenticityToken(workId);

  const body = new URLSearchParams({
    authenticity_token: authenticityToken,
    'kudo[commentable_id]': workId,
    'kudo[commentable_type]': 'Work',
    commit: 'Kudos ♥',
  }).toString();

  const sessionToken = await getCredsToken();

  const response = await fetch(KUDOS_URL, {
    method: 'POST',
    credentials: 'include',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      Referer: `https://archiveofourown.org/works/${workId}`,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Cookie: `user_credentials=1; _otwarchive_session=${sessionToken}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to send kudos: ${response.status} ${response.statusText}`,
    );
  }

  let finalPath = '';
  try {
    finalPath = new URL(response.url).pathname;
  } catch {
    finalPath = response.url || '';
  }
  const workPath = `/works/${workId}`;
  if (finalPath === workPath || finalPath.startsWith(`${workPath}/`)) {
    return true;
  }

  const text = await response.text();
  if (
    text.includes('Thank you for leaving kudos!') ||
    text.includes('already left kudos')
  ) {
    return true;
  }

  console.warn('Kudos request completed but success unclear', {
    url: response.url,
    status: response.status,
  });
  return false;
}
