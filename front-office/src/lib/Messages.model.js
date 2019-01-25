import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import topics from './services/topics'

export default class MessagesModel extends RhelenaPresentationModel {
    constructor() {
        super();

        this.session = globalState.session
        this.userData = globalState.userData
        
        this.markAllMessagesAsRead()
        manuh.unsubscribe(topics.sessions.updates, "MessagesModel")
        manuh.subscribe(topics.sessions.updates, "MessagesModel", session => {
            session.lastMessages = this.session.lastMessages
            this.session = session            
        })        

        manuh.unsubscribe(`${this.session.sessionTopic}/messages`, "MessagesModel")
        manuh.subscribe(`${this.session.sessionTopic}/messages`, "MessagesModel", payload => {
            const mixSession = this.session                
            const sessionWithMessages = payload.sessionInfo
            // add the las received message to the list
            mixSession.lastMessages.push(sessionWithMessages.lastMessages[sessionWithMessages.lastMessages.length-1])

            // notify that the message has arrived and viewed
            if (globalState.windowFocused) {                
                this.markAllMessagesAsRead()                
            }            
            this.session = mixSession
        })

        // mark messages as read
        manuh.unsubscribe(topics.chatStation.window.visibility, "MessagesModel")
        manuh.subscribe(topics.chatStation.window.visibility, "MessagesModel", msg => {
            if (msg.status === "visible") {
                this.markAllMessagesAsRead()
            }
        })

        globalState.mqttClient.subscribe(`${this.session.sessionTopic}/messages/viewed`, msg => { //update messages viewed by the attendant            
            msg.readMessages.forEach(m => {
                let msgIndex = this.session.lastMessages.findIndex(lm => lm.timestamp === m.timestamp && lm.from.id === m.from.id)
                if(msgIndex !== -1) {
                    this.session.lastMessages[msgIndex] = m
                }
            }, "MessagesModel")
            manuh.publish(topics.sessions.updates, this.session)
        })
    }

    markAllMessagesAsRead() {
        let unreadMessages = []
        this.session.lastMessages.forEach(m => {
            if (!m.readAt && m.from.id != this.userData.id) {
                m.readAt = new Date().getTime()
                unreadMessages.push(m)
            }
        })
        if (unreadMessages.length > 0) {
            globalState.mqttClient.publish(`${this.session.sessionTopic}/messages/viewed`, { session: this.session,  readMessages: unreadMessages})            
        }
    }

    clearListeners() {
        manuh.unsubscribe(topics.sessions.updates, "MessagesModel")
        manuh.unsubscribe(`${this.session.sessionTopic}/messages`, "MessagesModel")
    }
}