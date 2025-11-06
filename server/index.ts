import http from 'http';
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
// old helmet call — replace with this block
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:"], // allow websocket connections
      },
    },
  })
);


// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || false : true,
    credentials: true,
  })
);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Rate limiting for API routes
app.use('/api', apiLimiter);

// Static file serving for uploads
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// Simple request logger for API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  } as typeof res.json;

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith('/api')) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 200) logLine = logLine.slice(0, 199) + '…';
      log(logLine);
    }
  });

  next();
});

async function start() {
  // registerRoutes may return an existing http.Server or not depending on your project.
  // We'll support both cases: if registerRoutes returns a server, use it. If not, create one.
  let server: http.Server | undefined;

  try {
    // allow registerRoutes to optionally create/return a server
    // Example: const server = await registerRoutes(app);
    server = (await registerRoutes(app)) as unknown as http.Server | undefined;
  } catch (err) {
    // If registerRoutes throws, rethrow because routes are essential
    console.error('Failed to register routes:', err);
    process.exit(1);
  }

  if (!server) {
    server = http.createServer(app);
  }

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  // Setup Vite (dev) or serve static (prod). setupVite expects access to the server.
  try {
    if (app.get('env') === 'development') {
      // setupVite might patch the server (hot-reload, middleware)
      // ensure it receives the server instance
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
  } catch (err) {
    console.error('Vite/static setup failed:', err);
    // don't exit; we may still want to try to listen and report error to user
  }

  // Create a WebSocketServer bound to the same http server (recommended)
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const text = message.toString();
        log(`WS message: ${text}`);
        // Echo for simple testing — modify per app logic
        ws.send(JSON.stringify({ echo: text }));
      } catch (err) {
        log('WS message handling error: ' + String(err));
      }
    });

    ws.on('close', () => log('WebSocket client disconnected'));
    ws.on('error', (e) => log('WebSocket error: ' + String(e)));
  });

  const port = parseInt(process.env.PORT || '5000', 10);

  function prettyAddr(addr: any) {
    if (!addr) return 'unknown';
    if (typeof addr === 'string') return addr;
    return `${addr.address}:${addr.port}`;
  }

  // Try listening with minimal options (cross-platform). If that fails, try fallback to 127.0.0.1
  try {
    server.listen(port);
    await new Promise<void>((resolve, reject) => {
      server!.once('listening', () => resolve());
      server!.once('error', (err) => reject(err));
    });

    log(`Server listening on ${prettyAddr(server.address())}`);
    log(`API: http://${prettyAddr(server.address())}/api`);
    log(`WebSocket: ws://${prettyAddr(server.address())}/ws`);
  } catch (err: any) {
    log(`Failed to listen on 0.0.0.0:${port}: ${err?.code || err?.message || err}`);
    // Fallback to localhost
    try {
      server.listen(port, '127.0.0.1');
      await new Promise<void>((resolve, reject) => {
        server!.once('listening', () => resolve());
        server!.once('error', (e) => reject(e));
      });

      log(`Server listening (fallback) on ${prettyAddr(server.address())}`);
      log(`API: http://${prettyAddr(server.address())}/api`);
      log(`WebSocket: ws://${prettyAddr(server.address())}/ws`);
    } catch (err2: any) {
      console.error('Fatal: unable to start server:', err2);
      process.exit(1);
    }
  }
}

start().catch((e) => {
  console.error('Startup failure:', e);
  process.exit(1);
});
