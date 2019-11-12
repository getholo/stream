import { Drive } from '@getholo/stream-core';
import { Instance, HTTPVersion } from 'find-my-way';
import Users from '~/auth/users';

export const extensions = {
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/mp4': '.mp4',
};

export const resolutions = ['best', '2160', '1080'] as const;

export type Resolution = 'best' | '2160' | '1080'

interface onStreamHookParams {
  username: string
  film?: {
    title: string
    resolution: Resolution
  }
  show?: {
    title: string
    season: number
    episode: number
    resolution: Resolution
  }
  range: {
    start: number
    end: number
    size: number
  }
}

export type onStreamHook = (params: onStreamHookParams) => any

export type Router = Instance<HTTPVersion.V1>

export interface RouteParams {
  drive: Drive
  router: Router
  resolution: 'best' | '2160' | '1080'
  onStream: onStreamHook
  users: Users
}
