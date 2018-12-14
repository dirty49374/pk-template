# QUICKSTARTS

## download quickstart examples
```base
$ git clone https://github.com/dirty49374/pk-template.git
$ cd pk-template/quickstarts
```

### yaml is template

```yaml
# 00-hello-yaml.yaml
hello: yaml
```
```yaml
$ pkt 00-hello-yaml.yaml
hello: yaml

```

### value interpolation
source

```yaml
# 01-interpolation.yaml
hello: <<<= name >>>
```

result
```bash
$ pkt 01-interpolation.yaml --name world
hello: world

```

### `$.values` contains all defined values

source
```yaml
# 02-interpolation.yaml
<<<= $.values.greet || 'hello' >>>: <<<= name >>>
```

result
```bash
$ pkt 02-interpolation.yaml --name world
hello: world

$ pkt 02-interpolation.yaml --name world --greet hi
hi: world

```

### make template command

source
```yaml
# 03-command.yaml
#!/usr/bin/env pkt
<<<= $.values.greet || 'hello' >>>: <<<= name >>>
```

result
```bash
$ chmod a+x 03-command.yaml
$ ./03-command.yaml --name world
hello: world

```

### .pkt file

source
```yaml
# 04-pkt.pkt
assign:
  greet: hi
  name: pkt

routine:
- template: |
    <<<= $.values.greet || 'hello' >>>: <<<= name >>>
```

result
```bash
$ pkt 04-pkt.pkt
hi: pkt

$ pkt 04-pkt.pkt --greet hi --name world   # cannot override 'assign'
hi: pkt

```

### define input in .pkt file

source
```yaml
# 05-define-input.pkt
input:
  greet: hi
  name: pkt

routine:
- template: |
    <<<= $.values.greet || 'hello' >>>: <<<= name >>>
```

result
```bash
$ pkt 05-define-input.pkt
hi: pkt

$ pkt 05-define-input.pkt --greet hello --name world   # now values was overridden
hello: world

```

### assign values

source
```yaml
# 06-assign-values.pkt
input:
  name: pkt

assign:
  greet: welcome

routine:
- template: |
    <<<= greet >>>: <<<= name >>>
```
```bash
$ pkt 06-assign-values.pkt --name world
welcome: world

```

### calculate values (using coffee script)

source
```yaml
# 07-value-calculation.pkt
input:
  name: world

assign:
  greet: welcome
  name$: name.toUpperCase()         # name ends with '$' is coffee script

routine:
- template: |
    <<<= greet >>>: <<<= name >>>
```
```bash
$ pkt 07-value-calculation.pkt
welcome: WORLD

$ pkt 07-value-calculation.pkt --name uppercase
welcome: UPPERCASE

```

### include yaml files

source
```yaml
# 08-include.pkt
input:
  greet: hello

routine:
- assign:
    name: john
- include: 02-interpolation.yaml
- assign:
    name: jane      # you can assign same value multiple times.
- include: 02-interpolation.yaml
```

result
```bash
$ pkt 08-include.pkt
hello: john
---
hello: jane

```

### using if

source
```yaml
# 09-if.pkt
input:
  world: 1

routine:
- if: world == 1            # if works too ( it's coffee script )
  template: |
    hello: world1
- if: world == 2
  template: |
    hello: world2

```

result
```bash
$ pkt 09-if.pkt
hello: world1

$ pkt 09-if.pkt --world 2
hello: world2

```

### using subroutine

source
```yaml
# 10-subroutine.pkt
routine:
- assign:
    name: world               # name = 'world'
- template: |
    hello: <<<= name >>>
- routine:                    # routine opens new scope
  - assign:
      name: universe          # name = 'universe'
  - template: |
      hello1: <<<= name >>>
- template: |                 # scope is restored
    hello: <<<= name >>>      # name = 'world'
```

result
```bash
$ pkt 10-subroutine.pkt
hello: world
---
hello1: universe
---
hello: world

```

### pkt can modify objects too

`$.object` contains every objects built in current scope

source
```yaml
# 11-default-is-coffeescript.pkt
routine:
- include: 00-hello-yaml.yaml
- include: 00-hello-yaml.yaml
- script: |
    o.hello = "#{o.hello}-#{i}" for o, i in $.objects   # this is coffee script

```

result
```bash
$ pkt 11-default-is-coffeescript.pkt
hello: yaml-0
---
hello: yaml-1

```

### javascript can be used (prefixed '`js>`')

source
```yaml
# 12-javascript.pkt
routine:
- include: 00-hello-yaml.yaml
- include: 00-hello-yaml.yaml
- script: |
    js> $.objects.forEach((o, i) => o.hello = `${o.hello}-${i}`)
```

result
```bash
$ pkt 12-javascript.pkt
hello: yaml-0
---
hello: yaml-1

```

### you can send objects in current scope to another pkt

source
```yaml
# 13-include-with.pkt
input:
  name: null
  value: null

routine:
- if: name && value
  script: |
    $.setlabel o, name, value for o in $.objects
```

result
```bash
# when -i flag is set, pkt read yamls from stdin
$ pkt 00-hello-yaml.yaml | pkt -i 13-add-label.pkt --name app --value hello
hello: yaml
metadata:
  labels:
    hello: world

```

### very simple deployment

source
```yaml
input:
  name: null
  image: null

routine:
- template: |
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: <<<= name >>>
      labels:
        name: <<<= name >>>
        instance-type: c1
    spec:
      selector:
        matchLabels:
          name: <<<= name >>>
      template:
        metadata:
          labels:
            name: <<<= name >>>
        spec:
          containers:
          - name: <<<= name >>>
            image: <<<= image >>>
```

result
```bash
$ pkt 14-deployment.pkt --name nginx --image nginx:latest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    name: nginx
    instance-type: c1
spec:
  selector:
    matchLabels:
      name: nginx
  template:
    metadata:
      labels:
        name: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
```

### select and each - manuplating objects
source
```yaml
routine:
- select: Deployment instance-type=c1   # matches objects with kind=Deployment and having instance-type=c1 label
  each: |                               # executed each matched object
    $.object.spec.template.spec.containers[0].resources =   # updates resources
      requests:
        memory: "64Mi"
        cpu: "10m"
      limits:
        memory: "128Mi"
        cpu: "20m"

```

result
```bash
$ pkt 14-deployment.pkt --name nginx --image nginx:latest | pkt -i 15-select-and-each.pkt
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    name: nginx
    instance-type: c1
spec:
  selector:
    matchLabels:
      name: nginx
  template:
    metadata:
      labels:
        name: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
          resources:
            requests:
              memory: 64Mi
              cpu: 100m
            limits:
              memory: 128Mi
              cpu: 200m
```

### json schema

source
```yaml
# 16-json-schema.pkt
schema:
  description: create deployment
  properties:
    name:
      type: string
      description: deployment name
    image:
      type: string
      description: container image name

input:
  name: ''
  image: null

assign:
  name$: |
    name if name
    pathes = image.split(':')[0].split('/')
    pathes[pathes.length - 1]

routine:
- template: |
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: <<<= name >>>
      labels:
        name: <<<= name >>>
        instance-type: c1
    spec:
      selector:
        matchLabels:
          name: <<<= name >>>
      template:
        metadata:
          labels:
            name: <<<= name >>>
        spec:
          containers:
          - name: <<<= name >>>
            image: <<<= image >>>

```

result
```bash
$ pkt 16-json-schema.pkt -h
USAGE: pkt [options] ...files

OPTIONS:
   -h           : help
   -i           : load yamls from stdin as initial objects
   --name value : assign name = value

FILES:
- url: quickstarts\16-json-schema.pkt
  description: create deployment
  properties:
    name:
      type: string
      description: deployment name
    image:
      type: string
      description: container image name

$ pkt 16-json-schema.pkt
ERROR: input validation failed in quickstarts/16-json-schema.pkt
       input.image should be string
```

### add

source
```yaml
# 17-add.pkt
routine:
- add:
    kind: Pod
    apiVersion: v1
    metadata:
      name: alpine
      labels:
        name: alpine
    spec:
      containers:
      - name: alpine
        image: alpine
    
```

result
```bash
$ pkt 17-add.pkt
kind: Pod
apiVersion: v1
metadata:
  name: alpine
  labels:
    name: alpine
spec:
  containers:
    - name: alpine
      image: alpine
```

### json patch

source
```yaml
# 18-json-patch.pkt
routine:
- add:
    kind: Pod
    apiVersion: v1
    metadata:
      name: alpine
      labels:
        name: alpine
    spec:
      containers:
      - name: alpine
        image: alpine
- patch:
    op: replace
    path: /spec/containers/0/image
    value: alpine:latest
- patch:
  - op: replace
    path: /metadata/name
    value: alpine
  - op: replace
    path: /metadata/labels/name
    value: !ls $.objects[0].metadata.name
  - op: replace
    path: /spec/containers/0/name
    value: !ls $.objects[0].metadata.name
```

result
```bash
$ pkt 18-json-patch.pkt
kind: Pod
apiVersion: v1
metadata:
  name: alpine
  labels:
    name: alpine
spec:
  containers:
    - name: alpine
      image: 'alpine:latest'
```

### json path

source
```yaml
# 19-json-path.pkt
routine:
- add:
    kind: Pod
    apiVersion: v1
    metadata:
      name: alpine
      labels:
        name: alpine
    spec:
      containers:
      - name: alpine
        image: alpine
      - name: ubuntu
        image: ubuntu
- select: Pod
  jsonpath:
    query: $..containers[?(@.name == 'alpine')].image
    apply: alpine:latest    # apply to image
- select: Pod
  jsonpath:
    query: $..containers[?(@.name == 'ubuntu')]
    exec: !ls |             # execute script with qurey result stored in $.value
      $.value.resources =
        requests:
          memory: "64Mi"
          cpu: "100m"
        limits:
          memory: "128Mi"
          cpu: "200m"
```

result
```bash
kind: Pod
apiVersion: v1
metadata:
  name: alpine
  labels:
    name: alpine
spec:
  containers:
    - name: alpine
      image: 'alpine:latest'  # alpine -> alpine:latest
    - name: ubuntu
      image: ubuntu
      resources:              # added
        requests:
          memory: 64Mi
          cpu: 100m
        limits:
          memory: 128Mi
          cpu: 200m
```
