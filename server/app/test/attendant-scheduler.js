const assert = require('assert')
const mqttProvider = require('../src/lib/mqtt-provider')
const attendatScheduler = require('../src/attendant-scheduler')
const status = require('../src/lib/status')
const topics  = require('../src/lib/topics')
const attendatTypes = require('../src/lib/attendant-types')

describe("Attendant Scheduler simple scenarios", () => {
    it("Should return empty array of attendants on a recently initiated scheduler", (done) => {
        attendatScheduler.start(() => {
            assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
            done();
        })
    })

    it("Should return an array with 1 attendants ON-LINE", (done) => {
        attendatScheduler.start(() => {            
            const attendantMock = {
                id: 123,
                status: status.attendant.connection.online,
                activeSessions: []
            }
            attendatScheduler.db.insert(attendatScheduler.dbPrefix  + "/teste1", attendantMock)
            assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 1)
            
            attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/teste1")
            done();
        }) 
    })

    it("Should have 1 assistant ON-LINE registered by topic publish", (done) => {
        attendatScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                const attendantMock = {
                    id: 123,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock })

                setTimeout(() => {
                    assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 1)
                    
                    attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock.id)
                    done()
                }, 50)
                
            })
        })
    })



    it("Should have 3 assistant ON-LINE registered by topic publish", (done) => {
        attendatScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
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
                assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 })
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock3 })

                setTimeout(() => {
                    assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 3)
                    
                    attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock1.id)
                    attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock2.id)
                    attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock3.id)
                    done()
                }, 150)
                
            })
        })
    })


    it("Should expire the assistant after registering it by topic publish", (done) => {
        const keepAliveTTL = 100
        attendatScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                const attendantMock = {
                    id: 1234,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock })

                setTimeout(() => {
                    assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 1)

                    setTimeout(() => { //check if the assistant expired
                        assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
                        
                        attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock.id)
                        done()
                    }, keepAliveTTL+100)
                }, 50)
                
            })
        }, keepAliveTTL)
    }).timeout(2000)


    it("Should expire one assistant and refresh another after registering it by topic publish", (done) => {
        const keepAliveTTL = 200
        attendatScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
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
                assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 })
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                setTimeout(() => {
                    assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 2)
                    mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                    setTimeout(() => { //check if the assistant expired
                        assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 1)
                        assert.equal(attendatScheduler.getOrderedOnlineAttendants()[0].id, 42)
                        
                        attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock1.id)
                        attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock2.id)
                        done()
                    }, keepAliveTTL-10)

                }, keepAliveTTL/2)
                
            })
        }, keepAliveTTL)
    }).timeout(2000)

    it("Should have 1 assistant ON-LINE registered and assigned to a session", (done) => {
        attendatScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                const attendantMock = {
                    id: 51,
                    status: status.attendant.connection.online,
                    activeSessions: [],
                    type: attendatTypes.support.firstLevel
                }    
                assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock })

                setTimeout(() => {
                    assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 1)

                    const sessionInfo = {
                        "sessionTopic": "sessions/test/session51",
                        "customerRequestID": "test51u1",
                        "customerId": "u1",
                        "createdAt": new Date().getTime(), 
                        "status": status.session.waitingAttendantsAssignment,
                        "sessionTemplate": {
                            customersAllowed: 1,
                            attendants: [{
                                type: attendatTypes.support.firstLevel,
                                required: true
                            }]            
                        }, 
                        "assignedAttendants": []
                    }

                    // listen for attendant request and check the server status before and after responding
                    mqttClient.subscribe(`${topics.client.attendants.assign}/${attendantMock.id}`, (msg) => {
                        let attendantAssigned = attendatScheduler.db.get(attendatScheduler.dbPrefix  + "/" + attendantMock.id)
                        
                        // BEFORE responding
                        let activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                        assert.equal(activeSessions.length, 0) // as the attendant has not yet responded, there are no active sessions for it                        
                        
                        // assignment response from client
                        mqttClient.publish(topics.server.attendants.assign, { attendantInfo: attendantMock, sessionInfo: sessionInfo })

                        setTimeout(() => {
                            
                            // AFTER responding
                            attendantAssigned = attendatScheduler.db.get(attendatScheduler.dbPrefix  + "/" + attendantMock.id)
                            activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                            assert.equal(activeSessions.length, 1)
                            assert.equal(activeSessions[0].sessionTopic, sessionInfo.sessionTopic)
                            assert.equal(activeSessions[0].customerRequestID, sessionInfo.customerRequestID)
                            assert.equal(activeSessions[0].customerId, sessionInfo.customerId)
                            assert.equal(activeSessions[0].createdAt, sessionInfo.createdAt)
                            
                            attendatScheduler.db.delete(attendatScheduler.dbPrefix  + "/" + attendantMock.id)
                            done()
                            
                        }, 100)
                        
                    })

                    mqttClient.publish(topics.server.attendants.request, sessionInfo)
                    
                }, 50)
                
            })
        })
    })

    
})