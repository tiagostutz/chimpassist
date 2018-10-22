const assert = require('assert')
const mqttProvider = require('simple-mqtt-client')
const attendantScheduler = require('../src/attendant-scheduler')
const status = require('../src/lib/status')
const topics  = require('../src/lib/topics')
const attendantTypes = require('../src/lib/attendant-types')

describe("Attendant Scheduler simple scenarios", () => {
    it("Should return empty array of attendants on a recently initiated scheduler", (done) => {
        attendantScheduler.start(() => {
            assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
            done();
        })
    })

    it("Should return an array with 1 attendants ON-LINE", (done) => {
        attendantScheduler.start(() => {            
            const attendantMock = {
                id: 123,
                status: status.attendant.connection.online,
                activeSessions: []
            }
            attendantScheduler.db.insert(attendantScheduler.dbPrefix  + "/teste1", attendantMock)
            assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
            
            attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/teste1")
            done();
        }) 
    })

    it("Should have 1 assistant ON-LINE registered by topic publish", (done) => {
        attendantScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                const attendantMock = {
                    id: 123,
                    status: status.attendant.connection.online,
                    activeSessions: []
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock } )

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
                    
                    attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                    done()
                }, 50)
                
            })
        })
    })



    it("Should have 3 assistant ON-LINE registered by topic publish", (done) => {
        attendantScheduler.start(() => {            
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
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 } )
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 } )
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock3 } )

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 3)
                    
                    attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock1.id)
                    attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock2.id)
                    attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock3.id)
                    done()
                }, 150)
                
            })
        })
    })


    it("Should expire the assistant after registering it by topic publish", (done) => {
        const keepAliveTTL = 100
        attendantScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
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
                        
                        attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                        done()
                    }, keepAliveTTL+100)
                }, 50)
                
            })
        }, keepAliveTTL)
    }).timeout(2000)


    it("Should expire one assistant and refresh another after registering it by topic publish", (done) => {
        const keepAliveTTL = 200
        attendantScheduler.start(() => {            
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
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)

                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock1 })
                mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 2)
                    mqttClient.publish(topics.server.attendants.online, { attendantInfo: attendantMock2 })

                    setTimeout(() => { //check if the assistant expired
                        assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)
                        assert.equal(attendantScheduler.getOrderedOnlineAttendants()[0].id, 42)
                        
                        attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock1.id)
                        attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock2.id)
                        done()
                    }, keepAliveTTL-10)

                }, keepAliveTTL/2)
                
            })
        }, keepAliveTTL)
    }).timeout(2000)

    it("Should have 1 assistant ON-LINE registered and assigned to a session", (done) => {
        attendantScheduler.start(() => {            
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, (mqttClient) => {    
                const attendantMock = {
                    id: 51,
                    status: status.attendant.connection.online,
                    activeSessions: [],
                    type: attendantTypes.support.firstLevel
                }    
                assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 0)
                mqttClient.publish(topics.server.attendants.online,{ attendantInfo:  attendantMock })

                setTimeout(() => {
                    assert.equal(attendantScheduler.getOrderedOnlineAttendants().length, 1)

                    const sessionInfo = {
                        "sessionTopic": "sessions/test/session51",
                        "customerRequestID": "test51u1",
                        "customer": { 
                            "id": "u1"
                        },
                        "createdAt": new Date().getTime(), 
                        "status": status.session.waitingAttendantsAssignment,
                        "sessionTemplate": {
                            customersAllowed: 1,
                            attendants: [{
                                type: attendantTypes.support.firstLevel,
                                required: true
                            }]            
                        }, 
                        "assignedAttendants": []
                    }

                    // listen for attendant request and check the server status before and after responding
                    mqttClient.subscribe(`${topics.client.attendants.assign}/${attendantMock.id}`, (msg) => {
                        let attendantAssigned = attendantScheduler.db.get(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                        
                        // BEFORE responding
                        let activeSessions = attendantAssigned.activeSessions.filter(s => s.sessionTopic === sessionInfo.sessionTopic)
                        assert.equal(activeSessions.length, 0) // as the attendant has not yet responded, there are no active sessions for it                        
                        
                        // assignment response from client
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
                            
                            attendantScheduler.db.delete(attendantScheduler.dbPrefix  + "/" + attendantMock.id)
                            done()
                            
                        }, 100)
                        
                    })

                    mqttClient.publish(topics.server.attendants.request, sessionInfo)
                    
                }, 50)
                
            })
        })
    })

    
})