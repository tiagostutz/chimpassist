const assert = require('assert');
const uuidv1 = require('uuid/v1');
const mqttProvider = require('simple-mqtt-client')

const attendantScheduler = require('../src/attendant-scheduler')
const sessionCoordinator = require('../src/session-coordinator')
const topics = require('../src/lib/topics')
const status = require('../src/lib/status')
const instructions  = require('../src/lib/instructions')

const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"


const cleanData = () => {
    if (sessionCoordinator.db) {
        sessionCoordinator.db.delete(sessionCoordinator.dbPrefix)
    }
    if (attendantScheduler.db) {
        attendantScheduler.db.delete(attendantScheduler.dbPrefix)
    }
}

describe('Session Coordinator simple scenarios', () => {
    
    it("should return empty array on getOnlineSessions.", (done) => {

        mqttProvider.new().init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
            sessionCoordinator.start(mqttClient, () => {
                assert.equal(sessionCoordinator.getOnlineSessions().length, 0); 
                
                cleanData()
                done();   
            })
        })

    }).timeout(5000)

    it(`should return array with 0 session on getOnlineSessions`, (done) => {

        mqttProvider.new().init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
            sessionCoordinator.start(mqttClient, () => {
                
                //clean subscriptions from attendantScheduler that can change the behavior of session state
                mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)
                                    
                setTimeout(() => { //assert after the session request has been processed

                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 

                    
                    cleanData()
                    done();   

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.online, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": {  "id": customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)


    it(`should set the session as "aborted" due to no available attendants`, (done) => {
        mqttProvider.new().init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
            sessionCoordinator.start(mqttClient, () => {
                
                //clean subscriptions from attendantScheduler that can change the behavior of session state
                mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

                setTimeout(() => { //assert after the session request has been processed

                    // BEFORE receive the message with no attendants available
                    let sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                    let user = sessions[Object.keys(sessions)[0]]
                    let sessionInfo = user[Object.keys(user)[0]]                    
                    assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                    assert.equal(sessionCoordinator.getPendingSessions().length, 1); 
                    assert.equal(sessionInfo.status, status.session.waitingAttendantsAssignment)
                    
                    mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, { instruction: instructions.attendant.unavailableAttendants, sessionInfo: sessionInfo })

                    setTimeout(() => { //assert aborted after the coordinator receives the abort control message

                        sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                        user = sessions[Object.keys(sessions)[0]]
                        sessionInfo = user[Object.keys(user)[0]]
    
                        assert.equal(sessionCoordinator.getOnlineSessions().length, 0);                     
                        assert.equal(sessionCoordinator.getPendingSessions().length, 0); 
                        assert.equal(sessionInfo.status, status.session.aborted)

                        cleanData()
                        done();   
                    }, 50)

                }, 100)

                const customerId = "user222"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.online, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": { id: customerId },
                    "requestID": uuidv1(),
                })
            })
        })            

    }).timeout(5000)


    it(`should set the session as "ready" with one available attendant`, (done) => {

        mqttProvider.new().init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
            sessionCoordinator.start(mqttClient, () => {
                
                //clean subscriptions from attendantScheduler that can change the behavior of session state
                mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)
                                
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
                    mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantMock, sessionInfo: sessionInfo })

                    setTimeout(() => { //assert ready after the coordinator receives the attendant assignment control message

                        sessions = sessionCoordinator.db.get(sessionCoordinator.dbPrefix)                    
                        user = sessions[Object.keys(sessions)[0]]
                        sessionInfo = user[Object.keys(user)[0]]
    
                        assert.equal(sessionCoordinator.getOnlineSessions().length, 1);                     
                        assert.equal(sessionCoordinator.getPendingSessions().length, 0); 
                        assert.equal(sessionInfo.status, status.session.online)

                        cleanData()
                        done();   
                    }, 50)

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.online, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "customer": { "id": customerId },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)



    it(`should send the final chat handshake to sessionTopic`, (done) => {

        mqttProvider.new().init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {    
            sessionCoordinator.start(mqttClient, () => {
                
                //clean subscriptions from attendantScheduler that can change the behavior of session state
                mqttClient.unsubscribe(topics.server.attendants.request, attendantScheduler.instanceID)

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
        

                            cleanData()
                            done();                               
                        }
                    }, "testeSubscription") 
                    
                    mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, { instruction: instructions.attendant.assigned, attendantInfo: attendantMock, sessionInfo: sessionInfo })

                }, 100)

                const customerId = "user123"
                const sessionId = uuidv1()
                const sessionTopic = `${topics.server.sessions._path}/${customerId}/${sessionId}`
                mqttClient.publish(topics.server.sessions.online, {
                    "sessionTopic": sessionTopic,
                    "sessionId": sessionId,
                    "lastMessages": [{
                        "content": "Alice asked, handing her hand and drank some poetry repeated thoughtfully",
                        "timestamp": new Date().getTime(),
                        "from": {
                            "id": "user123",
                            "name": "Mary Lorem"
                        }
                    }],
                    "customer": { 
                        "id": customerId,
                        "name": "Mary Lorem",
                        "avatarURL":"http://cdn.mhpbooks.com/uploads/2014/03/test_ttp_big.jpg",
                        "lastSeenAt": new Date().getTime()
                    },
                    "requestID": uuidv1(),
                })
            })
        })

    }).timeout(5000)

})
