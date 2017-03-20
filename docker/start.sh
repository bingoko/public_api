docker run -d -p 80:80 -p 443:443 -v ~/public_api/storage_ordersCache:/public_api/storage_ordersCache -v ~/public_api/provider:/public_api/provider --name etherdelta_api etherdelta/api
