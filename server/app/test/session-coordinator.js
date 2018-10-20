const assert = require('assert');
const mqttProvider = require('../src/lib/mqtt-provider')

const sessionCoordinator = require('../src/session-coordinator')
const topics = require('../src/lib/topics')
const status = require('../src/lib/status')

describe('simple scenario', () => {
    
    it("should return empty array on getOnlineSessions.", (done) => {

        sessionCoordinator.start(() => {
            assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
            done();   
        })

    }).timeout(5000)

    it(`should return array with 0 session on getOnlineSessions with status "${status.session.waitingAttendantsAssignment}"`, (done) => {

        sessionCoordinator.start(() => {
            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, () => {    
                
                const attendantsRequestTopic = topics.server.attendants.request
                
                mqttProvider.subscribe(attendantsRequestTopic, (sessionInfo) => {
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    done();   
                })
                
                mqttProvider.publish(topics.server.sessions.request, {
                    "customerId": "user123",
                    "requestID": "req321"
                })
            })
        })

    }).timeout(5000)

})
