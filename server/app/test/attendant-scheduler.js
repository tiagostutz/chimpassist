const assert = require('assert')
const mqttProvider = require('simple-mqtt-client')
const attendantScheduler = require('../src/attendant-scheduler')
const sessionCoordinator = require('../src/session-coordinator')
const status = require('../src/lib/status')
const topics  = require('../src/lib/topics')
const instructions  = require('../src/lib/instructions')
const attendantTypes = require('../src/lib/attendant-types')

const mqttBaseTopic = process.env.MQTT_BASE_TOPIC || "chimpassist/demo"


const cleanData = () => {
    if (sessionCoordinator.db) {
        sessionCoordinator.db.delete(sessionCoordinator.dbPrefix)
    }
    if (attendantScheduler.db) {
        attendantScheduler.db.delete(attendantScheduler.dbPrefix)
    }
}

describe("Attendant Scheduler simple scenarios", () => {
    it("Should return empty array of attendants on a recently initiated scheduler", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {        
            attendantScheduler.start(mqttClient, () => {
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
    
                cleanData()
                done();
            })
        })
    })

    it("Should return an array with 1 attendants ON-LINE", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {        
            attendantScheduler.start(mqttClient, () => {            
                const attendantMock = {
                    id: 123,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }
                attendantScheduler.db.insert(attendantScheduler.dbPrefix  + "/teste1", attendantMock)
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
                
                cleanData()
                done();
            }) 
        })
    })

    it("Should have 1 assistant ON-LINE registered by topic publish", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, mqttBaseTopic, (mqttClient) => {        
            attendantScheduler.start(mqttClient, () => {            
                const attendantMock = {
                    id: 123,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock } )

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
                    
                    cleanData()
                    done()
                }, 50)
                
            })
        })
    })



    it("Should have 3 assistant ON-LINE registered by topic publish", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
            attendantScheduler.start(mqttClient, () => {            
                const attendantMock1 = {
                    id: 1231,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }
                const attendantMock2 = {
                    id: 1232,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }
                const attendantMock3 = {
                    id: 1233,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 } )
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 } )
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock3 } )

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 3)
                    
                    cleanData()
                    done()
                }, 150)
                
            })
        })
    })


    it("Should expire the assistant after registering it by topic publish", (done) => {
        const keepAliveTTL = 100
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
            attendantScheduler.start(mqttClient, () => {            
                const attendantMock = {
                    id: 1234,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock } )

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)

                    setTimeout(() => { //check if the assistant expired
                        assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                        
                        cleanData()
                        done()
                    }, keepAliveTTL+100)
                }, 50)
                
            }, keepAliveTTL)
        })
    }).timeout(2000)


    it("Should expire one assistant and refresh another after registering it by topic publish", (done) => {
        const keepAliveTTL = 200
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
        attendantScheduler.start(mqttClient, () => {            
                const attendantMock1 = {
                    id: 41,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                const attendantMock2 = {
                    id: 42,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 })
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 2)
                    mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                    setTimeout(() => { //check if the assistant expired
                        assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
                        assert.equal(attendantScheduler.getOrderedOnlineAttendants()[0].id, 42)
                        
                        cleanData()
                        done()
                    }, keepAliveTTL-10)

                }, keepAliveTTL/2)
                
            }, keepAliveTTL)
        })
    }).timeout(2000)

    it("Should have 1 assistant ON-LINE assigned to a session that will expire and have this session removed from this activeSessions list", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
            attendantScheduler.start(mqttClient, () => {            
                const attendantMock = {
                    id: 55,
                    status: status.attendant.connection.online,
                    activeSessions: [],
                    type: attendantTypes.support.firstLevel
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online,{ attendantInfo:  attendantMock })

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)

                    const sessionInfo = {
                        "sessionTopic": "sessions/test/session55",
                        "sessionId": "session55",
                        "requestID": "req55",
                        "sessionTemplate": {
                            customersAllowed: 1,
                            attendants: [{
                                type: attendantTypes.support.firstLevel,
                                required: true
                            }]            
                        },
                        "assignedAttendants": [],  
                        "createdAt": new Date().getTime(),   
                        "status": status.session.waitingAttendantsAssignment,                   
                        "lastMessages": [{
                            "content": "Alice asked, handing her hand and drank some poetry repeated thoughtfully",
                            "timestamp": new Date().getTime(),
                            "from": {
                                "id": "user123",
                                "name": "Mary Lorem"
                            }
                        }],
                        "customer": { 
                            "id": "u55",
                            "name": "Mary Lorem",
                            "avatarURL":"http://cdn.mhpbooks.com/uploads/2014/03/test_ttp_big.jpg",
                            "lastSeenAt": new Date().getTime()
                        }
                    }
                    
                    // listen for attendant request and check the server status before and after responding
                    mqttClient.subscribe(`${topics.client.attendants.assign}/${attendantMock.id}`, _ => {
                        let attendantAssigned = attendantScheduler.db.get(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                        
                        // BEFORE responding
                        let activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                        assert.equal(activeSessions.length, 0) // as the attendant has not yet responded, there are no active sessions for it                                                                    
                        mqttClient.publish(topics.server.attendants.assign, { attendantInfo: attendantMock, sessionInfo: sessionInfo })

                        setTimeout(() => {
                            // AFTER responding
                            attendantAssigned = attendantScheduler.db.get(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                            activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                            assert.equal(activeSessions.length, 1)
                            assert.equal(activeSessions[0].sessionTopic, sessionInfo.sessionTopic)
                            assert.equal(activeSessions[0].customerRequestID, sessionInfo.customerRequestID)
                            assert.equal(activeSessions[0].customer.id, sessionInfo.customer.id)
                            assert.equal(activeSessions[0].createdAt, sessionInfo.createdAt)
                            
                            // EXPIRE session
                            mqttClient.publish(`${sessionInfo.sessionTopic}/server/control`, {
                                instruction: instructions.session.aborted.expired, 
                                sessionInfo: sessionInfo 
                            })

                            setTimeout(() => {
                                attendantAssigned = attendantScheduler.db.get(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                                activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                                assert.equal(activeSessions.length, 0)
                                
                                cleanData()
                                done()
                            }, 70)

                        }, 70)
                            
                    })

                    // reuest attendant assignment
                    mqttClient.publish(topics.server.attendants.request, sessionInfo)
                    
                }, 70)
                
            })
        })
    })

    
})