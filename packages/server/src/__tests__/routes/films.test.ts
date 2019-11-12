import request from 'supertest';

import { createTestInstance } from '../helpers/util';
import { listFilms } from '~/routes/films';
import { films } from '../helpers/data';

it(`/best/films => ${Object.keys(films).join(', ')}`, async () => {
  const app = createTestInstance(listFilms);
  const response = await request(app).propfind('/best/films').auth('test', 'test123');

  expect(response.status).toEqual(200);
  expect(response.type).toEqual('text/xml');
  console.log(response.text);
});
