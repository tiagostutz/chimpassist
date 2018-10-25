const assert = require('assert')
const manuh = require('manuh')
const topics = require('../../src/lib/topics')
const DatabaseProvider = require('../../src/lib/database-provider');

describe("Tests DatabaseProvider", () => {
    const databaseName = "database-temp/test"
    const db = new DatabaseProvider(databaseName);
    it("should persist simple data", () => {
        db.insert("/test1", { "objA": "testA" })
        const obj = db.get("/test1")
        assert.equal(obj.objA, "testA")
    })
    it("should update simple data", () => {
        db.insert("/test2", { "objA": "testA" })
        const obj = db.get("/test2")
        
        db.insert("/test2", { "objA": "testA2" })
        const obj2 = db.get("/test2")

        assert.equal(obj.objA, "testA")
        assert.equal(obj2.objA, "testA2")
    })
    it("should update NOT merging simple data", () => {
        db.insert("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.get("/test3")
        
        db.insert("/test3", { "objA": "testA2" })
        const obj2 = db.get("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, undefined)
    })

    it("should update AND merge simple data", () => {
        db.insert("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.get("/test3")
        
        db.insert("/test3", { "objA": "testA2" }, false)
        const obj2 = db.get("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, "testB")
    })


    it("should update, merge AND expire simple data", (done) => {
        db.insert("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.get("/test3")
        
        db.insert("/test3", { "objA": "testA2" }, false, 200)
        const obj2 = db.get("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, "testB")

        const obj3 = db.get("/test3")
        assert.equal(JSON.stringify(obj2), JSON.stringify(obj3))

        setTimeout(() => {
            const nullObj = db.get("/test3")
            assert.equal(nullObj, null)
            done();
        }, 300)
    })


    it("should update, merge, renew AND expire simple data", (done) => {
        db.insert("/test3", { "objA": "testA", "objB": "testB" })
        const obj = db.get("/test3")
        
        db.insert("/test3", { "objA": "testA2" }, false, 200)
        const obj2 = db.get("/test3")

        assert.equal(obj.objA, "testA")
        assert.equal(obj.objB, "testB")
        assert.equal(obj2.objA, "testA2")
        assert.equal(obj2.objB, "testB")

        const obj3 = db.get("/test3")
        assert.equal(JSON.stringify(obj2), JSON.stringify(obj3))

        // must be expired
        setTimeout(() => {
            const nullObj = db.get("/test3")
            assert.equal(nullObj, null)
            done();
        }, 400)

        // must be renewd
        setTimeout(() => {
            const obj3Alive = db.get("/test3")
            assert.equal(JSON.stringify(obj3Alive), JSON.stringify(obj3))                
        }, 200)

        // renew
        setTimeout(() => {
            const obj3Renew = db.get("/test3")
            assert.equal(JSON.stringify(obj3Renew), JSON.stringify(obj3))

            db.insert("/test3", { "objA": "testA2" }, false, 200) 
        }, 100)
    })

    it("should expire and handle deletion notification", (done) => {
        db.insert("/test4", { "objA": "testA4", "objB": "testB4" }, true, 500)
        const obj = db.get("/test4")
        assert.notEqual(obj, null)
        const stringifiedObj = JSON.stringify(obj)
        manuh.unsubscribe(db.deletionTopicNotification, "test")
        manuh.subscribe(db.deletionTopicNotification, "test", msg => {
            assert.equal(msg.key, "/test4")
            assert.equal(JSON.stringify(msg.value), stringifiedObj)
            assert.equal(db.get("/test4"), null)
            done()
        })
    })
})
