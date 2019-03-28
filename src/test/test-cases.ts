import * as assert from 'assert';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { load } from 'js-yaml';
import { executePkt } from '../pk-template/pkt';
import { dumpYaml } from '../pk-yaml';

const testCaseRoot = join(__dirname, '../../testcases');
const loadYaml = (category: string, test: string, file: string) => {
    try {
        const src = readFileSync(join(testCaseRoot, category, test, file), 'utf8');
        return load(src);
    } catch (e) {
        return null;
    }
}

describe('pkt testcases', () => {
    const categories = readdirSync(testCaseRoot);
    for (const category of categories) {
        describe(category, () => {
            const tests = readdirSync(join(testCaseRoot, category));
            for (const testName of tests) {
                const spec = loadYaml(category, testName, 'spec.yaml');
                if (spec == null) {
                    continue;
                }
                // if (testName != 'properties') continue;
                describe(testName, () => {
                    for (const testCaseName of Object.keys(spec.expected)) {
                        const expected = spec.expected[testCaseName];
                        it(testCaseName, () => {
                            if (expected === 'throws') {
                                assert.throws(() => {
                                    executePkt([], spec.input, join(testCaseRoot, category, testName, `${testCaseName}.pkt`));
                                });
                            } else {
                                let actual = null;
                                try {
                                    actual = executePkt([], spec.input, join(testCaseRoot, category, testName, `${testCaseName}.pkt`));
                                    assert.deepEqual(actual, expected);
                                } catch (e) {
                                    console.log(dumpYaml({
                                        actual, expected
                                    }))
                                    throw e;
                                }
                            }
                        });
                    }
                });
            }
        });
    };
});

// const testExec = (files, values) => exec([], values || {}, files);

// describe('expand', () => {
//     describe('yaml', () => {
//         it('single yaml file without values', () => {
//             const yaml = testExec(
//                 [ 'testcases/yaml/real.yaml' ],
//                 {}
//             );
//             assert.equal('name: value\n', yaml);
//         });
//         it('single yaml file with single value', () => {
//             const yaml = testExec(
//                 [ 'testcases/yaml/valued.yaml' ],
//                 { value: 1 }
//             );
//             assert.equal('value: 1\n', yaml);
//         });
//         it('single yaml file with three values', () => {
//             const yaml = testExec(
//                 [ 'testcases/yaml/three_values.yaml' ],
//                 { val1: 1, val2: 2, val3: 3 }
//             );
//             assert.equal('val1: 1\nval2: 2\nval3: 3\n', yaml);
//         });
//         it('multiple yaml files with single value', () => {
//             const yaml = testExec(
//                 [
//                     'testcases/yaml/real.yaml',
//                     'testcases/yaml/valued.yaml'
//                 ],
//                 { value: 10 },
//             );
//             assert.equal('name: value\n---\nvalue: 10\n', yaml);
//         });
//     });

//     describe('pkt', () => {
//         it('minimal pkt file with default values', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/minimal.pkt' ]
//             );
//             assert.equal('val1: 123\nval2: abc\nval3: true\n', yaml);
//         });
//         it('dual pkt file with default values', () => {
//             const yaml = testExec(
//                 [
//                     'testcases/pkt/minimal.pkt',
//                     'testcases/pkt/minimal.pkt',
//                 ]
//             );
//             const output= 'val1: 123\nval2: abc\nval3: true\n';
//             assert.equal(`${output}---\n${output}`, yaml);
//         });
//         it('single pkt with overriding input values', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/minimal.pkt' ],
//                 { val1: 777 }
//             );
//             assert.equal('val1: 777\nval2: abc\nval3: true\n', yaml);
//         });
//         it('single pkt with multiple includes', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/multiple_includes.pkt' ],
//                 { val1: 777 }
//             );
//             const single = 'val1: 777\nval2: abc\nval3: true\n';
//             assert.equal(`${single}---\n${single}`, yaml);
//         });
//         it('single pkt with script', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/script.pkt' ],
//             );
//             assert.equal(`val1: 123\n`, yaml);
//         });
//         it('single pkt with script and overriding input', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/script.pkt' ],
//                 { val1: 777 }
//             );
//             assert.equal(`val1: 777\n`, yaml);
//         });
//         it('single spec with script and step overriding values', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/script_with_values.pkt' ],
//                 { val1: 777 }
//             );
//             assert.equal(`val1: 888\n`, yaml);
//         });
//         it('single spec with relative file includes', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/relative_path_include.pkt' ],
//             );
//             assert.equal(`name: value\n`, yaml);
//         });
//     });

//     describe('pkt advanced', () => {
//         it('include_pkt', () => {
//             const yaml = testExec(
//                 [ 'testcases/pkt/include_pkt.pkt' ],
//             );
//             assert.equal('val1: 123\nval2: abc\nval3: true\n', yaml);
//         });
//         it('pkt without preset', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/preset.pkt' ],
//                 ),
//                 'val1: 123\n'
//             );
//         });
//         it('pkt with preset', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/preset.pkt' ],
//                     { preset: 'dev' },
//                 ),
//                 'val1: 100\n'
//             );
//         });
//     });

//     describe('template inside spec', () => {
//         it('can expand template inside spec', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/template.pkt' ],
//                     {},
//                 ),
//                 'hello: world\n'
//             );
//         });

//         it('can expand multiple templates inside spec', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/dual_template.pkt' ],
//                     {},
//                 ),
//                 'hello: world\n---\nworld: hello\n'
//             );
//         });

//         it('template inside spec can expand values', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/template_with_value.pkt' ],
//                 ),
//                 'val1: 10\nval2: 20\nval3: 30\n'
//             );
//         });

//         it('template inside spec can expand values from outside', () => {
//             assert.equal(
//                 testExec(
//                     [ 'testcases/pkt/template_with_value.pkt' ],
//                     { val1: 1, val2: 2, val3: 3 }
//                 ),
//                 'val1: 1\nval2: 2\nval3: 3\n'
//             );
//         });

//     });
// });
