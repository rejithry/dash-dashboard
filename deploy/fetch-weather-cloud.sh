#!/bin/bash

# Weather fetcher script for Cloud Run Job
# Runs once per invocation (scheduled by Cloud Scheduler)
# Uses Open-Meteo API (free, no API key required)

# City coordinates (latitude, longitude)
declare -A CITIES
CITIES["San Francisco"]="37.7749,-122.4194"
CITIES["Los Angeles"]="34.0522,-118.2437"
CITIES["New York"]="40.7128,-74.0060"
CITIES["Chicago"]="41.8781,-87.6298"
CITIES["Atlanta"]="33.7490,-84.3880"
CITIES["Toronto"]="43.6532,-79.3832"
CITIES["Trivandrum"]="8.5241,76.9366"

echo "Weather Fetcher Job started at $(date '+%Y-%m-%d %H:%M:%S')"
echo "Fetching weather data for: ${!CITIES[@]}"

# Check required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "ERROR: Missing required environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)"
    exit 1
fi

echo "Connecting to MySQL at $DB_HOST..."

for city in "${!CITIES[@]}"; do
    coords="${CITIES[$city]}"
    lat=$(echo $coords | cut -d',' -f1)
    lon=$(echo $coords | cut -d',' -f2)
    
    # Fetch current temperature from Open-Meteo API
    response=$(curl -s "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m")
    
    if [ $? -eq 0 ]; then
        # Extract temperature from JSON response
        temperature=$(echo "$response" | jq -r '.current.temperature_2m // empty')
        
        if [ -n "$temperature" ] && [ "$temperature" != "null" ]; then
            # Insert into MySQL
            mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e \
                "INSERT INTO weather (city, temperature, timestamp) VALUES ('${city}', ${temperature}, NOW());"
            
            if [ $? -eq 0 ]; then
                echo "✓ ${city}: ${temperature}°C"
            else
                echo "✗ ${city}: Failed to insert into database"
            fi
        else
            echo "✗ ${city}: Could not parse temperature from API response"
        fi
    else
        echo "✗ ${city}: Failed to fetch from API"
    fi
    
    # Small delay between API calls
    sleep 0.5
done

echo ""
echo "Weather Fetcher Job completed at $(date '+%Y-%m-%d %H:%M:%S')"
