import { Router } from 'express';
import { openApiSpec } from '../swagger/spec.js';
import { config } from '../config/index.js';

const router = Router();
const baseUrl = config.backendUrl || `http://localhost:${config.port}`;

router.get('/spec', (_req, res) => {
  const spec = {
    ...openApiSpec,
    servers: [{ url: baseUrl, description: 'API server' }],
  };
  res.setHeader('Content-Type', 'application/json');
  res.json(spec);
});

router.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Resume API – Swagger</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${baseUrl}/api-docs/spec",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>
  `.trim());
});

export default router;
