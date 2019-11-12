import axios from 'axios';

import { createJWT } from '../utils/jwt';
import { Credentials } from '../types/drive';

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

export async function getToken({ email, key }: Credentials) {
  const now = Math.floor(Date.now() / 1000);

  if (accessToken && now < accessToken.expires && accessToken.key === key) {
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
