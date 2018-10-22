const assert = require('assert');
const uuidv1 = require('uuid/v1');
const mqttClient = require('simple-mqtt-client')

const attendantScheduler = require('../src/attendant-scheduler')
const sessionCoordinator = require('../src/session-coordinator')
const topics = require('../src/lib/topics')
const status = require('../src/lib/status')
const instructions  = require('../src/lib/instructions')

describe('Session Coordinator simple scenarios', () => {
    
    it("should return empty array on getOnlineSessions.", (done) => {

        sessionCoordinator.start(() => {
            assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 

            sessionCoordinator.db.delete("/")
            done();   
        })

    }).timeout(5000)

    it(`should return array with 0 session on getOnlineSessions`, (done) => {

        sessionCoordinator.start(() => {
            
            //clean subscriptions from attendantScheduler that can change the behavior of session state
            mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                setTimeout(() => { //assert after the session request has been processed

                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    sessionCoordinator.db.delete("/")
                    done();   

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.request, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": {  "id": customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)


    it(`should set the session as "aborted" due to no available attendants`, (done) => {

        sessionCoordinator.start(() => {
            
            //clean subscriptions from attendantScheduler that can change the behavior of session state
            mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                setTimeout(() => { //assert after the session request has been processed

                    // BEFORE receive the message with no attendants available
                    let sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                    let user = sessions[Object.keys(sessions)[0]]
                    let sessionInfo = user[Object.keys(user)[0]]                    
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    
                    mqttClient.publish(`${sessionInfo.sessionTopic}/backend/control`, { instruction: instructions.attendant.unavailableAttendants, sessionInfo: sessionInfo })

                    setTimeout(() => { //assert aborted after the coordinator receives the abort control message

                        sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                        user = sessions[Object.keys(sessions)[0]]
                        sessionInfo = user[Object.keys(user)[0]]
    
                        assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                        assert.equal(sessionCoordinator.getPendingSessions().length, 0); 
                        assert.equal(sessionInfo.status, status.session.aborted)
                        
                        sessionCoordinator.db.delete("/")
                        done();   
                    }, 50)

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.request, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": { id: customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)


    it(`should set the session as "ready" with one available attendant`, (done) => {

        sessionCoordinator.start(() => {
            
            //clean subscriptions from attendantScheduler that can change the behavior of session state
            mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                setTimeout(() => { //assert after the session request has been processed

                    // BEFORE receive the message with no attendants available
                    let sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                    let user = sessions[Object.keys(sessions)[0]]
                    let sessionInfo = user[Object.keys(user)[0]]                    
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    
                    const attendantMock = {
                        id: 123,
                        status: status.attendant.connection.online,
                        activeSessions: []
                    }
                    mqttClient.publish(`${sessionInfo.sessionTopic}/backend/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantMock, sessionInfo: sessionInfo })

                    setTimeout(() => { //assert ready after the coordinator receives the attendant assignment control message

                        sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                        user = sessions[Object.keys(sessions)[0]]
                        sessionInfo = user[Object.keys(user)[0]]
    
                        assert.equal(sessionCoordinator.getOnlineSessions().length, 1);                     
                        assert.equal(sessionCoordinator.getPendingSessions().length, 0); 
                        assert.equal(sessionInfo.status, status.session.ready)
                        
                        sessionCoordinator.db.delete("/")
                        done();   
                    }, 50)

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.request, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": { "id": customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)



    it(`should send the final chat handshake to sessionTopic`, (done) => {

        sessionCoordinator.start(() => {
            
            //clean subscriptions from attendantScheduler that can change the behavior of session state
            mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

            mqttClient.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                                
                setTimeout(() => { //assert after the session request has been processed

                    // BEFORE receive the message with no attendants available
                    let sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                    let user = sessions[Object.keys(sessions)[0]]
                    let sessionInfo = user[Object.keys(user)[0]]                    
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    
                    const attendantMock = {
                        id: 123,
                        status: status.attendant.connection.online,
                        activeSessions: []
                    }

                    mqttClient.subscribe(`${sessionInfo.sessionTopic}/client/control`, (msg) => { //handle the last control message: "session ready"
                        
                        if (msg.instruction === instructions.session.ready) {
                            assert.equal(sessionCoordinator.getOnlineSessions().length, 1);                     
                            assert.equal(sessionCoordinator.getPendingSessions().length, 0); 
        
                            sessionCoordinator.db.delete("/")
                            done();                               
                        }
                    }, "testeSubscription") 
                    
                    mqttClient.publish(`${sessionInfo.sessionTopic}/backend/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantMock, sessionInfo: sessionInfo })

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.request, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": { "id": customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)

})
