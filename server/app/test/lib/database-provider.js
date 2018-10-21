const assert = require('assert')
const DatabaseProvider = require('../../src/lib/database-provider');

describe("Tests DatabaseProvider", () => {
    const db = new DatabaseProvider("database-temp/test");
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
})
