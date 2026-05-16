import ky from 'ky';
import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

export async function getUserInfo( username ) {

  const url = `https://archiveofourown.org/users/${username}/profile`;

  const res = await getUrl(url);

  const doc = new DomParser().parseFromString(res, "text/html");
  const avatarParent = Array.from(doc.getElementsByTagName("a")).filter(a => a ? a.getAttribute("href") === `/users/${username}` : false);
  const avatar = avatarParent[1].getElementsByTagName("img")[0];
  const bio = Array.from(doc.getElementsByTagName("blockquote"))
    .filter(a => a.getAttribute("class") === `userstuff` && a.parentNode.getAttribute("id") !== "admin-banner")[0];

  const meta = Array.from(doc.getElementsByTagName("dl"))
    .filter(a => a.getAttribute("class") === `meta`)[0];
  console.log(meta);
  const joinDate = meta.childNodes[7].textContent;


  let avatarUrl = avatar.getAttribute("src");
  if (avatarUrl === "/images/skins/iconsets/default/icon_user.png") {
    avatarUrl = "https://archiveofourown.org/images/skins/iconsets/default/icon_user.png";
  }

  return {
    username: username,
    avatarUrl: avatarUrl,
    bio: bio,
    joinDate: joinDate,
  };
}