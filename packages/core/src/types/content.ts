export const extensions = {
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
  'video/mp4': '.mp4',
};

export type OutputFile = {
  id: string
  name: string
  size?: number
  modifiedTime?: number
  mimeType?: string
  parent: string
  trashed: boolean
}

interface File {
  modifiedTime: number
  mimeType: keyof typeof extensions
  id: string
  size: number
}

interface Versions<T> {
  '2160'?: T
  '1080'?: T
}

export interface Films {
  [name: string]: Versions<File>
}

export interface Shows {
  [show: string]: Versions<{
    [season: number]: {
      [episode: number]: File
    }
  }>
}
