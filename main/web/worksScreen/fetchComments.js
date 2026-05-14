import ky from 'ky';

let DomParser = require('react-native-html-parser').DOMParser;

class Comment {
  constructor({ id, isBanner = false, isDeleted = false, author = "", authorIsDeleted = false, authorIsGuest = false, authorImg = "", username = null, date = "", content = "", html = "", children = [] }) {
    this.id = id;
    this.isBanner = isBanner;
    this.isDeleted = isDeleted;
    this.author = author;
    this.authorIsDeleted = authorIsDeleted;
    this.authorIsGuest = authorIsGuest;
    this.authorImg = authorImg;
    this.username = username;
    this.date = date;
    this.content = content;
    this.html = html;
    this.children = children;
  }
}

function getElementText(element) {
  if (!element) return null;
  let text = "";
  if (element.nodeType === 3) return element.nodeValue?.trim() || null;

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    text += child.nodeType === 3 ? child.nodeValue : getElementText(child) || "";
  }
  return text.trim() || null;
}

export async function fetchComments(setCannotNext, setStep, preferHTML, singleChapter, workOrChapterId, page = 1) {
  try {
    setStep("Fetching");
    var url = `https://archiveofourown.org/comments/show_comments?${singleChapter ? 'work' : 'chapter'}_id=${Math.abs(workOrChapterId)}`;
    if (!singleChapter) url += '&page=' + page

    console.log(`Fetching comments from: ${url}`);

    const headers = new Headers({
      "Accept": "*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
      "Accept-Language": "en-US,en;q=0.5",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-GPC": "1",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Priority": "u=0"
    });
    const response = await ky.get(url, { headers }).text();
    setCannotNext(response.includes('$j("#comments_placeholder").html("");') || response.includes('<span class=\\"disabled\\">Next &#8594;<\\/span>'))
    const htmlCT = response.split('.append("<!-- START thread -->')[1].split('");')[0].replaceAll('\\n','').replaceAll('\\','');
    setStep("Parsing");
    const doc = new DomParser().parseFromString(htmlCT, "text/html");

    if (!doc) {
      console.error(`Failed to parse HTML for work or chapter ${workOrChapterId}`);
      return null;
    }

    const comments = [];
    const wfpComments = {};
    const coms = doc.getElementsByClassName("comment", false);

    const addComment = (comment, parentId) => {
      if (wfpComments[comment.id]) {
        wfpComments[comment.id].forEach(com => comment.children.push(com));
        delete wfpComments[comment.id];
      }
      if (wfpComments.next) {
        wfpComments.next.forEach(com => comment.children.push(com));
        delete wfpComments.next;
      }
      if (parentId) {
        if (!wfpComments[parentId]) wfpComments[parentId] = []
        wfpComments[parentId].push(comment);
      } else comments.push(comment);
    }

    setStep("Extracting");
    for (let i = coms.length -1; i > -1; i--) {
      if (coms[i].childNodes.length < 2) {
        addComment(new Comment({ id: i, isBanner: true, html: coms[i].childNodes[0].toString().replace('/comments/', 'https://archiveofourown.org/comments/') }), "next")
        continue
      }

      const id = coms[i].getAttribute("id").split("_")[1];

      if (coms[i].childNodes.length < 3) {
        addComment(new Comment({ id, isDeleted: true }), coms[i].parentNode.parentNode.tagName !== "li" || "next")
        continue
      }

      const comH = coms[i].getElementsByClassName("byline", false)[0];

      const authorIsDeleted = comH.childNodes[0].length > 12;
      let author, authorIsGuest, username;
      if (!authorIsDeleted) {
        const aOrSpan = comH.childNodes[1];
        let authorURL = aOrSpan.getAttribute("href")?.split("/");
        if (authorURL && authorURL.length > 2) username = authorURL[2];
        authorIsGuest = aOrSpan.tagName !== "a";
        author = getElementText(aOrSpan);
      }

      const datetime = comH.getElementsByClassName("datetime", false)[0];
      const timestamp = getElementText(datetime).replace(/\s+/g, ' ').trim();

      const icon = coms[i].getElementsByTagName("img")?.[0];
      const authorImg = icon?.getAttribute("src") || null;

      const blockquote = coms[i].getElementsByTagName("blockquote")[0];
      let html, content;
      if (preferHTML) html = Array.from(blockquote.childNodes).map(v=>v.toString()).join('');
      else content = getElementText(blockquote);

      const actions = coms[i].getElementsByClassName("actions", false)[0].getElementsByTagName("a");
      let parentId = null;
      for (let a = 0; a < actions.length; a++) {
        if (getElementText(actions[a]).toLowerCase() === "parent") parentId = actions[a].getAttribute("href").split("/comments/")[1];
      }

      const comment = new Comment({
        id,
        authorIsDeleted,
        authorIsGuest,
        author,
        username,
        date: timestamp,
        authorImg,
        content,
        html
      });

      addComment(comment, parentId);
    }

    return comments.reverse();
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}
