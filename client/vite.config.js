import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request to:', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response status:', proxyRes.statusCode);
            // Copy headers properly for file downloads
            if (req.url.includes('/api/books/') && req.url.length > 15) {
              res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/pdf');
              res.setHeader('Content-Length', proxyRes.headers['content-length'] || '0');
              res.setHeader('Content-Disposition', proxyRes.headers['content-disposition'] || '');
            }
          });
        }
      },
    },
  },
});
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:5000',
//         changeOrigin: true,
//         secure: false,
//         configure: (proxy, options) => {
//           proxy.on('proxyReq', (proxyReq, req, res) => {
//             console.log('Proxying request to:', proxyReq.path);
//           });
//           proxy.on('proxyRes', (proxyRes, req, res) => {
//             console.log('Proxy response status:', proxyRes.statusCode);
//             console.log('Proxy response headers:', proxyRes.headers);
//           });
//         }
//       },
//     },
//   },
// });