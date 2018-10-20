const assert = require('assert')
const attendatScheduler = require('../src/attendant-scheduler')

describe("Attendant Scheduler simple scenarios", () => {
    it("Should return empty array of attendants on a recently initiated scheduler", () => {
        attendatScheduler.start(() => {
            assert.equal(attendatScheduler.getOrderedOnlineAttendants().length, 0)
        })
    })
})