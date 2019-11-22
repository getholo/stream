export function format(season: number | string, episode: number | string) {
  return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}
