import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from './services/topics'

export default class MessageInputTextModel extends RhelenaPresentationModel {

    sendMessage(message) {
        // publish that a message has been sent
        manuh.publish(topics.chatStation.messagePane.send, { messageContent: message })
    }
}