import chatServices from './chatServices'

test('chatService initial state', done => {    
    let messageCount = 0
    chatServices.subscribeToChannel("test-1", (msg) => {
        messageCount++
        
        if (msg === "hello-test-2") {
            try {
                expect(messageCount).toEqual(2)
                done()
            } catch (error) {            
                done.fail(error)
            }
        }
    })
    const intervalHandler = setInterval(() => {
        if(chatServices.isReady()) {
            clearInterval(intervalHandler);
            chatServices.publishMessage("test-1", "hello-test-1")
            setTimeout(() => {
                chatServices.publishMessage("test-1", "hello-test-2")
            }, 1000)
        }
    }, 200)
})