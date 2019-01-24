import { RhelenaPresentationModel } from 'rhelena';
import attendantTypes from '../attendant-types'
import manuh from 'manuh'

import topics from '../topics'

export default class LoginModel extends RhelenaPresentationModel {
    constructor() {
        super();
        this.email = null
        this.password = null
    }

    login() {
        const loggedUser = {
            id: "11",
            email: "julia@julia.com",
            name: "Júlia Oliveira",
            avatarURL: null,
            type: attendantTypes.support.firstLevel
        }
        if (!loggedUser.avatarURL) {
            loggedUser.avatarURL = process.env.REACT_APP_DEFAULT_ATTENDANT_AVATAR_URL || "https://st2.depositphotos.com/3369547/11899/v/950/depositphotos_118998210-stock-illustration-woman-glasses-female-avatar-person.jpg"
        }
        manuh.publish(topics.chatStation.user.login, loggedUser)
    }
}