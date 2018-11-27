import { RhelenaPresentationModel } from 'rhelena';
import mqtt from 'mqtt'

export default class CustomerDetailsModel extends RhelenaPresentationModel {
    constructor(session) {
        super();

        const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"

        this.session = session
        this.currentAtividadeTitulo = null
        this.currentURL = null
        this.lastSpeedY = null
        var client  = mqtt.connect(mqttBrokerHost)

        client.on('connect', () => {
            client.subscribe(`accounts/edidatico/${this.session.customer.id}/#`, (err) => {
                if (!err) {
                    client.on('message', (topic, message) => {
                        const msg = JSON.parse(message.toString())
                        if (msg.atividade_academica) {
                            this.currentAtividadeTitulo = msg.atividade_academica
                        }
                        if (msg["$url"]) {
                            this.currentURL = msg["$url"]
                        }
                        if (topic.match("speedY")) {
                            this.lastSpeedY = msg.value
                        }
                    })
                }
            })
          })

    }
}