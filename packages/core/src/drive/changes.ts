import axios from 'axios';

import { withCredentials, DriveChange } from '../types/drive';
import { getToken } from './token';
import { convert } from './convert';

interface newStateProps {
  driveId: string
}

interface changeTokenResponse {
  startPageToken: string
}

export async function newState(props: newStateProps & withCredentials) {
  const token = await getToken(props.credentials);

  const { data } = await axios.request<changeTokenResponse>({
    method: 'GET',
    url: 'https://www.googleapis.com/drive/v3/changes/startPageToken',
    params: {
      driveId: props.driveId,
      supportsAllDrives: true,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.startPageToken;
}

export interface changesProps {
  driveId: string
  state: string
}

interface changesResponse {
  nextPageToken: string
  newStartPageToken: string
  changes: DriveChange[]
}

export async function fetchChanges(props: changesProps & withCredentials) {
  const driveChanges: DriveChange[] = [];
  let pageToken = props.state || await newState(props);
  let newChangeToken: string;

  while (pageToken !== undefined) {
    const token = await getToken(props.credentials);
    const { data } = await axios.request<changesResponse>({
      method: 'GET',
      url: 'https://www.googleapis.com/drive/v3/changes',
      params: {
        driveId: props.driveId,
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        fields: 'changes/file/trashed,changes/file/id,changes/file/mimeType,changes/file/modifiedTime,changes/file/parents,changes/file/name,changes/file/size,changes/time,nextPageToken,newStartPageToken',
        pageToken,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    driveChanges.push(...data.changes);
    pageToken = data.nextPageToken;
    newChangeToken = data.newStartPageToken;
  }

  return {
    changes: driveChanges.map(
      (change) => convert(change.file),
    ),
    newChangeToken,
  };
}
