const assert = require('assert');
const mqttProvider = require('../src/mqtt-provider')

const channelCoordinator = require('../src/channel-coordinator')
const topics = require('../src/topics')

describe('simple scenario', () => {
    
    it("should return empty array on getOnlineChannels.", (done) => {

        channelCoordinator.start(() => {
            assert.equal(channelCoordinator.getOnlineChannels().length, 0); 
            done();   
        })

    })

    it("should return array with 1 channel on getOnlineChannels.", (done) => {

        channelCoordinator.start(() => {
            mqttProvider.init(process.env.MQTT_BROKER_HOST, process.env.MQTT_USERNAME, process.env.MQTT_PASSWORD, process.env.MQTT_BASE_TOPIC, () => {    
                
                const user123ResponseTopic = "users/user123/channel/request"
                mqttProvider.subscribe(user123ResponseTopic, (_) => {
                    assert.equal(channelCoordinator.getOnlineChannels().length, 1); 
                    done();   
                })
                mqttProvider.publish(topics.server.channels.request, {
                    "userRequesting": "user123",
                    "responseTopic": user123ResponseTopic
                  })
            })
        })

    }).timeout(5000)
})
