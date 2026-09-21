// fetchAuthenticityToken.js
import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function fetchLoginAuthenticityToken() {
  try {
    let html = await getUrl('https://archiveofourown.org/users/login');
    html = html.replace('<br \\>', '');

    if (
      html.includes(
        'You are already logged in to an account. Please log out and try again.',
      )
    ) {
      throw 'already logged in.';
    }

    return new DomParser()
      .parseFromString(html, 'text/html')
      .getElementById('new_user')
      .childNodes[0].getAttribute('value');
  } catch (e) {
    console.error(
      'An error occurred while running fetchLoginAuthenticityToken',
      e,
    );
    throw e;
  }
}

export async function fetchKudoAuthenticityToken(workId) {
  try {
    let html = await getUrl('http://archiveofourown.org/works/' + workId);
    html = html.replace('<br \\>', '');

    const doc = new DomParser().parseFromString(html, 'text/html');
    const kudoForm = doc.getElementById('new_kudo');

    if (!kudoForm) {
      throw new Error('Kudo form not found on the page');
    }

    const tokenInput = kudoForm.childNodes[0];

    if (!tokenInput) {
      throw new Error('Authenticity token not found in kudo form');
    }

    return tokenInput.getAttribute('value');
  } catch (e) {
    console.error(
      'An error occurred while running fetchKudoAuthenticityToken',
      e,
    );
    throw e;
  }
}
