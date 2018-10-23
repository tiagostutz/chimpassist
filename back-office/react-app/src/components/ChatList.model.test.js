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
//     manuh.publish(topics.customers.offline, { customer: model.onlineCustomers[0] })
// }, 10)
// test('Online to Offline Customer', done => {
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
//     manuh.publish(topics.customers.online, { customer: model.offlineCustomers[0] })
// }, 100)
// setTimeout(() => {
//     manuh.publish(topics.customers.online, { customer: model.offlineCustomers[0] })
// }, 110)
// setTimeout(() => {
//     manuh.publish(topics.customers.online, { customer: model.offlineCustomers[0] })
// }, 120)
// test('Offline to Online Customer', done => {
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




// {
//     "sessionTopic": "server/sessions/request/1234/3211",
//     "sessionId": "3211",
//     "customer": { "id": "1234", 

// "name": "Mary Lorem",
//         "avatarURL":"http://cdn.mhpbooks.com/uploads/2014/03/test_ttp_big.jpg",
//         "lastMessages": [{
//             "content": "Alice asked, handing her hand and drank some poetry repeated thoughtfully",
//             "dateTime": 1540051161217,
//             "from": {
//                 "id": "1234",
//                 "name": "Mary Lorem"
//             }
//         }],
//         "isOnline": true,
//         "lastSeenAt": 1540051161217
// },
//     "requestID": "000-111-222"
// }