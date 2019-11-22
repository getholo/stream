import {
  createFile,
  createFolder,
  CreateFileParams,
  createFolderParams,
  createXML,
} from '~/utils/webdav';

describe('Webdav formatting', () => {
  describe('Format a file', () => {
    it('When given all parameters, then the webdav should contain all fields', () => {
      // Arrange
      const input: CreateFileParams = {
        mimeType: 'video/x-matroska',
        modifiedTime: Date.now(),
        path: '/to/infinity/and/beyond',
        size: 1200,
      };

      // Act
      const output = createFile(input);

      // Assert
      expect(output).toEqual({
        href: input.path,
        propstat: {
          prop: {
            displayname: 'beyond',
            getcontentlength: input.size,
            getcontenttype: input.mimeType,
            getlastmodified: new Date(input.modifiedTime).toUTCString(),
          },
          status: 'HTTP/1.1 200 OK',
        },
      });
    });
  });

  describe('Format a folder', () => {
    it('When given all parameters, then the webdav should contain all fields', () => {
      // Arrange
      const input: createFolderParams = {
        path: '/to/infinity/and/beyond',
      };

      // Act
      const output = createFolder(input);

      // Assert
      expect(output).toEqual({
        href: input.path,
        propstat: {
          prop: {
            displayname: 'beyond',
            resourcetype: {
              collection: {},
            },
          },
          status: 'HTTP/1.1 200 OK',
        },
      });
    });
  });

  describe('Format to XML', () => {
    it('When given xml object, then actual xml should be valid', () => {
      // Arrange
      const input = [
        createFolder({
          path: '/sup',
        }),
        createFile({
          mimeType: 'video/mp4',
          modifiedTime: 1572985258000,
          path: '/sup/not much',
          size: 1200,
        }),
      ];

      // Act
      const output = createXML(input);

      // Assert
      expect(output).toMatchSnapshot();
    });
  });
});
