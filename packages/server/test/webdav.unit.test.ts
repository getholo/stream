import { createFile, createFolder, createXML } from '../src/webdav';

describe('WebDAV Specification', () => {
  describe('Parsing File', () => {
    const name = 'test.mp4';
    const path = `/best/films/${name}`;
    const size = 20 * 1024 * 1024;
    const mimeType = 'video/mp4';
    const modifiedTime = 1572698920777;

    it('With a file as input, the correct XML Object should be generated', () => {
      const fileXML = createFile({
        path,
        mimeType,
        modifiedTime,
        size,
      });

      expect(fileXML).toEqual({
        href: path,
        propstat: {
          prop: {
            displayname: name,
            getcontentlength: size,
            getcontenttype: mimeType,
            getlastmodified: new Date(modifiedTime).toUTCString(),
          },
          status: 'HTTP/1.1 200 OK',
        },
      });
    });

    it('XML Object should be parsed into the right XML', () => {
      const fileXML = createFile({
        path,
        mimeType,
        modifiedTime,
        size,
      });

      const XML = createXML([fileXML]);
      expect(XML).toMatchSnapshot();
    });
  });

  describe('Parsing Folder', () => {
    const name = 'films';
    const path = `/best/${name}`;

    it('With a folder as input, the correct XML Object should be generated', () => {
      const folderXML = createFolder({
        path,
      });

      expect(folderXML).toEqual({
        href: path,
        propstat: {
          prop: {
            displayname: name,
            resourcetype: {
              collection: {},
            },
          },
          status: 'HTTP/1.1 200 OK',
        },
      });
    });

    it('XML Object should be parsed into the right XML', () => {
      const folderXML = createFolder({
        path,
      });

      const XML = createXML([folderXML]);
      expect(XML).toMatchSnapshot();
    });
  });
});
