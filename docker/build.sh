mkdir certs
cp /etc/letsencrypt/live/etherdelta.com/* docker/certs/
docker build -t etherdelta/api -f Dockerfile .
