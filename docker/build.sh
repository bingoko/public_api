mkdir certs
cp /etc/letsencrypt/live/etherdelta.com/* certs/
docker build -t etherdelta/api -f Dockerfile .
