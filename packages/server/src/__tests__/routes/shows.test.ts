import request from 'supertest';

import { createTestInstance } from '../helpers/util';
import { listShows, listSeasons, listEpisodes } from '~/routes/shows';
import { shows } from '../helpers/data';

it(`/best/shows => ${Object.keys(shows).join(', ')}`, async () => {
  const app = createTestInstance(listShows);
  const response = await request(app).propfind('/best/shows').auth('test', 'test123');

  expect(response.status).toEqual(207);
  expect(response.type).toEqual('text/xml');
});

it('/best/shows/westworld => seasons', async () => {
  const app = createTestInstance(listSeasons);
  const response = await request(app).propfind('/best/shows/westworld').auth('test', 'test123');

  expect(response.status).toEqual(207);
  expect(response.type).toEqual('text/xml');
});

it('/best/shows/westworld/1 => episodes', async () => {
  const app = createTestInstance(listEpisodes);
  const response = await request(app).propfind('/best/shows/westworld/1').auth('test', 'test123');

  expect(response.status).toEqual(207);
  expect(response.type).toEqual('text/xml');
});
