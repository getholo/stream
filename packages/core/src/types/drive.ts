import { extensions } from './content';

export interface Credentials {
  email: string
  key: string
}

export interface withCredentials {
  credentials: Credentials
}

export interface DriveFile {
  id: string
  name: string
  mimeType: keyof typeof extensions | 'application/vnd.google-apps.folder'
  modifiedTime: string
  md5Checksum?: string
  parents: string[]
  size?: string
  trashed?: boolean
}

export interface DriveChange {
  file: DriveFile
  time: string
}
