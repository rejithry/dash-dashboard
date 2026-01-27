FROM alpine:3.19

# Install required packages
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    mysql-client

# Copy the weather fetcher script
COPY fetch-weather.sh /usr/local/bin/fetch-weather.sh
RUN chmod +x /usr/local/bin/fetch-weather.sh

# Run the script
CMD ["/usr/local/bin/fetch-weather.sh"]
