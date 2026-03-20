export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Resume API',
    description: 'Backend API for generating Japanese-style resumes (履歴書・職務経歴書) from templates, voice, and form data.',
    version: '1.0.0',
  },
  servers: [{ url: '/', description: 'Backend root' }],
  tags: [
    { name: 'Auth', description: 'Google OAuth and session' },
    { name: 'User', description: 'Current user' },
    { name: 'Templates', description: 'Built-in resume templates' },
    { name: 'Resume', description: 'Generate and store resumes' },
    { name: 'Voice', description: 'Voice-to-resume (transcribe + extract)' },
    { name: 'History', description: 'Resume history' },
    { name: 'Upload', description: 'Template upload (sample)' },
    { name: 'Postal', description: 'Japanese postal code lookup' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Start Google OAuth',
        description: 'Redirects to Google for sign-in. On success, redirects to frontend with session cookie.',
        responses: { 302: { description: 'Redirect to Google' } },
      },
    },
    '/auth/google/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Google OAuth callback',
        responses: { 302: { description: 'Redirect to frontend dashboard or error' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/user': {
      get: {
        tags: ['User'],
        summary: 'Current user',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'User profile', content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' } } } } } },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/templates': {
      get: {
        tags: ['Templates'],
        summary: 'List built-in templates',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of template ids and metadata',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    templates: {
                      type: 'array',
                      items: { type: 'object', properties: { id: { type: 'string' }, nameKey: { type: 'string' }, type: { type: 'string', enum: ['docx', 'xlsx'] } } },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/templates/{id}': {
      get: {
        tags: ['Templates'],
        summary: 'Get template by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Schema, defaultData, template base64, preview HTML',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sections: { type: 'array' },
                    defaultData: { type: 'object' },
                    templateHtml: { type: 'string', nullable: true },
                    originalDocxBase64: { type: 'string', nullable: true },
                    annotatedDocxBase64: { type: 'string', nullable: true },
                    templateXlsxBase64: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Template not found' },
        },
      },
    },
    '/generate-resume': {
      post: {
        tags: ['Resume'],
        summary: 'Generate resume',
        description: 'Generates PDF (and optionally DOCX/XLSX) from schema + form data. Stores in history and sends email with attachment.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['schema', 'data'],
                properties: {
                  schema: { type: 'object', description: 'Form schema and template refs (annotatedDocxBase64, templateXlsxBase64, etc.)' },
                  data: { type: 'object', description: 'Form data (personal, education, experience, licenses, other)' },
                  avatarBase64: { type: 'string', nullable: true, description: 'Optional photo as base64' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Created resume with file URLs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    filePath: { type: 'string' },
                    generatedFiles: { type: 'object', additionalProperties: { type: 'string' } },
                    createdAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          400: { description: 'schema and data required' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/voice-to-resume': {
      post: {
        tags: ['Voice'],
        summary: 'Generate resume from voice',
        description: 'Upload audio (and optional avatar). Transcribes with Whisper, extracts fields with GPT, returns schema + formData + previewHtml + transcript.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  audio: { type: 'string', format: 'binary', description: 'Audio file (e.g. webm, m4a)' },
                  avatar: { type: 'string', format: 'binary', description: 'Optional photo' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Schema, formData, previewHtml, transcript',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    schema: { type: 'object' },
                    formData: { type: 'object' },
                    previewHtml: { type: 'string' },
                    transcript: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/history': {
      get: {
        tags: ['History'],
        summary: 'List resume history',
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: 'List of resumes',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resumes: {
                      type: 'array',
                      items: { type: 'object', properties: { id: { type: 'string' }, createdAt: { type: 'string' }, filePath: { type: 'string' } } },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/history/{id}': {
      get: {
        tags: ['History'],
        summary: 'Get resume by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Resume record with schema and data' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
      put: {
        tags: ['History'],
        summary: 'Update resume by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { schema: { type: 'object' }, data: { type: 'object' } } } } } },
        responses: { 200: { description: 'Updated resume' }, 401: { description: 'Unauthorized' }, 404: { description: 'Not found' } },
      },
    },
    '/upload-sample': {
      post: {
        tags: ['Upload'],
        summary: 'Upload template (DOCX/XLSX)',
        description: 'Temporarily disabled in UI. Accepts DOCX or XLSX; returns schema + template HTML and base64 blobs.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Schema, templateHtml, originalDocxBase64, annotatedDocxBase64, templateXlsxBase64' },
          400: { description: 'No file uploaded or invalid type' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/postal-code': {
      get: {
        tags: ['Postal'],
        summary: 'Japanese postal code lookup',
        description: 'Look up address by 7-digit postal code (e.g. 3330854 or 333-0854). Uses zipcloud API.',
        parameters: [
          { name: 'zipcode', in: 'query', required: true, schema: { type: 'string', example: '3330854' } },
        ],
        responses: {
          200: {
            description: 'Address components',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string', example: '〒333-0854 埼玉県川口市朝日' },
                    prefecture: { type: 'string' },
                    city: { type: 'string' },
                    district: { type: 'string' },
                    zipcode: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid postal code' },
          404: { description: 'Address not found' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid',
        description: 'Session cookie set after Google OAuth login',
      },
    },
  },
};
