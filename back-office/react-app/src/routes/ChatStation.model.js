import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from '../topics'
import chatServices from '../services/chatServices'
import attendantTypes from '../attendant-types'
import status from '../status'

import debugLib from 'debug'
const debug = debugLib('debug-model-chatStation')

export default class ChatStationModel extends RhelenaPresentationModel {
    constructor() {
        super();

        globalState.loggedUser = {
            id: "10",
            email: "john@smiht.com",
            name: "John Smith",
            avatarURL: "https://st2.depositphotos.com/3369547/11899/v/950/depositphotos_118998210-stock-illustration-woman-glasses-female-avatar-person.jpg",
            type: attendantTypes.support.firstLevel
        }

        globalState.sessions = [] //initialize variable
        globalState.sessionsRefresh = [] //initialize variable

        chatServices.startService(globalState.loggedUser, async (activeSessions) => {
            debug("Chat Service started from ChatStationModel")

            //initialize sessions
            manuh.unsubscribe(topics.sessions.updates, "ChatStation")
            globalState.sessions = activeSessions
            globalState.sessions.forEach(session => {
                globalState.sessionsRefresh.push({
                    sessionId: session.sessionId,
                    lastRefresh: new Date().getTime()
                })
                manuh.publish(topics.sessions.updates, session)
            })
            
            // update globalState customer list
            manuh.subscribe(topics.sessions.updates, "ChatStation", session => {            
                
                let currentSessionsArr = globalState.sessions.filter(s => s.sessionTopic === session.sessionTopic)
                if (currentSessionsArr.length === 0) { //new user                    
                    globalState.sessions.push(session)
                    globalState.sessionsRefresh.push({
                        sessionId: session.sessionId,
                        lastRefresh: new Date().getTime()
                    })
                }else{
                    // replace the customer in the global list with the received one
                    globalState.sessions = globalState.sessions.map(s => s.sessionTopic === session.sessionTopic ? session : s)                    
                    // replace the refresh
                    globalState.sessionsRefresh = globalState.sessionsRefresh.map(sessionRefresh => sessionRefresh.sessionId !== session.sessionId ? sessionRefresh : {
                        sessionId: session.sessionId,
                        lastRefresh: new Date().getTime()
                    })
                }                
            })
            // -- end of customers setup
            
            // check the session updates
            setInterval(() => {
                globalState.sessionsRefresh.forEach(sessionRefresh => {
                    //if the customer stop sending refresh for more than 60 seconds, it will considered offline
                    if(new Date().getTime() - sessionRefresh.lastRefresh > 60000) {
                        let sessionExpiredArr = globalState.sessions.filter(s => s.sessionId === sessionRefresh.sessionId)
                        if (sessionExpiredArr.length > 0) {
                            let sessionExpired = sessionExpiredArr[0]
                            sessionExpired.status = status.session.aborted
                            manuh.publish(topics.sessions.updates, sessionExpired)
                        }
                    }                    
                })
            }, 5000)
        })
    
    }   
}