const assert = require('assert');
const { expand } = require('../lib');

const expandFiles = (files, values) => expand([], values || {}, files, { verbose: false });

describe('expand', () => {
    describe('yaml', () => {
        it('single yaml file without values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple/real.yaml' ],
                {}
            );
            assert.equal('name: value\n', yaml);
        });
        it('single yaml file with single values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple/valued.yaml' ],
                { value: 1 }
            );
            assert.equal('value: 1\n', yaml);
        });
        it('multiple yaml files with single value', () => {
            const yaml = expandFiles(
                [
                    'testcases/simple/real.yaml',
                    'testcases/simple/valued.yaml'
                ],
                { value: 10 },
            );
            assert.equal('name: value\n---\nvalue: 10\n', yaml);
        });
    });

    describe('spec', () => {
        it('minimal spec with default values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/minimal.pkt' ]
            );
            assert.equal('val1: 123\nval2: abc\nval3: true\n', yaml);
        });
        it('dual spec with default values', () => {
            const yaml = expandFiles(
                [
                    'testcases/simple_spec/minimal.pkt',
                    'testcases/simple_spec/minimal.pkt',
                ]
            );
            const output= 'val1: 123\nval2: abc\nval3: true\n';
            assert.equal(`${output}---\n${output}`, yaml);
        });
        it('single spec with overriding step values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/minimal.pkt' ],
                { val1: 777 }
            );
            assert.equal('val1: 777\nval2: abc\nval3: true\n', yaml);
        });
        it('single spec with multiple steps', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/multiple_steps.pkt' ],
                { val1: 777 }
            );
            const single = 'val1: 777\nval2: abc\nval3: true\n';
            assert.equal(`${single}---\n${single}`, yaml);
        });
        it('single spec with script', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/script.pkt' ],
            );
            assert.equal(`val1: 123\n`, yaml);
        });
        it('single spec with script and overriding values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/script.pkt' ],
                { val1: 777 }
            );
            assert.equal(`val1: 777\n`, yaml);
        });
        it('single spec with script and step overriding values', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/script_with_values.pkt' ],
                { val1: 777 }
            );
            assert.equal(`val1: 888\n`, yaml);
        });
        it('single spec with relative file includes', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/relative_path_include.pkt' ],
            );
            assert.equal(`name: value\n`, yaml);
        });
    });

    describe('spec advanced', () => {
        it('spec in spec', () => {
            const yaml = expandFiles(
                [ 'testcases/simple_spec/spec_in_spec.pkt' ],
            );
            assert.equal('val1: 123\nval2: abc\nval3: true\n', yaml);
        });
        it('spec without preset', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/preset.pkt' ],
                ),
                'val1: 123\n'
            );
        });
        it('spec with preset', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/preset.pkt' ],
                    { preset: 'dev' },
                ),
                'val1: 100\n'
            );
        });
        // it('preset value can be overridden', () => {
        //     assert.equal(
        //         expandFiles(
        //             [ 'testcases/simple_spec/preset.pkt' ],
        //             { val1: 999, preset: 'dev' },
        //         ),
        //         'val1: 999\n'
        //     );
        // });
        it('preset can be set in steps', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/multi_depth_preset.pkt' ],
                ),
                'val1: 100\n'
            );
        });

        // it('preset in steps can be overridden by values', () => {
        //     assert.equal(
        //         expandFiles(
        //             [ 'testcases/simple_spec/multi_depth_preset_with_values.pkt' ],
        //         ),
        //         'val1: 0\n'
        //     );
        // });

        it('preset does not propagate to multiple spec', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/multi_depth_no_preset.pkt' ],
                    {},
                ),
                'val1: 123\n'
            );
        });
    });

    describe('template inside spec', () => {
        it('can expand template inside spec', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/template.pkt' ],
                    {},
                ),
                'hello: world\n'
            );
        });

        it('can expand multiple templates inside spec', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/dual_template.pkt' ],
                    {},
                ),
                'hello: world\n---\nworld: hello\n'
            );
        });

        it('template inside spec can expand values', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/template_with_value.pkt' ],
                ),
                'val1: 10\nval2: 20\nval3: null\n'
            );
        });

        it('template inside spec can expand values from outside', () => {
            assert.equal(
                expandFiles(
                    [ 'testcases/simple_spec/template_with_value.pkt' ],
                    { val1: 1, val2: 2, val3: 3 }
                ),
                'val1: 1\nval2: 2\nval3: 3\n'
            );
        });

    });
});
