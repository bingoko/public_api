# Commands
 * Build server: `cd docker && sh build.sh`
 * Start server: `cd docker && sh start.sh`
 * Stop server: `cd docker && sh stop.sh`

# Installing SSL certificate
 * `cd docker && sh stop.sh`
 * `certbot-auto renew --force-renewal`
 * `cp /etc/letsencrypt/live/etherdelta.com/* certs/`
 * `sh build.sh`
 * `sh start.sh`
