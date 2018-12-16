const assert = require('assert')
const selectors = require('../src/selectors')

describe('selectors', () => {
    describe('compile()', () => {
        const o1 = { kind: 'a', metadata: { labels: { l1: 'v1' } } }
        const o2 = { kind: 'a', metadata: { annotations: { a1: 'v1' } } }
        const o3 = { kind: 'b', metadata: { labels: { l1: 'v1' } } }
        const o4 = { kind: 'b', metadata: { annotations: { a1: 'v1' } } }

        const objects = [ o1, o2, o3, o4 ]

        it('kind query', () => {
            const pa = selectors.compile('a')
            assert.deepEqual([o1, o2], objects.filter(pa))

            const pb = selectors.compile('b')
            assert.deepEqual([o3, o4], objects.filter(pb))
        })

        it('label query', () => {
            const l1 = selectors.compile('l1=v1')
            assert.deepEqual([o1, o3], objects.filter(l1))
            
            const ls = selectors.compile('l1=*')
            assert.deepEqual([o1, o3], objects.filter(ls))
        })

        it('annotation query', () => {
            const a1 = selectors.compile('!a1=v1')
            assert.deepEqual([o2, o4], objects.filter(a1))

            const as = selectors.compile('!a1=*')
            assert.deepEqual([o2, o4], objects.filter(as))
        })

        it('compound query', () => {
            const c = selectors.compile('b l1=v1')
            assert.deepEqual([o3], objects.filter(c))
        })
    })
})
