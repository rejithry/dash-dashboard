# Docker Setup for Dashboard

This Docker setup includes:
- **MySQL 8.0** database with the weather table
- **Weather Fetcher** service that fetches real-time temperature data every 30 seconds

## Cities Tracked

| City | Country |
|------|---------|
| San Francisco | USA |
| Los Angeles | USA |
| New York | USA |
| Chicago | USA |
| Atlanta | USA |
| Toronto | Canada |
| Trivandrum | India |

## Quick Start

```bash
# Start the containers
cd docker
docker compose up -d

# View logs
docker compose logs -f weather-fetcher

# Stop the containers
docker compose down

# Stop and remove volumes (delete all data)
docker compose down -v
```

## MySQL Connection Details

| Parameter | Value |
|-----------|-------|
| Host | localhost |
| Port | 3306 |
| Database | dashboard |
| Username | dashuser |
| Password | dashpassword |
| Root Password | rootpassword |

## Connect to MySQL

```bash
# Using Docker
docker exec -it dash-mysql mysql -u dashuser -pdashpassword dashboard

# Using local MySQL client
mysql -h 127.0.0.1 -P 3306 -u dashuser -pdashpassword dashboard
```

## Weather Table Schema

```sql
CREATE TABLE weather (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_timestamp (timestamp)
);
```

## Sample Queries

```sql
-- Get latest temperature for all cities
SELECT city, temperature, timestamp 
FROM weather 
WHERE (city, timestamp) IN (
    SELECT city, MAX(timestamp) 
    FROM weather 
    GROUP BY city
);

-- Get all entries for a specific city
SELECT * FROM weather WHERE city = 'San Francisco' ORDER BY timestamp DESC;

-- Get average temperature by city
SELECT city, AVG(temperature) as avg_temp, COUNT(*) as readings
FROM weather
GROUP BY city;

-- Get temperature trend for a city (last 10 readings)
SELECT city, temperature, timestamp 
FROM weather 
WHERE city = 'New York' 
ORDER BY timestamp DESC 
LIMIT 10;
```

## API Used

The weather data is fetched from [Open-Meteo API](https://open-meteo.com/), which is free and requires no API key.

## Connecting from the Dashboard App

To use this MySQL database with the Dashboard application:

1. Start the Docker containers
2. Go to **Connections** in the Dashboard app
3. Add a new MySQL connection with:
   - **Name**: Weather Database
   - **Type**: MySQL
   - **Host**: host.docker.internal (if app runs in Docker) or localhost
   - **Port**: 3306
   - **Database**: dashboard
   - **Username**: dashuser
   - **Password**: dashpassword
