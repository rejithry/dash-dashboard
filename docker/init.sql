-- Create the weather table
CREATE TABLE IF NOT EXISTS weather (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_timestamp (timestamp)
);

-- Grant privileges to dashuser
GRANT ALL PRIVILEGES ON dashboard.* TO 'dashuser'@'%';
FLUSH PRIVILEGES;
