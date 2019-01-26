# Chimp Assist

<p align="center">
  <img height="250" src="https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_308/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png">
</p>

Open source customer service chat plataform

Backoffice and Frontoffice made with React for a typical customer service or support

<p align="left">
<img src="https://ik.imagekit.io/stutzsolucoes/chimpassist-short-demo_HJJq7hYXN.gif">
  </p>

## Getting Started

To bring the Back Office online, just run `docker-compose up`:

```yaml
version: '3.7'

services:

  backend:
    image: tiagostutz/chimpassist-server:0.1.5-alpine
    ports:
      - 3000:3000
    environment:
      - MONGO_CONNECTION_URL=mongodb://root:root@mongo:27017/?authMechanism=SCRAM-SHA-1
      - MQTT_BROKER_HOST=mqtt://mqtt:1883
    networks:
      - chimpassist-demo        

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

Then open `http://localhost:3210/`, type `admin/admin` for user and password, click on "SIGN IN" (Ou ENTRAR se estiver em português) and you are at the Attendant screen.

Now, to install the chat widget on your React Application:
1) `npm install --save chimpassist-widget`
2) On your main faile (aka `App.js`) put the widget component with the endpoint configuration like this:
```JSX

    import { ChimpWidget } from 'chimpassist-widget'

    <ChimpWidget
      backendEndpoint="http://localhost:3000"
      mqttBrokerHost="http://localhost:8080/mqtt"
      mqttBaseTopic="chimpassist/demo"
      title="Chimp Assist Demo"
     />
```

If you are using ChimpAssist widget on a website that has a Logged area, you can use your customer info to automatically fill `name`, `id` and `avatar` of the chat. ChimpAssist widget looks for and sotres this info at `window.localStorage.userData`. So, if you have a logged application and wants the widget to use your logged customer information, just put the following object at localStorage before adding `<ChimpWidget>`:

```JS

let userData = {
    "name": LOGGED_USER_NAME_FROM_YOUR_SITE,
    "id": LOGGED_USER_ID_FROM_YOUR_SITE,
    "avatarURL": LOGGED_USER_AVATAR_FROM_YOUR_SITE
}
window.localStorage.userData = JSON.stringify(userData)
```

Chimp assist deployment consists basically on on 4 resources:
1) [MQTT broker for chat and chat control messages](https://hub.docker.com/r/erlio/docker-vernemq)
2) [MongoDB to persist the chat messages](https://hub.docker.com/_/mongo)
3) [Chimpasssist Chat Backend App](https://github.com/tiagostutz/chimpassist/tree/master/server)
4) [Chimpassist Back Office web App](https://github.com/tiagostutz/chimpassist/tree/master/back-office)

The preferred order to bring the platform up is: 1, 2, 3 and 4

Once everthing is up, you can now put the ChimpAssistWidget at your site to enable chat costumer service. The only configuration you will need is to set the widget property `backendEndpoint` to the **Chat Backend App** address and the `mqttBrokerHost` to the same **MQTT Broker** your solution is connecting to

## Statistics endpoints

The backoffice application invokes a set of REST endpoints implemented by you following some JSON formats that will enrich the customer panel information. All the requests sends the `attendant_id`. 
So, you will implement your own logic and pass the base endpoint - **without** the **/chimpassist** part - to the environment variable `STATISTICS_BASE_ENDPOINT` and implement the following:

- `/chimpassist/:customerId/contactInfo?attendant=<attendant_id>` - returns customer contact info:
```JSON
{
  "e-mail": "user@email.com",
  "phone1": "+1 222 999 999 999",
  "phone2": "+55 61 99676 8989"
}
```

- `/chimpassist/:customerId/additionalInfo?attendant=<attendant_id>` - returns customer additional info, specific to your domain
```JSON
[{
  "label": "customer since",
  "value": "14/09/2014"
},
{
  "label": "favorite shopping category",
  "value": "clothing"
}]
```

- `/chimpassist/:customerId/statistics?attendant=<attendant_id>&start_date_time=<start_date_time>&end_date_time=<end_date)time>` - returns a filtered array with the statistics filtered by datetimes having 3 possible formats:
```JSON
[{
  "label": "Unresolved tickets",
  "value": [
    {"url": "https://mytickets.desksupport.io/tickets/123", "label": "Error closing the cart (14/10/2018)"},
    {"url": "https://mytickets.desksupport.io/tickets/321", "label": "Credit card not accepted (24/11/2018)"}
  ]
},
{
  "label": "Total items bought",
  "value": "7"
},
{
  "label": "Shopping activity",
  "value": [{
    "x": "15/12/2018-10:00:00",
    "y": 3
  },
  {
    "x": "15/12/2018-10:10:00",
    "y": 63
  },
  {
    "x": "15/12/2018-10:20:00",
    "y": 99
  },
  {
    "x": "15/12/2018-10:30:00",
    "y": 7
  }]
}]
```

### Some examples

- last 24h: `curl -X GET $STATISTICS_BASE_ENDPOINT/chimpassist/298301/statistics?start_date_time=20181221-11:33:09&end_date_time=20181221-12:33:09`
- last 7 days: `curl -X GET $STATISTICS_BASE_ENDPOINT/chimpassist/298301/statistics?start_date_time=20181214-12:33:09&end_date_time=20181221-12:33:09`

## Server

### Enviroment Variables

ATTENDANT_KEEP_ALIVE_TIME

### Session Coordinator

To start a chat the client requests the **session coordinator** to allocate a property identification for the chat session. To do so, the client publishes a message to the topic `server/channels/request` with the following payload:

```JSON

{
  "userRequesting": "<user_id>",
  "responseTopic": "<topic_to_receive_response>"
}

```

## Chat setup

### Starting a chat

To start a chat, the client will:

1) Make a `POST` request to the backend at <API_URL>/session (like http://localhost:3000/session) to receive a generated **sessionId**
2) With the received `sessionId` the client will **publish** a message to the topic `server/sessions/request` with the following payload:

```json
{
    "sessionTopic": <session_topic>,
    "sessionId": <sessionId>,
    "customerId": <customerId>,
    "requestID": <requestId>,
}
```

Those are the topics that the client must publish and subscribe to be able to join, request and handle chats and messages:

- `server/sessions/request`: **Publish** the chat request to this topic with the following JSON paylod:

```javascript
{
  customerId: <customerId>,
  requestID: <requestID>
}
```

- `server/sessions/request`: **Publish** the chat request to this topic with the following JSON paylod:
