import { js2xml } from 'xml-js';
import { basename } from 'path';
import { extensions } from './content';

export interface WebDavXML {
  href: string
  propstat: {
    prop: {
      displayname: string
      creationdate?: string
      getlastmodified?: string
      resourcetype?: {
        collection: {}
      }
      getcontentlength?: number
      getcontenttype?: string
    }
    status: 'HTTP/1.1 200 OK',
  }
}

interface createFolderParams {
  path: string
}

export function createFolder({ path }: createFolderParams): WebDavXML {
  return {
    href: path,
    propstat: {
      prop: {
        displayname: basename(path),
        resourcetype: {
          collection: {},
        },
      },
      status: 'HTTP/1.1 200 OK',
    },
  };
}

interface CreateFileParams {
  path: string
  size: number
  mimeType: keyof typeof extensions
  modifiedTime: number
}

export function createFile(file: CreateFileParams): WebDavXML {
  return {
    href: file.path,
    propstat: {
      prop: {
        displayname: basename(file.path),
        getcontentlength: file.size,
        getcontenttype: file.mimeType,
        getlastmodified: new Date(file.modifiedTime).toUTCString(),
      },
      status: 'HTTP/1.1 200 OK',
    },
  };
}

export const createXML = (response: WebDavXML[]) => js2xml(
  {
    _declaration: {
      _attributes: {
        version: '1.0',
        encoding: 'utf-8',
      },
    },
    multistatus: {
      _attributes: {
        'xmlns:d': 'DAV:',
      },
      response,
    },
  },
  {
    compact: true,
    elementNameFn: (value) => `d:${value}`,
  },
);
