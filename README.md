# Chimp Assist

<p align="center">
  <img height="250" src="https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_308/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png">
</p>

Open source customer service chat plataform

Backoffice and Frontoffice chat platform made with React for a typical customer service or support

## Statistics endpoints

The backoffice application invokes a set of REST endpoints that you should implement following a JSON format that will enrich the customer panel information. So, you will implement your own logic and pass the base endpoint - **without** the **/chimpassist** part - to the environment variable `STATISTICS_BASE_ENDPOINT` and implement the following:

- `/chimpassist/:customerId/contactInfo` - returns customer contact info:
```JSON
{
  "e-mail": "user@email.com",
  "phone1": "+1 222 999 999 999",
  "phone2": "+55 61 99676 8989"
}
```

- `/chimpassist/:customerId/additionalInfo` - returns customer additional info, specific to your domain
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

- `/chimpassist/:customerId/statistics?start_date_time=<start_date_time>&end_date_time=<end_date)time>` - returns a filtered array with the statistics filtered by datetimes having 3 possible formats:
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
