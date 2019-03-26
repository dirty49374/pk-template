// const assert = require('assert')
// const { JavaScriptCode } = require('../src/utils')
// const jslib = require('../src/jslib')
// const scopes = require('../src/scopes')

// const create = () => {
//     const scope = scopes.create({ v: 1 }, __filename);
//     const funcs = jslib(scope);
//     return { scope, funcs };
// };

// describe('jslib', () => {

//     // it('expand() test', () => {
//     //     const { scope, funcs } = create();
//     //     funcs.expand('files/tpl.yaml');
//     //     assert.deepEqual(scope.objects[0], {v: 1});
//     // });

//     it('loadText() test', () => {
//         const { scope, funcs } = create();
//         assert.equal(funcs.loadText('files/a.txt'), 'abcd');
//     });

//     it('loadYaml() test', () => {
//         const { scope, funcs } = create();
//         assert.deepEqual(funcs.loadYaml('files/a.yaml'), { a: 1 });
//     });

//     it('loadYamlAll() test', () => {
//         const { scope, funcs } = create();
//         assert.deepEqual(funcs.loadYamlAll('files/a.yaml'), [{ a: 1 }]);
//     });

//     it('loadPkt() test', () => {
//         const { scope, funcs } = create();
//         const pkt = funcs.loadPkt('files/a.pkt');
//         assert.equal(pkt.assign.var instanceof JavaScriptCode, true);
//     });

//     it('basename() test', () => {
//         const { scope, funcs } = create();
//         assert.equal(funcs.basename('aa/bb.c'), 'bb.c');
//     });

//     it('label() test', () => {
//         const { scope, funcs } = create();
//         assert.equal(funcs.label({}, 'app'), undefined);
//         assert.equal(funcs.label({ metadata: {} }, 'app'), undefined);
//         assert.equal(funcs.label({ metadata: { labels: {} } }, 'app'), undefined);
//         assert.equal(funcs.label({ metadata: { labels: { app: 'a' } } }, 'app'), 'a');

//         scope.object = { metadata: { labels: { app: 'b' } } };
//         assert.equal(funcs.label('app'), 'b');
//     });

//     it('setlabel() test', () => {
//         const { scope, funcs } = create();

//         let obj = {}
//         funcs.setlabel(obj, 'app', 'b')
//         assert.equal(obj.metadata.labels['app'], 'b');

//         scope.object = {};
//         funcs.setlabel('app', 'c');
//         assert.equal(funcs.label('app'), 'c');
//     });


//     it('annotation() test', () => {
//         const { scope, funcs } = create();

//         assert.equal(funcs.annotation({}, 'app'), undefined);
//         assert.equal(funcs.annotation({ metadata: {} }, 'app'), undefined);
//         assert.equal(funcs.annotation({ metadata: { annotations: {} } }, 'app'), undefined);
//         assert.equal(funcs.annotation({ metadata: { annotations: { app: 'a' } } }, 'app'), 'a');

//         scope.object = { metadata: { annotations: { test: 'c' } } };
//         assert.equal(funcs.annotation('test'), 'c');
//     });

//     it('setannotation() test', () => {
//         const { scope, funcs } = create();

//         let obj = {}
//         funcs.setannotation(obj, 'a.io', 'b')
//         assert.equal(obj.metadata.annotations['a.io'], 'b');

//         scope.object = {};
//         funcs.setannotation('test', 'd');
//         assert.equal(funcs.annotation('test'), 'd');
//     });


//     it('setannotation() test', () => {
//         const { scope, funcs } = create();

//         let obj = {}
//         funcs.setannotation(obj, 'a.io', 'b')
//         assert.equal(obj.metadata.annotations['a.io'], 'b');

//         scope.object = {};
//         funcs.setannotation('test', 'd');
//         assert.equal(funcs.annotation('test'), 'd');
//     });

// });
