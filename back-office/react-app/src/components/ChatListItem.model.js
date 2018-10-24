import { RhelenaPresentationModel } from 'rhelena';
import manuh from 'manuh'

import topics from '../topics'

export default class ChatListItemModel extends RhelenaPresentationModel {
    constructor(session) {
        super();

        this.session = session        
        this.active = false

        manuh.subscribe(topics.chatStation.sessionList.selected, `ChatListItemModel_${this.session.sessionTopic}`, msg => {
            this.active = (msg.sessionTopic === this.session.sessionTopic)
        })
        // manuh.subscribe(`${topics.session.messages.channel}/${this.session.id}`, `ChatListItemModel_${this.session.id}`, msg => {
        //     this.session = msg.session
        // })
    }

    onSelect() {   
        manuh.publish(topics.chatStation.sessionList.selected, { sessionTopic: this.session.sessionTopic })
    }
}