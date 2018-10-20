const assert = require('assert');

const mqttProvider = require('../../src/lib/mqtt-provider')

describe('simple send/receive', () => {
    
    it("should send and receive a message. Simple.", (done) => {

        mqttProvider.init(process.env.MQTT_BROKER_HOST || "https://iot.eclipse.org/ws", "", "", "chimpassist/test/server/mqtt", () => {
            
            mqttProvider.subscribe("simpleTest", (msg) => {
                assert.equal(msg.text, "HelloWorld!");            
                done();
            })
            setTimeout(() => {
                mqttProvider.publish("simpleTest", { text: "HelloWorld!" })
            }, 30)
        })
    }).timeout(5000)
})