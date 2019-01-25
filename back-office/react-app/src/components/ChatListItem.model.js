import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import chatServices from '../services/chatServices'
import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(session) {
        super();

        this.session = session        
        this.active = globalState.lastActiveSession ? globalState.lastActiveSession.sessionTopic === this.session.sessionTopic : null

        manuh.unsubscribe(topics.chatStation.sessionList.selected, `ChatListItemModel_${this.session.sessionTopic}`)
        manuh.subscribe(topics.chatStation.sessionList.selected, `ChatListItemModel_${this.session.sessionTopic}`, msg => {
            this.active = (msg.sessionTopic === this.session.sessionTopic)
        })

        manuh.unsubscribe(`${this.session.sessionTopic}/updates`, `ChatListItemModel_${this.session.sessionTopic}`)
        manuh.subscribe(`${this.session.sessionTopic}/updates`, `ChatListItemModel_${this.session.sessionTopic}`, msg =>  {
            this.session = msg.session
        })

        // plug into session chat
        this.plugSession(session)

    }

    cleanup() {
        manuh.unsubscribe(topics.chatStation.sessionList.selected, `ChatListItemModel_${this.session.sessionTopic}`)
        manuh.unsubscribe(`${this.session.sessionTopic}/updates`, `ChatListItemModel_${this.session.sessionTopic}`)
    }

    plugSession(session) {        
        // connect to this chat session topic messages
        chatServices.connectToChatSession(session, `ChatModelItem-${this.session.sessionTopic}`, 
            sessionUpdated => {
                this.session = sessionUpdated
            },
            payload => {                
                this.session = payload.sessionInfo //refresh session data (even messages)            
        })
    }

    onSelect() {   
        manuh.publish(topics.chatStation.sessionList.selected, { sessionTopic: this.session.sessionTopic })
    }
}