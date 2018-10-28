import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from './services/topics'

export default class MessagesModel extends RhelenaPresentationModel {
    constructor(sessionTopic) {
        super();

        this.session = globalState.session
        
        manuh.unsubscribe(topics.sessions.updates, "MessagesModel")
        manuh.subscribe(topics.sessions.updates, "MessagesModel", session => {
            session.lastMessages = this.session.lastMessages
            this.session = session            
        })        

        manuh.unsubscribe(`${this.session.sessionTopic}/messages`, "MessagesModel")
        manuh.subscribe(`${this.session.sessionTopic}/messages`, "MessagesModel", sessionWithMessages => {
            const mixSession = this.session                
            mixSession.lastMessages.push(sessionWithMessages.lastMessages[sessionWithMessages.lastMessages.length-1])
            this.session = mixSession
        })
    }

    clearListeners() {
        manuh.unsubscribe(topics.sessions.updates, "MessagesModel")
        manuh.unsubscribe(`${this.session.sessionTopic}/messages`, "MessagesModel")
    }
}