import { Router, Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService.js';
import * as widgetService from '../services/widgetService.js';
import type { CreateDashboardRequest, UpdateDashboardRequest } from '../types/index.js';

const router = Router();

// GET /api/dashboards - List all dashboards
router.get('/', (_req: Request, res: Response) => {
  try {
    const dashboards = dashboardService.getAllDashboards();
    res.json({ success: true, data: dashboards });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboards' 
    });
  }
});

// GET /api/dashboards/:id - Get dashboard with widgets
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const dashboard = dashboardService.getDashboardById(id);
    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }
    
    const widgets = widgetService.getWidgetsByDashboard(id);
    res.json({ success: true, data: { ...dashboard, widgets } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard' 
    });
  }
});

// POST /api/dashboards - Create dashboard
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateDashboardRequest = req.body;
    
    if (!data.name || data.name.trim() === '') {
      res.status(400).json({ success: false, error: 'Dashboard name is required' });
      return;
    }
    
    const dashboard = dashboardService.createDashboard(data);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create dashboard' 
    });
  }
});

// PUT /api/dashboards/:id - Update dashboard
router.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: UpdateDashboardRequest = req.body;
    const dashboard = dashboardService.updateDashboard(id, data);
    
    if (!dashboard) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }
    
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update dashboard' 
    });
  }
});

// DELETE /api/dashboards/:id - Delete dashboard
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const deleted = dashboardService.deleteDashboard(id);
    
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Dashboard not found' });
      return;
    }
    
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete dashboard' 
    });
  }
});

export default router;
