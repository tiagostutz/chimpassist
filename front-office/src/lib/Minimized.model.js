import { RhelenaPresentationModel } from 'rhelena';
import manuh from 'manuh'
import topics from './services/topics'

export default class MinimizedModel extends RhelenaPresentationModel {
    constructor(sessionTopic) {
        super();

        this.session = null
        
        manuh.unsubscribe(topics.sessions.updates, "MinimizedModel")
        manuh.subscribe(topics.sessions.updates, "MinimizedModel", sessionWithMessages => {
            this.session = sessionWithMessages
        })
        
    }

}