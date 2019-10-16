import { js2xml } from 'xml-js';
import { basename } from 'path';

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

export function createFolder(path: string): WebDavXML {
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

export function createFile(path: string, size: number, mimeType: string): WebDavXML {
  return {
    href: path,
    propstat: {
      prop: {
        displayname: basename(path),
        getcontentlength: size,
        getcontenttype: mimeType,
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
