const assert = require('assert');
const mqttClient = require('../src/lib/mqtt-provider')

const SessionCoordinator = require('../src/session-coordinator')
const topics = require('../src/lib/topics')
const status = require('../src/lib/status')

describe('Session Coordinator simple scenarios', () => {
    
    it("should return empty array on getOnlineSessions.", (done) => {

        const sessionCoordinator = new SessionCoordinator();
        sessionCoordinator.start(() => {
            assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
            done();   
        })

    }).timeout(5000)

    it(`should return array with 0 session on getOnlineSessions with status "${status.session.waitingAttendantsAssignment}"`, (done) => {

        const sessionCoordinator = new SessionCoordinator();
        sessionCoordinator.start(() => {
            
            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                mqttClient.subscribe(topics.server.attendants.request, (sessionInfo) => {
                    
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    done();   
                })
                mqttClient.publish(topics.server.sessions.request, {
                    "customerId": "user123",
                    "requestID": "req321"
                })
            })
        })

    }).timeout(5000)

})
