import { RhelenaPresentationModel, globalState } from 'rhelena';
import manuh from 'manuh'

import topics from './topics'

export default class AppModel extends RhelenaPresentationModel {
    constructor() {
        super();

        if (window.localStorage["loggedUser"]) {
            globalState.loggedUser = JSON.parse(window.localStorage["loggedUser"])
        }
        this.loggedUser = globalState.loggedUser
        manuh.unsubscribe(topics.chatStation.user.login, "AppModel")
        manuh.subscribe(topics.chatStation.user.login, "AppModel", loggedUser => {
            globalState.loggedUser = loggedUser
            this.loggedUser = loggedUser
            window.localStorage["loggedUser"] = JSON.stringify(this.loggedUser)
        })
        manuh.unsubscribe(topics.chatStation.user.logout, "AppModel")
        manuh.subscribe(topics.chatStation.user.logout, "AppModel", _ => {
            this.loggedUser = null
            globalState.loggedUser = null
            delete window.localStorage["loggedUser"]
        })
    }

    logout() {
        manuh.publish(topics.chatStation.user.logout, this.loggedUser)        
    }
}