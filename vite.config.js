import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to serve local PDFs from desktop bypassing browser security blocks
const serveDocsPlugin = () => ({
  name: 'serve-docs',
  configureServer(server) {
    server.middlewares.use('/docs', (req, res, next) => {
      // Decode URL to handle spaces in filename
      const decodedUrl = decodeURIComponent(req.url);
      const filePath = path.join('/Users/pranav/Desktop/Grade 3/docs', decodedUrl);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        fs.createReadStream(filePath).pipe(res);
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveDocsPlugin()],
})
