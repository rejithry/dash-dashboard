#!/bin/bash

# Weather fetcher script that runs every 30 seconds
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

# MySQL connection parameters
MYSQL_CMD="mysql -h ${MYSQL_HOST} -P ${MYSQL_PORT} -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE}"

echo "Weather Fetcher started!"
echo "Fetching weather data every 30 seconds for: ${!CITIES[@]}"

# Wait for MySQL to be fully ready
echo "Waiting for MySQL to be ready..."
sleep 5

while true; do
    echo ""
    echo "============================================"
    echo "Fetching weather data at $(date '+%Y-%m-%d %H:%M:%S')"
    echo "============================================"
    
    for city in "${!CITIES[@]}"; do
        coords="${CITIES[$city]}"
        lat=$(echo $coords | cut -d',' -f1)
        lon=$(echo $coords | cut -d',' -f2)
        
        # Fetch current temperature from Open-Meteo API
        # API returns temperature in Celsius
        response=$(curl -s "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m")
        
        if [ $? -eq 0 ]; then
            # Extract temperature from JSON response
            temperature=$(echo "$response" | jq -r '.current.temperature_2m // empty')
            
            if [ -n "$temperature" ] && [ "$temperature" != "null" ]; then
                # Insert into MySQL
                insert_query="INSERT INTO weather (city, temperature, timestamp) VALUES ('${city}', ${temperature}, NOW());"
                
                echo "$insert_query" | $MYSQL_CMD 2>/dev/null
                
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
        
        # Small delay between API calls to be respectful
        sleep 1
    done
    
    # Show recent entries
    echo ""
    echo "Recent entries in database:"
    echo "SELECT city, temperature, timestamp FROM weather ORDER BY timestamp DESC LIMIT 7;" | $MYSQL_CMD 2>/dev/null
    
    echo ""
    echo "Sleeping for 30 seconds..."
    sleep 30
done
