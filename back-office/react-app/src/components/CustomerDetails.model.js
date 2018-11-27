import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from '../topics'


export default class CustomerDetailsModel extends RhelenaPresentationModel {

    constructor(session) {
        super();
        globalState.customerDetailsService = "http://localhost:5000/api/v1/chimpassist/customer"
        this.session = session
        this.plugSession(this.session)
        this.currentTab = 1
        
        manuh.unsubscribe(topics.chatStation.sessionList.selected, "CustomerDetailsModel")
        manuh.subscribe(topics.chatStation.sessionList.selected, "CustomerDetailsModel", msg => {    
            const lastActiveSession = globalState.sessions.filter(s => s.sessionTopic === msg.sessionTopic)[0]  
            this.plugSession(lastActiveSession)
        })

        manuh.unsubscribe(topics.sessions.updates)
        manuh.subscribe(topics.sessions.updates, "CustomerDetailsModel", updatedSession => {
            if (this.session 
                && this.session.sessionTopic === updatedSession.sessionTopic
                && this.session.sessionId !== updatedSession.sessionId) {
                    
                this.plugSession(updatedSession)    
            }
        })
    }

    async plugSession(session) {
        this.session = session        
    }

    selectTab(tab) {
        this.currentTab = tab
    }
}