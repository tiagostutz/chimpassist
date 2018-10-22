const assert = require('assert');
const mqttProvider = require('simple-mqtt-client')


describe('simple send/receive', () => {
    
    it("should send and receive a message. Simple.", (done) => {
        mqttProvider.init(process.env.MQTT_BROKER_HOST || "https://iot.eclipse.org/ws", "", "", "chimpassist/test/server/mqtt", (mqttClient) => {
            
            mqttClient.subscribe("simpleTest", (msg) => {
                assert.equal(msg.text, "HelloWorld!");            
                done();
            })
            setTimeout(() => {
                mqttClient.publish("simpleTest", { text: "HelloWorld!" })
            }, 30)
        });
    }).timeout(5000)
})