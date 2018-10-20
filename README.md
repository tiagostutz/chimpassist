# Chimp Assist

<p align="center">
  <img height="250" src="https://res.cloudinary.com/stutzsolucoes/image/upload/c_crop,h_308/v1539906576/noun_Cabin_Monkey_774328_yxidcr.png">
</p>

Open source customer service chat plataform

Backoffice and Frontoffice chat platform made with React for a typical costumer service or support

## Server

### Channel Coordinator

To start a chat the client requests the **channel coordinator** to allocate a property identification for the chat session. To do so, the client publishes a message to the topic `server/channels/request` with the following payload:

```JSON

{
  "userRequesting": "<user_id>",
  "responseTopic": "<topic_to_receive_response>"
}

```

And re