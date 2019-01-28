import { RhelenaPresentationModel } from 'rhelena';
import attendantTypes from '../attendant-types'
import manuh from 'manuh'
import config from '../config'
import topics from '../topics'

export default class LoginModel extends RhelenaPresentationModel {
    constructor() {
        super();
        this.email = null
        this.password = null
        this.errorMessage = ""
    }

    async login() {
        
        if (!config.authEndpoint) { //tests 
            const testUser = {
                id: "9999999",
                email: "chimp@support.com",
                name: "Chimp Support",
                avatarURL: null,
                type: attendantTypes.support.firstLevel
            }
            manuh.publish(topics.chatStation.user.login, testUser)
            return 
        }        
        try {            
            let authResp = await fetch(`${config.authEndpoint}/chimpassist/auth`, { 
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({
                    email: this.email,
                    password: this.password
                })
            })
            if (authResp.status === 404) {
                this.errorMessage = "No user found with that e-mail"
                return
            }
            if (authResp.status === 401) {
                this.errorMessage = "Your password is incorrect"
                return
            }
    
            const loggedUser = await authResp.json()            
            manuh.publish(topics.chatStation.user.login, loggedUser)
        } catch (error) {
            this.errorMessage = "Unexpected error authenticating the user. Check your server logs for more details."
            console.error("Error authenticating the user. Details:", error)
            
        }
    }
}