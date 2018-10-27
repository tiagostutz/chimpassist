import mqttProvider from 'simple-mqtt-client'
import chatServices from './chatServices'
import topics from '../topics'
import status from '../status'
import attendantTypes from '../attendant-types'
import moment from 'moment'

const mqttBrokerHost = process.env.REACT_APP_MQTT_BROKER_HOST || "http://localhost:8081/mqtt"
const mqttBrokerUsername = process.env.REACT_APP_MQTT_USERNAME || ""
const mqttBrokerPassword = process.env.REACT_APP_MQTT_PASSWORD || ""
const baseTopic = process.env.REACT_APP_MQTT_BASE_TOPIC

global.fetch = require('jest-fetch-mock')

test('KeepAlive send frequency', done => {

    let counter = 0;
    let attendantInfo = { 
        id: "at1@chimpassist.com",
        type: attendantTypes.support.firstLevel
    }
    mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, baseTopic, (mqttClientParam) => {    
        
        // with a keepAlive of 1000ms the heartbit send frequency will be 500ms ( = keepAliveTTL/2 )
        fetch.once(JSON.stringify({ "keepAliveTTL": "400" }))
        chatServices.startService(attendantInfo, () => {
            counter++
            mqttClientParam.subscribe(topics.server.attendants.online, (_) => {
                counter++
            })  
        });

        setTimeout(() => {
            expect(counter).toEqual(4)
            done()
        }, 800)
    })
})


test('Attendant assignment receive', done => {

    fetch.once(JSON.stringify({ "keepAliveTTL": "20000" }))
    let attendantInfo = { 
        id: "at1@chimpassist.com",
        type: attendantTypes.support.firstLevel
    }
    const sessionInfo = {
        "sessionTopic": "sessions/test/session51",
        "sessionId": "99999999",
        "customerRequestID": "test51u1",
        "lastMessages": [],
        "customer": {
            id: "1",
            name: "Enzo",
            avatarURL: "https://pickaface.net/gallery/avatar/20130919_112248_1385_mock.png",
            lastSeenAt: moment(new Date()).add(-3, 'minutes'),
            status: status.session.online,
        },
        "status": status.session.waitingAttendantsAssignment
    }
    
    mqttProvider.init(mqttBrokerHost, mqttBrokerUsername, mqttBrokerPassword, baseTopic, (mqttClientParam) => {    
        
        // with a keepAlive of 1000ms the heartbit send frequency will be 500ms ( = keepAliveTTL/2 )
        chatServices.startService(attendantInfo, () => {            
            mqttClientParam.publish(topics.server.sessions.online, sessionInfo)
        });

        setTimeout(() => {
            done()
        }, 1000)
    })
})
