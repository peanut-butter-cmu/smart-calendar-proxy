import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
// import { CalendarEvent } from './models/event.js';
// import { CalendarEventType } from './models/event.js';

const reg_app = express();
const oauth_app = express();
const mango_app = express();

const PORT_REG = process.env.REG_PORT || 3000;
const PORT_OAUTH = process.env.PORT_OAUTH || 3001;
const PORT_MANGO = process.env.PORT_MANGO || 3002;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';

const CORS = cors({
    credentials: true,
    origin: 'http://localhost:5173', // allow from vite
}); 

reg_app.use(CORS);
oauth_app.use(CORS);
mango_app.use(CORS);

reg_app.options('*', CORS);
oauth_app.options('*', CORS);
mango_app.options('*', CORS);

const createProxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  secure: false,
  onProxyReq: (proxyReq: any, req: Request, res: Response) => {
    proxyReq.setHeader('User-Agent', USER_AGENT);
  },
  onProxyRes: (proxyRes: any, req: Request, res: Response) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET,PUT,POST,DELETE,PATCH,OPTIONS'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
  },
});

reg_app.use('/', createProxyMiddleware(createProxyOptions('https://www1.reg.cmu.ac.th')));
oauth_app.use('/', createProxyMiddleware(createProxyOptions('https://oauth.cmu.ac.th')));
mango_app.use('/', createProxyMiddleware(createProxyOptions('https://mango-cmu.instructure.com')));

reg_app.listen(PORT_REG, () => {
  console.log(`REG Proxy server is running on http://localhost:${PORT_REG}`);
});

oauth_app.listen(PORT_OAUTH, () => {
    console.log(`OAuth Proxy server is running on http://localhost:${PORT_OAUTH}`);
})

mango_app.listen(PORT_MANGO, () => {
  console.log(`Mango Proxy server is running on http://localhost:${PORT_MANGO}`);
})

// let p: CalendarEvent = {
//   type: CalendarEventType.Assignment,
//   date: new Date(),
//   title: 'Hello'
// }