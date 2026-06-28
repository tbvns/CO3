import RNFS from 'react-native-fs';
import ky from 'ky';
import { Buffer } from 'buffer';

const FORMATS = ["azw3", "epub", "mobi", "pdf", "html"];

export async function nativeDownload(workId, format, name) {
  const url = `https://archiveofourown.org/downloads/${workId}/work.${format}`;
  const safeName = name.replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `${safeName}.${format}`;
  const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;

  try {
    const arrayBuffer = await ky.get(url, {
      timeout: 120000,
      retry: {
        limit: 3,
        delay: attemptCount => 500 * 2 ** attemptCount,
      },
      hooks: {
        beforeRetry: [
          ({ attemptCount }) => console.log(`Retrying download (attempt ${attemptCount})...`),
        ],
      },
    }).arrayBuffer();

    const base64 = Buffer.from(arrayBuffer).toString('base64');

    await RNFS.writeFile(destPath, base64, 'base64');

    return { success: true, path: destPath };
  } catch (err) {
    console.error('nativeDownload error:', err);
    throw err;
  }
}