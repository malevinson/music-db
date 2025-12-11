import http from 'http';
import chalk from 'chalk';
import app from './index.js';

const PORT = process.env.PORT || 8340;

http.createServer(app).listen(PORT, () => {
  console.log(chalk.green(`Local server running at http://localhost:${PORT}`));
  console.log(chalk.blue(`API available at http://localhost:${PORT}/api`));
});

