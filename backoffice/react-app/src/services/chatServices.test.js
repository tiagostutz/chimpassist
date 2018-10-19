import chatServices from './chatServices'

test('initial state', done => {    
    chatServices.subscribeToChannel("test-1", (msg) => {
        console.log('msg:::', msg);                
    })
    const intervalHandler = setInterval(() => {
        if(chatServices.isReady()) {
            clearInterval(intervalHandler);
            chatServices.sendMessage("test-1", "hello-test")
            setTimeout(() => {
                done();
            }, 2000)
        }
    }, 200)
})