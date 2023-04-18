// Note that this file isn't processed by Vite, see https://github.com/brillout/vite-plugin-ssr/issues/562

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import bodyParser from 'body-parser';
import { renderPage } from 'vite-plugin-ssr/server'
import { root } from './root.js'
import  path  from "path";
import _  from "lodash";
import * as dotenv from 'dotenv'
//import { typeOf, cwd } from 'pk-ts-node-lib';
import { typeOf,   } from 'pk-ts-node-lib';
export const cwd = process.cwd();
//@ts-ignore
dotenv.config(path.join(cwd, ".env"));
const isProduction = process.env.NODE_ENV === 'production'

startServer()
const typo = typeOf({ a: 2 });
console.log({ typo });

async function startServer() {
  const app = express()
  app.use(bodyParser.json());
  app.use(cors());

  app.use(compression())
  app.get('api', async (req, res, next) => {
    console.log("Got api");
    return "Looking at API";
  });
  app.get('/api', async (req, res, next) => {
    console.log("Got /api");
    return "Looking at API";
  });

  if (isProduction) {
    const sirv = (await import('sirv')).default
    app.use(sirv(`${root}/dist/client`))
  } else {
    const vite = await import('vite')
    const viteDevMiddleware = (
      await vite.createServer({
        root,
        server: { middlewareMode: true }
      })
    ).middlewares
    app.use(viteDevMiddleware)
  }

  app.get('*', async (req, res, next) => {
    const pageContextInit = {
      urlOriginal: req.originalUrl
    }
    const pageContext = await renderPage(pageContextInit)
    const { httpResponse } = pageContext
    if (!httpResponse) return next()
    const { body, statusCode, contentType, earlyHints } = httpResponse
    if (res.writeEarlyHints) res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
    res.status(statusCode).type(contentType).send(body)
  })

  const port = process.env.PORT || 3000
  app.listen(port)
  console.log(`Server running at http://localhost:${port}`)
}
