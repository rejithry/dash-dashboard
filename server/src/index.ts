import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/schema.js';
import dashboardRoutes from './routes/dashboards.js';
import widgetRoutes from './routes/widgets.js';
import connectionRoutes from './routes/connections.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database before setting up routes
async function startServer() {
  try {
    await initializeDatabase();
    console.log('📦 Database initialized');

    // API Routes
    app.use('/api/dashboards', dashboardRoutes);
    app.use('/api/widgets', widgetRoutes);
    app.use('/api/connections', connectionRoutes);

    // Health check
    app.get('/api/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard API ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
