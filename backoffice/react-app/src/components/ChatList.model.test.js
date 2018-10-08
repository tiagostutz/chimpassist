import ChatListModel from './ChatList.model'
import manuh from 'manuh'
import topics from '../topics'
import moment from 'moment'

let model = new ChatListModel()
model.onlineCostumers = [{
    id: "1",
    name: "Leonard",
    lastSeenAt: moment(new Date()).add(-3, 'minutes'),
    lastMessages: []
}]
model.offlineCostumers = [{
    id: "2",
    name: "Mendoza",
    lastSeenAt: moment(new Date()).add(-3, 'days'),
    lastMessages: []
},
{
    id: "3",
    name: "Gabriela",
    lastSeenAt: moment(new Date()).add(-123, 'minutes'),
    lastMessages: []
}]

test('initial state', () => {
    expect(model.onlineCostumers.length).toEqual(1)
    expect(model.offlineCostumers.length).toEqual(2)
})
setTimeout(() => {
    manuh.publish(topics.costumers.offline._path, { costumer: model.onlineCostumers[0] })
}, 10)
test('Online to Offline Costumer', done => {
    //this setTimeout is used because `manuh` invokes the publish asynchronously
    setTimeout(() => {
        try {            
            expect(model.onlineCostumers.length).toEqual(0)
            expect(model.offlineCostumers.length).toEqual(3)
        } catch (error) {            
            done.fail(error)
        }
        done();
    }, 30)
})


setTimeout(() => {
    manuh.publish(topics.costumers.online._path, { costumer: model.offlineCostumers[0] })
}, 100)
setTimeout(() => {
    manuh.publish(topics.costumers.online._path, { costumer: model.offlineCostumers[0] })
}, 110)
setTimeout(() => {
    manuh.publish(topics.costumers.online._path, { costumer: model.offlineCostumers[0] })
}, 120)
test('Offline to Online Costumer', done => {
    setTimeout(() => {
        try {
            //this setTimeout is used because `manuh` invokes the publish asynchronously    
            expect(model.onlineCostumers.length).toEqual(3)
            expect(model.offlineCostumers.length).toEqual(0)        
            done()
        } catch (error) {            
            done.fail(error)
        }

    }, 300 )
})
