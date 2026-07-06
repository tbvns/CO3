import { fetchChapter } from '../web/worksScreen/fetchChapter';
import RNFS from 'react-native-fs';
import { DeviceEventEmitter } from 'react-native';

export function buildPath(workId, chapterId) {
  return `${RNFS.DocumentDirectoryPath}/CO3/downloads/${workId}/${chapterId}`;
}

export async function downloadChapter(workId, chapterId) {
  const [html, css] = await fetchChapter(workId, chapterId);
  await saveFile(html, css, workId, chapterId);
}

const saveFile = async (html, css, workId, chapterId) => {
  const path = buildPath(workId, chapterId);

  try {
    await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/CO3/`);
    await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/CO3/downloads/`);
    await RNFS.mkdir(`${RNFS.DocumentDirectoryPath}/CO3/downloads/${workId}/`);

    await RNFS.writeFile(path + ".html", html, 'utf8');
    await RNFS.writeFile(path + ".css", css, 'utf8');
    console.log(`Download successful ${chapterId} from work ${workId} to ${path}.html and .css`);
  } catch (err) {
    console.log(err.message);
  }
};

export async function isDownloaded(workId, chapterId) {
  const path = buildPath(workId, chapterId);
  return await RNFS.exists(path + ".html") && await RNFS.exists(path + ".css");
}

export const getDownloaded = async (workId, chapterId) => {
  const path = buildPath(workId, chapterId);
  return [
    await RNFS.readFile(path + ".html", 'utf8'),
    await RNFS.readFile(path + '.css', 'utf8'),
  ];
}

export const deleteDownloaded = async (workId, chapterId) => {
  try {
    const path = buildPath(workId, chapterId);
    await RNFS.unlink(path + '.html');
    await RNFS.unlink(path + '.css');
    DeviceEventEmitter.emit('chapter_deleted', {
      chapterId: String(chapterId),
      success: true,
    });
  } catch (err) {
    DeviceEventEmitter.emit('chapter_deleted', {
      chapterId: String(chapterId),
      success: false,
    });
  }
}