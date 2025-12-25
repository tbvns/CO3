import { fetchKudoAuthenticityToken } from '../account/fetchAuthenticityToken';
import { getCredsToken } from '../../storage/Credentials';

export default async function sendKudo(workId) {
  try {
    // Get the authenticity token
    const authenticityToken = await fetchKudoAuthenticityToken(workId);

    // Prepare the form data
    const formData = new FormData();
    formData.append('authenticity_token', authenticityToken);
    formData.append('kudo[commentable_id]', workId);
    formData.append('kudo[commentable_type]', 'Work');
    formData.append('commit', 'Kudos ♥');

    // Send the kudos request
    const response = await fetch('https://archiveofourown.org/kudos', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': `https://archiveofourown.org/works/${workId}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Cookie': `user_credentials=1; _otwarchive_session=${await getCredsToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to send kudos: ${response.status} ${response.statusText}`);
    }

    // Check if kudos was successful by examining the response
    // AO3 typically redirects back to the work page after successful kudos
    if (response.url.includes(`/works/${workId}`)) {
      console.log('Kudos sent successfully!');
      return true;
    }

    // Alternative check: look at response text for success indicators
    const responseText = await response.text();
    if (responseText.includes('Thank you for leaving kudos!') ||
      responseText.includes('already left kudos')) {
      console.log('Kudos processed (may have already been given)');
      return true;
    }

    console.warn('Kudos request completed but success unclear');
    console.log(response);
    return false;

  } catch (error) {
    console.error('Error sending kudos:', error);
    throw error;
  }
}
