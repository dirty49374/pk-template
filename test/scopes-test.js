const assert = require('assert')
const scopes = require('../src/scopes')

describe('scopes', () => {
    describe('create()', () => {
        it('scope should set default values', () => {
            const scope = scopes.create()

            assert.deepEqual(scope.objects, {})
            assert.deepEqual(scope.values, {})
            assert.deepEqual(scope.uri, '.')
            assert.deepEqual(scope.parent, null)
            assert.deepEqual(scope.config, {})
            assert.deepEqual(scope.userdata, {})
            assert.equal(typeof scope.$buildLib, 'function')
        })

        const
            a = {},
            values = { a },
            uri = 'a',
            parent = {},
            config = {},
            objects = [ {} ],
            userdata = {}
        const scope = scopes.create(
            values, uri, parent, config, objects, userdata)

        it('values should be deep cloned', () => {
            assert.deepEqual(scope.values, values)
            assert.notEqual(scope.values, values)
            assert.notEqual(scope.values.a, values.a)
        })
        it('uri, config, parent, userdata should be equal', () => {
            assert.equal(scope.uri, uri)
            assert.equal(scope.parent, parent)
            assert.equal(scope.config, config)
            assert.equal(scope.userdata, userdata)
        })
        it('object should be copied', () => {
            assert.equal(scope.objects[0], objects[0])
            assert.notEqual(scope.objects, objects)
            assert.deepEqual(scope.objects, objects)
        })
    })

    describe('open()', () => {
        let s = null
        const cb = scope => { s = scope; return 1234 }
        const parent = scopes.create()
        const objects = []
        const values = { a: 1 }
        const result = scopes.open(parent, { uri: 'a', objects, values}, cb)

        it('result should be same as handler() result', () => {
            assert.equal(result, 1234)
        })

        it('uri should be changed', () => {
            assert.equal(s.uri, 'a')
        })

        it('objects should equal to new objects', () => {
            assert.equal(s.objects, objects)
        });

        it('values should be equal', () => {
            assert.equal(s.values, values)
        });

        it('config, parent, userdata should be equal', () => {
            assert.equal(s.parent, parent)
            assert.equal(s.config, parent.config)
            assert.equal(s.userdata, parent.userdata)
        });
    });

    describe('add()', () => {
        const scope = scopes.create()
        const obj = {o:1}
        scopes.add(scope, obj)
        it('should add', () => {
            assert.equal(scope.objects[0], obj)
        })
    })
})
