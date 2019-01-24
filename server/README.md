# Chimp Assist Chat Server

## Getting Started

Just run `docker-compose up`:

```yaml
version: '3.7'

services:
  back-office:
    image: tiagostutz/chimpassist-back-office-ui:0.1.5-alpine
    ports:
      - 3210:80
    environment:  
      - LOGO_SMALL_URL=https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_326/c_scale,h_176/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png
      - DEFAULT_ATTENDANT_AVATAR_URL=https://res.cloudinary.com/stutzsolucoes/image/upload/v1530069234/pseudo-avatar_ghrnlu.jpg
      - BACKEND_ENDPOINT=http://localhost:3000
      - MQTT_BROKER_HOST=http://localhost:8080/mqtt
      - ONLINE_CUSTOMERS_LABEL=Online Costumers
      - OFFLINE_CUSTOMERS_LABEL=Offline Costumers
    networks:
      - chimpassist-demo

  mqtt:
    image: erlio/docker-vernemq
    restart: always
    ports:
      - 1883:1883
      - 8080:8080
    environment:
      - DOCKER_VERNEMQ_ALLOW_ANONYMOUS=on
      - DOCKER_VERNEMQ_LOG__CONSOLE__LEVEL=info
    networks:
      - chimpassist-demo

  mongo:
    image: mongo
    ports:
      - 27017:27017
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=root
    networks:
      - chimpassist-demo

networks:
  chimpassist-demo:
    name: chimpassist-demo
```

## Environment Variables

| Variable | Description|
| --- | --- |
| MONGO_CONNECTION_URL | TO-DO|
| ATTENDANT_KEEP_ALIVE_TIME | TO-DO |
| JSON_DATABASE_FOLDER | TO-DO |
| MQTT_BASE_TOPIC | TO-DO |
| MQTT_BROKER_HOST | TO-DO |
| MQTT_USERNAME | TO-DO |
| MQTT_PASSWORD | TO-DO |