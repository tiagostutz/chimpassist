import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from '../topics'
import chatServices from '../services/chatServices'
import status from '../status'

import debugLib from 'debug'
const debug = debugLib('debug-model-chatStation')

export default class ChatStationModel extends RhelenaPresentationModel {
    constructor() {
        super();

        this.blockMessage = null
        globalState.sessions = [] //initialize variable
        globalState.sessionsRefresh = [] //initialize variable

        chatServices.startService(globalState.loggedUser, async (activeSessions) => {
            debug("Chat Service started from ChatStationModel")

            //initialize sessions
            manuh.unsubscribe(topics.sessions.updates, "ChatStation")
            globalState.sessions = activeSessions
            globalState.sessions.forEach(session => {
                globalState.sessionsRefresh.push({
                    sessionTopic: session.sessionTopic,
                    lastRefresh: new Date().getTime()
                })
                manuh.publish(topics.sessions.updates, session)
            })
            
            // update globalState customer list
            manuh.subscribe(topics.sessions.updates, "ChatStation", session => {            
                
                let newSessionRefresh = {
                    sessionTopic: session.sessionTopic,
                    lastRefresh: new Date().getTime()
                }
                let currentSessionsArr = globalState.sessions.filter(s => s.sessionTopic === session.sessionTopic)
                if (currentSessionsArr.length === 0) { //new user                    
                    globalState.sessions.push(session)
                    globalState.sessionsRefresh.push(newSessionRefresh)
                }else{
                    // replace the customer in the global list with the received one
                    globalState.sessions = globalState.sessions.map(s => s.sessionTopic === session.sessionTopic ? session : s)                    
                    // replace the refresh
                    globalState.sessionsRefresh = globalState.sessionsRefresh.map(sessionRefresh => sessionRefresh.sessionTopic !== session.sessionTopic ? sessionRefresh : newSessionRefresh)
                }  
                
            })
            // -- end of customers setup


            // Receive remote commands
            manuh.unsubscribe(topics.chatStation.user.block, "ChatStation")
            manuh.subscribe(topics.chatStation.user.block, "ChatStation", msg => {
                this.blockMessage = msg.info
            })
            manuh.unsubscribe(topics.chatStation.user.unblock, "ChatStation")
            manuh.subscribe(topics.chatStation.user.unblock, "ChatStation", _ => {
                console.log('========>>>>>>>!!! UNBLOCK!')
                this.blockMessage = 0
            })
            // -- end of remote commands
            
            // check the session updates
            setInterval(() => {
                globalState.sessionsRefresh.forEach(sessionRefresh => {
                    //if the customer stop sending refresh for more than 60 seconds, it will considered offline
                    
                    if(new Date().getTime() - sessionRefresh.lastRefresh > 60000) {
                        let sessionExpiredArr = globalState.sessions.filter(s => s.sessionTopic === sessionRefresh.sessionTopic)
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