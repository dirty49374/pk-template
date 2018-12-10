# QUICKSTARTS

yaml is template
```bash
$ cat 00-hello-yaml.yaml
hello: yaml
$ pkt 00-hello-yaml.yaml
hello: yaml

```

value interpolation
```bash
$ cat 01-interpolation.yaml
hello: <<<= name >>>
$ pkt 01-interpolation.yaml --name world
hello: world

```

`$.values` contains all defined values
```bash
$ cat 02-interpolation.yaml
<<<= $.values.greet || 'hello' >>>: <<<= name >>>
$ pkt 02-interpolation.yaml --name world
hello: world

$ pkt 02-interpolation.yaml --name world --greet hi
hi: world

```

make template command
```bash
$ cat 03-command.yaml
#!/usr/bin/env pkt
<<<= $.values.greet || 'hello' >>>: <<<= name >>>
$ chmod a+x 03-command.yaml
$ ./03-command.yaml --name world
hello: world

```

.pkt file
```bash
$ cat 04-pkt.pkt
assign:
  greet: hi
  name: pkt

routine:
- template: |
    <<<= $.values.greet || 'hello' >>>: <<<= name >>>
$ pkt 04-pkt.pkt
hi: pkt

$ pkt 04-pkt.pkt --greet hi --name world
hi: pkt

```

define input in .pkt file
```bash
$ cat 05-define-input.pkt
input: # assign --> input
  greet: hi
  name: pkt

routine:
- template: |
    <<<= $.values.greet || 'hello' >>>: <<<= name >>>
$ pkt 05-define-input.pkt
hi: pkt

$ pkt 05-define-input.pkt --greet hello --name world
hello: world

```

assign values
```bash
$ cat 06-assign-values.pkt
input:
  name: pkt

assign:
  greet: welcome

routine:
- template: |
    <<<= greet >>>: <<<= name >>>
$ pkt 06-assign-values.pkt --name world
welcome: world

```

calculate values (using coffee script)
```bash
$ cat 07-value-calculation.pkt
input:
  name: world

assign:
  greet: welcome
  name$: name.toUpperCase()

routine:
- template: |
    <<<= greet >>>: <<<= name >>>
$ pkt 07-value-calculation.pkt
welcome: WORLD

$ pkt 07-value-calculation.pkt --name uppercase
welcome: UPPERCASE

```

include yaml files
```bash
$ cat 08-include.pkt
input:
  greet: hello

routine:
- assign:
    name: john
- include: 02-interpolation.yaml
- assign:
    name: jane
- include: 02-interpolation.yaml
$ pkt 08-include.pkt
hello: john
---
hello: jane

```

using if
```bash
$ cat 09-if.pkt
input:
  world: 1

routine:
- if: world == 1
  template: |
    hello: world1
- if: world == 2
  template: |
    hello: world2

$ pkt 09-if.pkt
hello: world1

$ pkt 09-if.pkt --world 2
hello: world2

```

using subroutine
```bash
$ cat 10-subroutine.pkt
routine:
- assign:
    name: world
- template: |
    hello: <<<= name >>>
- routine:
  - assign:
      name: universe     # name = 'universe' only inside current scope
  - template: |
      hello1: <<<= name >>>
- template: |
    hello: <<<= name >>>
$ pkt 10-subroutine.pkt
hello: world
---
hello1: universe
---
hello: world

```

using coffee script (`$.object` contains every objects built in current scope)
```bash
$ cat 11-default-is-coffeescript.pkt
routine:
- include: 00-hello-yaml.yaml
- include: 00-hello-yaml.yaml
- script: |
    o.hello = "#{o.hello}-#{i}" for o, i in $.objects

$ pkt 11-default-is-coffeescript.pkt
hello: yaml-0
---
hello: yaml-1

```

you can use javascript too
```bash
$ cat 12-javascript.pkt
routine:
- include: 00-hello-yaml.yaml
- include: 00-hello-yaml.yaml
- script: |
    js> $.objects.forEach((o, i) => o.hello = `${o.hello}-${i}`)
$ pkt 12-javascript.pkt
hello: yaml-0
---
hello: yaml-1

```

you can send objects in current scope to another pkt
```bash
$ cat 13-include-with.pkt
routine:
- include: 00-hello-yaml.yaml
- include: 00-hello-yaml.yaml
- includeWith: 12-javascript.pkt  # includeWith send current objects too
$ pkt 13-include-with.pkt
hello: yaml-0
---
hello: yaml-1
---
hello: yaml-2
---
hello: yaml-3

```
