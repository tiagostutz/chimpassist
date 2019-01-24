import { RhelenaPresentationModel } from 'rhelena';
import mqtt from 'mqtt'

export default class CustomerDetailsModel extends RhelenaPresentationModel {
    constructor(session) {
        super();

        const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8080/mqtt"

        this.session = session
        this.currentAtividadeTitulo = null
        this.currentURL = null
        this.lastSpeedY = null
        this.lastSpeedYTimer = null
        this.currentPositionY = null
        var client  = mqtt.connect(mqttBrokerHost)

        client.on('connect', () => {
            client.subscribe(`accounts/edidatico/${this.session.customer.id}/#`, (err) => {
                if (!err) {
                    client.on('message', (topic, message) => {
                        const msg = JSON.parse(message.toString())
                        if (msg.atividade_academica) {
                            this.currentAtividadeTitulo = msg.atividade_academica.replace(/\(\d+\)$/g, '')
                        }
                        if (msg["$url"]) {
                            this.currentURL = msg["$url"]
                        }
                        if (topic.match("speedY")) {
                            this.lastSpeedY = Math.round(Math.abs(msg["$documentHeight"]/(msg.value*60)))
                            // clearTimeout(this.lastSpeedYTimer)
                            // this.lastSpeedYTimer = setTimeout(() => this.lastSpeedY = 0, 10000) // if the customer stays more than 10 seconds idle, resets to zero the speed
                        }
                        if (topic.match("positionY")) {
                            this.currentPositionY = parseFloat( (msg.value/msg["$documentHeight"])*100).toFixed(2);
                        }
                        
                    })
                }
            })
          })

    }
}