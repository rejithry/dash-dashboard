import { Router, Request, Response } from 'express';
import * as connectionService from '../services/connectionService.js';
import { testConnection } from '../services/queryEngine.js';
import type { CreateConnectionRequest, UpdateConnectionRequest } from '../types/index.js';

const router = Router();

// GET /api/connections - List all connections
router.get('/', (_req: Request, res: Response) => {
  try {
    const connections = connectionService.getAllConnections();
    // Don't expose passwords in list
    const safeConnections = connections.map(c => ({
      ...c,
      password: '********'
    }));
    res.json({ success: true, data: safeConnections });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch connections' 
    });
  }
});

// GET /api/connections/:id - Get connection by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const connection = connectionService.getConnectionById(id);
    
    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    // Don't expose password
    res.json({ 
      success: true, 
      data: { ...connection, password: '********' } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch connection' 
    });
  }
});

// POST /api/connections - Create connection
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateConnectionRequest = req.body;
    
    if (!data.name || data.name.trim() === '') {
      res.status(400).json({ success: false, error: 'Connection name is required' });
      return;
    }
    
    if (!data.type) {
      res.status(400).json({ success: false, error: 'Connection type is required' });
      return;
    }
    
    const connection = connectionService.createConnection(data);
    res.status(201).json({ 
      success: true, 
      data: { ...connection, password: '********' } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create connection' 
    });
  }
});

// PUT /api/connections/:id - Update connection
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateConnectionRequest = req.body;
    const connection = connectionService.updateConnection(id, data);
    
    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    res.json({ 
      success: true, 
      data: { ...connection, password: '********' } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update connection' 
    });
  }
});

// DELETE /api/connections/:id - Delete connection
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = connectionService.deleteConnection(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete connection' 
    });
  }
});

// POST /api/connections/:id/test - Test connection
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const connection = connectionService.getConnectionById(id);
    
    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    const result = await testConnection(connection);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test connection' 
    });
  }
});

// POST /api/connections/test - Test connection without saving
router.post('/test', async (req: Request, res: Response) => {
  try {
    const data: CreateConnectionRequest = req.body;
    
    const tempConnection = {
      id: 'temp',
      name: data.name,
      type: data.type,
      host: data.host,
      port: data.port,
      database: data.database,
      username: data.username,
      password: data.password,
      ssl: data.ssl || false,
      created_at: '',
      updated_at: ''
    };
    
    const result = await testConnection(tempConnection);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to test connection' 
    });
  }
});

export default router;
