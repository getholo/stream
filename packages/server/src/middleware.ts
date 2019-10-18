import { RouterContext } from '@koa/router';
import kleur from 'kleur';

import { createXML, createFolder } from './webdav';

export const propfind = (paths: string[]) => (ctx: RouterContext) => {
  const { request, response } = ctx;

  if (request.method === 'PROPFIND') {
    const folders = createXML(paths.map((path) => createFolder({ path })));

    response.type = 'text/xml';
    response.body = folders;
  }
};

// Analytics and Cache

export type AnalyticsContext = RouterContext<{
  user: string
  film: string
  resolution: '2160' | '1080'
  cached: boolean
}>;

export const analytics = async (ctx: AnalyticsContext, next) => {
  const start = Date.now();
  await next();

  if (!ctx.state.film) {
    return;
  }

  const { film, user, resolution } = ctx.state;
  const { status } = ctx.response;
  const range = ctx.response.get('content-range');

  console.log(`${kleur.magenta('Stream:')} ${user} is streaming: ${kleur.bold(film)} in ${resolution}p`);
  console.log(`> ${kleur.yellow(status)} ${kleur.dim(`${range} ${Date.now() - start}ms`)}`);
  console.log(`> ${kleur.dim(ctx.request.get('user-agent').split(' ')[0])}`);
};
