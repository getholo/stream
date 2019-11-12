import axios from 'axios';

import { withCredentials, DriveFile } from '../types/drive';
import { OutputFile } from '../types/content';
import { getToken } from './token';
import { convert } from './convert';

export interface fetchProps {
  driveId: string
}

interface DriveFiles {
  files: DriveFile[]
  nextPageToken?: string
}

export async function fetch(props: fetchProps & withCredentials) {
  const files: OutputFile[] = [];
  let pageToken: string = null;

  while (pageToken !== undefined) {
    const token = await getToken(props.credentials);

    const { data } = await axios.request<DriveFiles>({
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v3/files',
      params: {
        driveId: props.driveId,
        corpora: 'drive',
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'files/md5Checksum,files/id,files/mimeType,files/parents,files/name,files/size,files/modifiedTime,nextPageToken',
        q: "trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'video/x-matroska' or mimeType = 'video/mp4')",
        pageToken,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    files.push(...data.files.map(convert));
    pageToken = data.nextPageToken;
  }

  return files;
}
