import getUrl from '../requestManager';

let DomParser = require('react-native-html-parser').DOMParser;

async function scrapeUserPage(url, username) {
  const res = await getUrl(url);

  const doc = new DomParser().parseFromString(res, "text/html");
  const avatar = Array.from(doc.getElementsByTagName("img")).filter(img => img?.getAttribute("class") === "icon")[0];
  const bio = Array.from(doc.getElementsByTagName("blockquote"))
    .filter(a => a.getAttribute("class") === `userstuff` && a.parentNode.getAttribute("id") !== "admin-banner")[0];

  const meta = Array.from(doc.getElementsByTagName("dl"))
    .filter(a => a.getAttribute("class") === `meta`)[0];
  console.log(meta);
  const joinDate = meta?.childNodes[7]?.textContent;

  console.log(avatar);

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

export async function getUserInfo(username) {
  const url = `https://archiveofourown.org/users/${username}/profile`;
  return scrapeUserPage(url, username);
}

export async function getUserInfoByPseud(username, pseud) {
  const url = `https://archiveofourown.org/users/${username}/pseuds/${encodeURIComponent(pseud)}`;
  return scrapeUserPage(url, username);
}