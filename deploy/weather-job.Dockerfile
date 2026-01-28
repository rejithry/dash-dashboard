# Weather Fetcher Job Dockerfile for Cloud Run Jobs
FROM alpine:3.19

# Install required packages
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    mysql-client

# Copy the weather fetcher script
COPY deploy/fetch-weather-cloud.sh /usr/local/bin/fetch-weather.sh
RUN chmod +x /usr/local/bin/fetch-weather.sh

# Run the script (single execution for Cloud Run Job)
CMD ["/usr/local/bin/fetch-weather.sh"]
