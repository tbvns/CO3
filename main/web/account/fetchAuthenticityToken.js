import ky from 'ky';

let DomParser = require('react-native-html-parser').DOMParser;

export async function fetchLoginAuthenticityToken() {
  try {
    let html = await ky.get("https://archiveofourown.org/users/login").text();
    html = html.replace("<br \\>", ''); //Before you ask, no. I don't know. I don't need them anyway. /shrug
    return new DomParser().parseFromString(html, "text/html")
      .getElementById("new_user") //Get the form
      .childNodes[0].getAttribute('value') //Get the hidden element and it's value
  } catch (e) {
    console.error("An error occurred while running fetchLoginAuthenticityToken", e);
  }
}

export async function fetchKudoAuthenticityToken(workId) {
  try {
    let html = await ky.get("http://archiveofourown.org/works/" + workId).text();
    html = html.replace("<br \\>", '');

    const doc = new DomParser().parseFromString(html, "text/html");
    const kudoForm = doc.getElementById("new_kudo");

    if (!kudoForm) {
      throw new Error("Kudo form not found on the page");
    }

    // Find the authenticity token input within the form
    const tokenInput = kudoForm.childNodes[0];

    if (!tokenInput) {
      throw new Error("Authenticity token not found in kudo form");
    }

    return tokenInput.getAttribute('value');

  } catch (e) {
    console.error("An error occurred while running fetchKudoAuthenticityToken", e);
    throw e; // Re-throw to allow caller to handle
  }
}
