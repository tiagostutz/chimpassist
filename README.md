# Chimp Assist

<p align="center">
  <img height="250" src="https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_308/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png">
</p>

Open source customer service chat plataform

Backoffice and Frontoffice chat platform made with React for a typical customer service or support

## Statistics endpoints

The backoffice application has a set of REST endpoints that you may implement following a JSON format that will enrich the customer panel information. So, you have just to implement your own endpoint and pass the base endpoint - **without** the `/chimpassist` part - to the environment variable `STATISTICS_BASE_ENDPOINT` and implement the following endpoints:

- `/chimpassist/:customerId/statistics?start_date_time=<start_date_time>&end_date_time=<end_date)time>`: will retrieve the statistics using the datetimes to filter the statistics by time.

Some examples:

- last 24h: `/chimpassist/298301/statistics?start_date_time=20181221-11:33:09&end_date_time=20181221-12:33:09`
- last 7 days `/chimpassist/298301/statistics?start_date_time=20181214-12:33:09&end_date_time=20181221-12:33:09`

### `/statistics` JSON return

The JSON returned by the `/statistics` **must be an array** in the following format:
```JSON
[{
  "label": "Unresolved tickets",
  "value": ""
}]
```


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
