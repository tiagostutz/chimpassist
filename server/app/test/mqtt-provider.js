const assert = require('assert');

const mqttProvider = require('../src/mqtt-provider')

describe('simple send/receive', () => {
    
    it("should send and receive a message. Simple.", (done) => {

        mqttProvider.init("https://iot.eclipse.org/ws", "", "", "chimpassist/test/server/mqtt", () => {

            mqttProvider.subscribe("simpleTest", (msg) => {
                assert.equal(msg, "HelloWorld!");            
                done();
            })
            mqttProvider.publish("simpleTest", "HelloWorld!")

        })
    })
})