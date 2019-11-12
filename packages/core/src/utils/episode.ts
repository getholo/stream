export function getEpisodeDetails(file: string) {
  const match = /S(\d+)E(\d+)/ig.exec(file);

  if (match) {
    return {
      season: parseInt(match[1], 10),
      episode: parseInt(match[2], 10),
    };
  }

  return undefined;
}
