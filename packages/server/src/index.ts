import Koa from 'koa';
import { Content, DriveParams } from './content';
import { Routing } from './routes';
import { auth } from './auth';

export { generateFilmExp, generateShowExp } from './paths';

interface Params extends DriveParams {
  password: string
  realm: string
}

export async function createServer(params: Params) {
  const content = new Content(params);
  await content.firstFetch();

  const app = new Koa();

  app.use(auth(params.password, params.realm));

  app.on('error', (error) => {
    if (error.code === 'EPIPE' || error.code === 'ECONNRESET') {
      return;
    }

    console.log(error);
  });

  const { films } = content.createData();
  const routing = new Routing({
    email: params.email,
    key: params.key,
    films,
  });
  app.use((ctx) => routing.middleware(ctx));

  return app;
}
