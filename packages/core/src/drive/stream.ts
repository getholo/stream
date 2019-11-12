import axios from 'axios';
import { Readable } from 'stream';

import { withCredentials } from '../types/drive';
import { getToken } from './token';

export interface streamProps {
  id: string
  start: number
  end: number
}

export async function stream(props: streamProps & withCredentials) {
  const token = await getToken(props.credentials);

  const { data } = await axios.request<Readable>({
    url: `https://www.googleapis.com/drive/v3/files/${props.id}?alt=media`,
    responseType: 'stream',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Range: `bytes=${props.start}-${props.end}`,
    },
  });

  return data;
}
