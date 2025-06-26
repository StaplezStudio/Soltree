import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 5000;

  try {
    console.log(`Starting server on port ${PORT}...`);
    
    // Create Vite server in middleware mode with custom config to bypass host restrictions
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 24678
        }
      },
      appType: 'spa',
      root: path.resolve(process.cwd(), 'client'),
      configFile: path.resolve(process.cwd(), 'vite.config.ts'), // Use config but override host restrictions
      define: {
        'process.env.NODE_ENV': '"development"'
      },
      optimizeDeps: {
        include: ['react', 'react-dom']
      }
    });

    // Add route to serve source code.zip
    app.get('/source\\ code.zip', (req, res) => {
      const zipPath = path.resolve(process.cwd(), 'source code.zip');
      res.download(zipPath, 'source code.zip', (err) => {
        if (err) {
          console.log('Source code download error:', err.message);
          res.status(404).send('Source code archive not found');
        }
      });
    });

    // Add middleware to override host header and bypass Vite's allowedHosts check
    app.use('*', (req, res, next) => {
      // Override the host header to bypass Vite's allowedHosts check
      req.headers.host = 'localhost:5000';
      console.log(`${req.method} ${req.url}`);
      next();
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server ready on port ${PORT}`);
      console.log(`🌐 Visit: http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();