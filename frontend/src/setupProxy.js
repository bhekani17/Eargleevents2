const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5003',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '' // Remove /api prefix when forwarding to backend
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add any custom headers if needed
        proxyReq.setHeader('x-added', 'foobar');
      },
      logLevel: 'debug' // Enable debug logging
    })
  );
};
