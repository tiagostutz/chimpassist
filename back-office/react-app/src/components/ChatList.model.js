import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from "manuh"

import topics from '../topics'

export default class ChatListModel extends RhelenaPresentationModel {

    constructor() {
        super();
        
        this.onlineSessions = globalState.sessions.filter(s => s.isOnline)
        this.offlineSessions = globalState.sessions.filter(s => !s.isOnline)
        
        manuh.subscribe(topics.sessions.updates, "ChatListModel", session => {            
            if (session.isOnline) {
                const search = this.onlineSessions.filter(s => s.sessionTopic === session.sessionTopic)                
                if (search.length === 0) {
                    this.onlineSessions.push(session)
                }
                this.offlineSessions = this.offlineSessions.filter(s => s.sessionTopic !== session.sessionTopic)
            }else{
                const search = this.offlineSessions.filter(s => s.sessionTopic === session.sessionTopic)
                if (search.length === 0) {
                    this.offlineSessions.push(session)
                }
                this.onlineSessions = this.onlineSessions.filter(s => s.sessionTopic !== session.sessionTopic)
            }
        })        
    }

}