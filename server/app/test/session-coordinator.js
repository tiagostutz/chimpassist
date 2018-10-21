const assert = require('assert');
const mqttClient = require('../src/lib/mqtt-provider')

const attendantScheduler = require('../src/attendant-scheduler')
const sessionCoordinator = require('../src/session-coordinator')
const topics = require('../src/lib/topics')

describe('Session Coordinator simple scenarios', () => {
    
    it("should return empty array on getOnlineSessions.", (done) => {

        sessionCoordinator.start(() => {
            assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
            done();   
        })

    }).timeout(5000)

    it(`should return array with 0 session on getOnlineSessions`, (done) => {

        sessionCoordinator.start(() => {
            
            //clean subscriptions from attendatScheduler that can change the behavior of session state
            mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                setTimeout(() => { //session request must be finished

                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    done();   

                }, 100)

                mqttClient.publish(topics.server.sessions.request, {
                    "customerId": "user123",
                    "requestID": "req321"
                })
            })
        })

    }).timeout(5000)

})
