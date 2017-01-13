certbot-auto renew
cp /etc/letsencrypt/live/etherdelta.com/* ~/public_api/docker/certs
cd ~/public_api/docker && sh build.sh && sh stop.sh && sh start.sh
