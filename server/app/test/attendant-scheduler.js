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
})