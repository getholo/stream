import { DriveFile } from '../types/drive';
import { OutputFile } from '../types/content';

export function convert(driveFile: DriveFile): OutputFile {
  return {
    id: driveFile.id,
    name: driveFile.name,
    mimeType: driveFile.mimeType,
    modifiedTime: new Date(driveFile.modifiedTime).getTime(),
    parent: driveFile.parents[0],
    size: parseInt(driveFile.size, 10),
    trashed: driveFile.trashed,
  };
}
