import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'
import topics from './services/topics'

export default class MinimizedModel extends RhelenaPresentationModel {
    constructor(sessionTopic) {
        super();

        this.session = globalState.session
        
        manuh.unsubscribe(topics.sessions.updates, "MinimizedModel")
        manuh.subscribe(topics.sessions.updates, "MinimizedModel", sessionWithMessages => {
            // if the session has the `expired` attribute, the session must be cleaned
            if (sessionWithMessages.expired) {
                this.session = null
            }else{ //otherwise, updated
                this.session = sessionWithMessages
            }
        })
        
    }

    clearListeners() {
        manuh.unsubscribe(topics.sessions.updates, "MinimizedModel")
    }

}