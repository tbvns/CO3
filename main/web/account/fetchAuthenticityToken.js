import ky from 'ky';

let DomParser = require('react-native-html-parser').DOMParser;

export default async function fetchLoginAuthenticityToken() {
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
