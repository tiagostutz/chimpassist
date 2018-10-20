const charol = require('charol')
let instructions = {
    close: {
        unavailableAttendants: null
    },
    attendant: {
        assigned: null
    }
}
instructions = charol(instructions)
module.exports = instructions