const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const openapi = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(openapi, {
    customSiteTitle: 'Cuma Baca API Docs',
    customCss: '.swagger-ui .topbar { display: none }'
  })
};
