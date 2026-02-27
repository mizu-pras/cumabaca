let swaggerUi;
let YAML;

// Try to load swagger-ui-express and yamljs dependencies
// If not available, Swagger UI will be disabled (e.g., in Docker containers without rebuild)
try {
  swaggerUi = require('swagger-ui-express');
  YAML = require('yamljs');
} catch (err) {
  console.warn('Swagger UI dependencies not found. Run "pnpm install" in backend/ to enable API docs at /api-docs');
}

const path = require('path');

if (swaggerUi && YAML) {
  const openapi = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));

  module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(openapi, {
      customSiteTitle: 'Cuma Baca API Docs',
      customCss: '.swagger-ui .topbar { display: none }'
    })
  };
} else {
  // Return pass-through middleware if dependencies not available
  module.exports = {
    serve: (req, res, next) => next(),
    setup: (req, res) => res.status(503).json({
      error: 'API documentation unavailable',
      message: 'Swagger UI dependencies not installed. Run "pnpm install" in the backend directory.'
    })
  };
}
