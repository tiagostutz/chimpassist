# Chimp Assist

<p align="center">
  <img height="250" src="https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_308/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png">
</p>

Open source customer service chat plataform

Backoffice and Frontoffice chat platform made with React for a typical costumer service or support

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
