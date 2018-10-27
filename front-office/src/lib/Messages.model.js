import { RhelenaPresentationModel } from 'rhelena';
import manuh from 'manuh'
import topics from './services/topics'

export default class MessagesModel extends RhelenaPresentationModel {
    constructor(sessionTopic) {
        super();

        this.session = null
        
        manuh.unsubscribe(topics.sessions.updates, "MessagesModel")
        manuh.subscribe(topics.sessions.updates, "MessagesModel", sessionWithMessages => {
            this.session = sessionWithMessages
        })
        
    }
}