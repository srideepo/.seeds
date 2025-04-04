https://github.com/naskio/docker-n8n-python/blob/main/README.md
https://community.n8n.io/t/calling-a-python-script-from-n8n/82900

via http:
https://medium.com/@rentierdigital/calling-a-python-script-from-n8n-5d2a34c9cd09

https://docs.n8n.io/hosting/installation/docker/#prerequisites


#### n8n with postgres

> docker volume create n8n_data  
 docker run -it --rm \  
 --name n8n \
 -p 5678:5678 \
 -e DB_TYPE=postgresdb \
 -e DB_POSTGRESDB_DATABASE=<POSTGRES_DATABASE> \
 -e DB_POSTGRESDB_HOST=<POSTGRES_HOST> \
 -e DB_POSTGRESDB_PORT=<POSTGRES_PORT> \
 -e DB_POSTGRESDB_USER=<POSTGRES_USER> \
 -e DB_POSTGRESDB_SCHEMA=<POSTGRES_SCHEMA> \
 -e DB_POSTGRESDB_PASSWORD=<POSTGRES_PASSWORD> \
 -v n8n_data:/home/node/.n8n \
 docker.n8n.io/n8nio/n8n`

 complete docker-compose file here  
 https://github.com/n8n-io/n8n-hosting/tree/main/docker-compose/withPostgres

URL: http://localhost:5678


n8nuser@n8n.com
Z1234567890


`docker inspect <n8n_container_name> | grep Network`

+ python container to same network
+ python container to same shared volume
  
docker compose down
docker compose up -d


`docker run --rm --network n8n-pg_n8nstack curlimages/curl curl -X POST -F "file=C:\Temp\test.png" http://python-api:8000/resize -o output.jpg`

n8n compatible command
`curl -X POST -F "file=@/path/to/test.jpg" http://python-api:8000/resize -o output.jpg`