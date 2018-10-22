import ChatListModel from './ChatList.model'
import manuh from 'manuh'
import topics from '../topics'
import moment from 'moment'

let model = {}
model.onlineCustomers = [{
    id: "1",
    name: "Leonard",
    lastSeenAt: moment(new Date()).add(-3, 'minutes'),
    lastMessages: []
}]
model.offlineCustomers = [{
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
    expect(model.onlineCustomers.length).toEqual(1)
    expect(model.offlineCustomers.length).toEqual(2)
})
// setTimeout(() => {
//     manuh.publish(topics.customers.offline, { costumer: model.onlineCustomers[0] })
// }, 10)
// test('Online to Offline Costumer', done => {
//     //this setTimeout is used because `manuh` invokes the publish asynchronously
//     setTimeout(() => {
//         try {            
//             expect(model.onlineCustomers.length).toEqual(0)
//             expect(model.offlineCustomers.length).toEqual(3)
//         } catch (error) {            
//             done.fail(error)
//         }
//         done();
//     }, 30)
// })


// setTimeout(() => {
//     manuh.publish(topics.customers.online, { costumer: model.offlineCustomers[0] })
// }, 100)
// setTimeout(() => {
//     manuh.publish(topics.customers.online, { costumer: model.offlineCustomers[0] })
// }, 110)
// setTimeout(() => {
//     manuh.publish(topics.customers.online, { costumer: model.offlineCustomers[0] })
// }, 120)
// test('Offline to Online Costumer', done => {
//     setTimeout(() => {
//         try {
//             //this setTimeout is used because `manuh` invokes the publish asynchronously    
//             expect(model.onlineCustomers.length).toEqual(3)
//             expect(model.offlineCustomers.length).toEqual(0)        
//             done()
//         } catch (error) {            
//             done.fail(error)
//         }

//     }, 300 )
// })
