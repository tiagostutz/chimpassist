const assert = require('assert')
const mqttProvider = require('../src/lib/mqtt-provider')
const attendatScheduler = require('../src/attendant-scheduler')
const status = require('../src/lib/status')
const topics  = require('../src/lib/topics')

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
})