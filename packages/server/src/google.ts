import axios from 'axios';

import { createJWT } from './jwt';

interface GoogleResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface Token {
  key: string
  expires: number
  token: string
}

let accessToken: Token;

export async function getAccessToken(email: string, key: string, force = false) {
  const now = Math.floor(Date.now() / 1000);

  if (!force && accessToken && now < accessToken.expires && accessToken.key === key) {
    return accessToken.token;
  }

  const { data } = await axios.request<GoogleResponse>({
    method: 'POST',
    url: 'https://oauth2.googleapis.com/token',
    data: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createJWT(email, key),
    },
  });

  accessToken = {
    key,
    expires: now + 3200,
    token: data.access_token,
  };

  return accessToken.token;
}

export async function getStream(id: string, start: number, end: number, token: string) {
  const { data } = await axios.request<NodeJS.ReadableStream>({
    url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
    responseType: 'stream',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Range: `bytes=${start}-${end}`,
    },
  });

  return data;
}
