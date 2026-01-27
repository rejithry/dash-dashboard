# Dash - Dashboard Builder

A modern dashboard application built with React and Node.js, featuring drag-and-drop widgets, Google Charts integration, and database connectivity.

## Features

- **Dashboard Management**: Create, edit, and delete dashboards
- **Widget System**: Add widgets with various chart types
  - Line Chart
  - Bar Chart
  - Pie Chart
  - Area Chart
  - Data Table
  - Stat Card
- **Drag & Drop**: Reorder widgets by dragging
- **Resizable Widgets**: Resize widgets from corners/edges
- **Database Connections**: Connect to PostgreSQL, MySQL, or SQLite
- **SQL Query Editor**: Write custom queries for widgets
- **Theme Toggle**: Switch between light and dark modes
- **Google Charts**: Beautiful, interactive charts

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- react-grid-layout for drag/drop/resize
- react-google-charts for visualizations
- Tailwind CSS for styling
- CodeMirror for SQL editing

### Backend
- Node.js with Express
- TypeScript
- SQLite for app data storage
- Support for PostgreSQL, MySQL, SQLite connections

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dash
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
dash/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service functions
│   │   └── types/          # TypeScript types
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── db/             # Database setup
│   │   └── types/          # TypeScript types
│   └── package.json
├── .claude/CLAUDE.md       # Project plan
└── README.md
```

## API Endpoints

### Dashboards
- `GET /api/dashboards` - List all dashboards
- `GET /api/dashboards/:id` - Get dashboard with widgets
- `POST /api/dashboards` - Create dashboard
- `PUT /api/dashboards/:id` - Update dashboard
- `DELETE /api/dashboards/:id` - Delete dashboard

### Widgets
- `POST /api/widgets` - Create widget
- `PUT /api/widgets/:id` - Update widget
- `DELETE /api/widgets/:id` - Delete widget
- `POST /api/widgets/:id/execute` - Execute widget query
- `POST /api/widgets/preview` - Preview query results

### Connections
- `GET /api/connections` - List connections
- `POST /api/connections` - Create connection
- `PUT /api/connections/:id` - Update connection
- `DELETE /api/connections/:id` - Delete connection
- `POST /api/connections/:id/test` - Test connection

## Usage

1. **Create a Dashboard**: Click "New Dashboard" and enter a name
2. **Add Widgets**: Open a dashboard and click "Add Widget"
3. **Configure Widget**: 
   - Choose a chart type
   - Optionally connect to a database
   - Write a SQL query or use dummy data
   - Customize chart options
4. **Arrange Widgets**: Drag widgets to reorder, resize from corners
5. **Manage Connections**: Go to Connections page to add database credentials

## Docker Setup

The project includes a Docker Compose setup with MySQL and a weather data fetcher:

```bash
cd docker
docker compose up -d
```

This starts:
- **MySQL 8.0** on port 3306 with a `weather` table
- **Weather Fetcher** that inserts real-time temperature data every 30 seconds for 7 cities

See [docker/README.md](docker/README.md) for more details.

## License

MIT
