import serverless from 'serverless-http';
import app from '../../server/index.js';

const handler = serverless(app, {
  binary: ['image/*', 'application/json'],
});

export const handlerWithErrorHandling = async (event, context) => {
  try {
    return await handler(event, context);
  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};

export { handlerWithErrorHandling as handler };

