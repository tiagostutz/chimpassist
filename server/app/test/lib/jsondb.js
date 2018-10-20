const assert = require('assert')
const JsonDB = require('node-json-db');

describe("Tests JsonDB", () => {
    const db = new JsonDB("database-temp/test", true, false);
    it("should persist simple data", () => {
        db.push("/test1", { "objA": "testA" })
        const obj = db.getData("/test1")
        assert.equal(obj.objA, "testA")
    })
    it("should update simple data", () => {
        db.push("/test2", { "objA": "testA" })
        const obj = db.getData("/test2")
        
        db.push("/test2", { "objA": "testA2" })
        const obj2 = db.getData("/test2")

        assert.equal(obj.objA, "testA")
        assert.equal(obj2.objA, "testA2")
    })
    it("should update NOT merging simple data", () => {
        db.push("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.getData("/test3")
        
        db.push("/test3", { "objA": "testA2" })
        const obj2 = db.getData("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, undefined)
    })

    it("should update AND merge simple data", () => {
        db.push("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.getData("/test3")
        
        db.push("/test3", { "objA": "testA2" }, false)
        const obj2 = db.getData("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, "testB")
    })
})
