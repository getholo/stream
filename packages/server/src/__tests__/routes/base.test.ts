import request from 'supertest';

import { createTestInstance } from '../helpers/util';
import { listResolutions, listMediaFolders } from '~/routes/base';

it('/ => best, 2160, 1080', async () => {
  const app = createTestInstance(listResolutions, false);
  const response = await request(app).propfind('/').auth('test', 'test123');

  expect(response.status).toEqual(200);
  expect(response.type).toEqual('text/xml');
});

it('/:resolution => films, shows', async () => {
  const app = createTestInstance(listMediaFolders);
  const response = await request(app).propfind('/best').auth('test', 'test123');

  expect(response.status).toEqual(200);
  expect(response.type).toEqual('text/xml');
});
