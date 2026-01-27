import { Router, Request, Response } from 'express';
import * as widgetService from '../services/widgetService.js';
import * as connectionService from '../services/connectionService.js';
import { executeQuery, generateDummyData } from '../services/queryEngine.js';
import type { CreateWidgetRequest, UpdateWidgetRequest } from '../types/index.js';

const router = Router();

// POST /api/widgets - Create widget
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateWidgetRequest = req.body;
    
    if (!data.dashboard_id) {
      res.status(400).json({ success: false, error: 'Dashboard ID is required' });
      return;
    }
    
    if (!data.title || data.title.trim() === '') {
      res.status(400).json({ success: false, error: 'Widget title is required' });
      return;
    }
    
    if (!data.type) {
      res.status(400).json({ success: false, error: 'Widget type is required' });
      return;
    }
    
    const widget = widgetService.createWidget(data);
    res.status(201).json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create widget' 
    });
  }
});

// GET /api/widgets/:id - Get widget by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const widget = widgetService.getWidgetById(req.params.id);
    
    if (!widget) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }
    
    res.json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch widget' 
    });
  }
});

// PUT /api/widgets/:id - Update widget
router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateWidgetRequest = req.body;
    const widget = widgetService.updateWidget(req.params.id, data);
    
    if (!widget) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }
    
    res.json({ success: true, data: widget });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update widget' 
    });
  }
});

// DELETE /api/widgets/:id - Delete widget
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const deleted = widgetService.deleteWidget(req.params.id);
    
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }
    
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete widget' 
    });
  }
});

// POST /api/widgets/:id/execute - Execute widget query
router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const widget = widgetService.getWidgetById(req.params.id);
    
    if (!widget) {
      res.status(404).json({ success: false, error: 'Widget not found' });
      return;
    }
    
    // If no connection, return dummy data
    if (!widget.connection_id || !widget.query) {
      const dummyData = generateDummyData(widget.type);
      res.json({ success: true, data: dummyData });
      return;
    }
    
    const connection = connectionService.getConnectionById(widget.connection_id);
    
    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    const result = await executeQuery(connection, widget.query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to execute query' 
    });
  }
});

// POST /api/widgets/preview - Preview query without saving
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { connection_id, query, type } = req.body;
    
    // If no connection, return dummy data based on type
    if (!connection_id || !query) {
      const dummyData = generateDummyData(type || 'table');
      res.json({ success: true, data: dummyData });
      return;
    }
    
    const connection = connectionService.getConnectionById(connection_id);
    
    if (!connection) {
      res.status(404).json({ success: false, error: 'Connection not found' });
      return;
    }
    
    const result = await executeQuery(connection, query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to execute query' 
    });
  }
});

export default router;
