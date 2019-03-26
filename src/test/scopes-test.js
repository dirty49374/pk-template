// const assert = require('assert')
// const scopes = require('../src/scopes')

// describe('scopes', () => {
//     describe('create()', () => {
//         it('scope should set default values', () => {
//             const scope = scopes.create()

//             assert.deepEqual(scope.objects, {})
//             assert.deepEqual(scope.values, {})
//             assert.deepEqual(scope.uri, '.')
//             assert.deepEqual(scope.parent, null)
//             assert.deepEqual(scope.config, {})
//             assert.deepEqual(scope.userdata, {})
//             assert.equal(typeof scope.$buildLib, 'function')
//         })

//         const
//             a = {},
//             values = { a },
//             uri = 'a',
//             parent = {},
//             config = {},
//             objects = [ {} ],
//             userdata = {}
//         const scope = scopes.create(
//             values, uri, parent, config, objects, userdata)

//         it('values should be deep cloned', () => {
//             assert.deepEqual(scope.values, values)
//             assert.notEqual(scope.values, values)
//             assert.notEqual(scope.values.a, values.a)
//         })
//         it('uri, config, parent, userdata should be equal', () => {
//             assert.equal(scope.uri, uri)
//             assert.equal(scope.parent, parent)
//             assert.equal(scope.config, config)
//             assert.equal(scope.userdata, userdata)
//         })
//         it('object should be copied', () => {
//             assert.equal(scope.objects[0], objects[0])
//             assert.notEqual(scope.objects, objects)
//             assert.deepEqual(scope.objects, objects)
//         })
//     })

//     describe('child()', () => {
//         let s = null
//         const cb = scope => { s = scope; return 1234 }
//         const parent = scopes.create()
//         const objects = []
//         const values = { a: 1 }
//         const result = parent.child({ uri: 'a', objects, values}, cb)

//         it('result should be same as handler() result', () => {
//             assert.equal(result, 1234)
//         })

//         it('uri should be changed', () => {
//             assert.equal(s.uri, 'a')
//         })

//         it('objects should equal to new objects', () => {
//             assert.equal(s.objects, objects)
//         });

//         it('values should be equal', () => {
//             assert.equal(s.values, values)
//         });

//         it('config, parent, userdata should be equal', () => {
//             assert.equal(s.parent, parent)
//             assert.equal(s.config, parent.config)
//             assert.equal(s.userdata, parent.userdata)
//         });
//     });

//     describe('add()', () => {
//         const scope = scopes.create()
//         const obj = {o:1}
//         let childScope;
//         scope.child({}, s => {
//             childScope = s;
//             s.add(obj);
//         });
//         it('should add object in scope', () => {
//             assert.equal(childScope.objects[0], obj)
//         });
//         it('should add object in parent scope', () => {
//             assert.equal(scope.objects[0], obj)
//         });
//     });

//     describe('resolve()', () => {

//         it('default scope uri is .', () => {
//             const scope = scopes.create();
//             assert.equal(scope.uri, '.');
//         });

//         it('default scope uri can be overridden', () => {
//             const scope = scopes.create(null, 'ab/cd');
//             assert.equal(scope.uri, 'ab/cd');
//         });

//         it('can resolve relative path', () => {
//             const s1 = scopes.create(null, 'ab/cd');
//             assert.equal(s1.resolve('aa'), 'ab/aa');
//             assert.equal(s1.resolve('aa/bb'), 'ab/aa/bb');
//             assert.equal(s1.resolve('../aa'), 'aa');
//             assert.equal(s1.resolve('../../aa'), '../aa');
//             assert.equal(s1.resolve('/abcd'), '/abcd');

//             const s2 = scopes.create(null, 'http://a.com/ab/cd');
//             assert.equal(s2.resolve('aa'), 'http://a.com/ab/aa');
//             assert.equal(s2.resolve('aa/bb'), 'http://a.com/ab/aa/bb');
//             assert.equal(s2.resolve('../aa'), 'http://a.com/aa');
//             assert.equal(s2.resolve('../../aa'), 'http://a.com/aa');
//             assert.equal(s2.resolve('/abcd'), 'http://a.com/abcd');
//         });

//         it('can resolve absolute path', () => {
//             const s1 = scopes.create(null, 'ab/cd');
//             assert.equal(s1.resolve('/abcd'), '/abcd');
//             assert.equal(s1.resolve('c:/abcd'), 'c:/abcd');
//             assert.equal(s1.resolve('c:\\abcd'), 'c:/abcd');

//             const s2 = scopes.create(null, 'https://a.com/ab/cd');
//             assert.equal(s2.resolve('https://b.com/abcd'), 'https://b.com/abcd');
//             assert.equal(s2.resolve('/abcd'), 'https://a.com/abcd');
//             assert.equal(s2.resolve('c:/abcd'), 'c:/abcd');
//             assert.equal(s2.resolve('c:\\abcd'), 'c:/abcd');
//         });

//     });
// })
