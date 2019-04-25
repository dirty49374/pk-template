# Examples

## 1. Hello world
```!js``` tags evalutes string as javascript



```$ cat examples/hello-world.pkt```
```yaml
hello: !js name
```


```$ pkt examples/hello-world.pkt --name world```
```yaml
hello: world
```

## 2. Any javascript can be used



```$ cat examples/hello-world-2.pkt```
```yaml
syntax:
  block: !js |
    'this is string'
  inline: !js "'this is string'"
constants:
  array: !js |
    [1]
  number: !js |
    100
operators:
  add: !js 1 + 2
  concat: !js " name + ' !' "
control:
  conditional: !js " name == 'world' ? 'hello world' : 'who are you ?' "
  if: !js |
    if (name == 'world') { true } else { false }
  switch: !js |
    let result = 0;
    switch (name) {
      case 'world': result = 1; break;
      default: result = 2;
    }
    result;
```


```$ pkt examples/hello-world-2.pkt --name universe```
```yaml
syntax:
  block: this is string
  inline: this is string
constants:
  array:
    - 1
  number: 100
operators:
  add: 3
  concat: universe !
control:
  conditional: who are you ?
  if: false
  switch: 2
```

## 3. Define local variables



```$ cat examples/define-local-variables.pkt```
```yaml
/values: # var name = 'world'
  name: world
---
hello: !js name
---
/assign: # name = 'universe'
  name: universe
---
hello: !js name
---
/values: # array = [ 'john', 'jane' ]
  array:
    - john
    - jane
---
hello: !js array
---
/values: # object = { hello: 'world' }
  object:
    hello: world
---
object: !js object
```


```$ pkt examples/define-local-variables.pkt ```
```yaml
hello: world
---
hello: universe
---
hello:
  - john
  - jane
---
object:
  hello: world
```

## 4. If



```$ cat examples/if.pkt```
```yaml
/if: !js type == 'nginx'
image: nginx-ingress-controller
---
/if: !js type == 'alb'
image: alb-ingress-controller
```


```$ pkt examples/if.pkt --type nginx```
```yaml
image: nginx-ingress-controller
```

## 5. Include



```$ cat examples/include.pkt```
```yaml
kind: Deployment
---
kind: Service
---
/if: !js ingress
/include: include-ingress.pkt
```


```$ cat examples/include-ingress.pkt```
```yaml
kind: Ingress
spec:
  rules:
    host: !js ingress
```


```$ pkt examples/include.pkt --ingress www```
```yaml
kind: Deployment
---
kind: Service
---
kind: Ingress
spec:
  rules:
    host: www
```

## 6. Text templating



```$ cat examples/text-template.pkt```
```yaml
kind: ConfigMap
data:
  config.ini: !template |
    user = '<<<= user >>>'
---
kind: Secret
data:
  pass: !js $.base64encode(pass)
```


```$ pkt examples/text-template.pkt --user admin --pass abcd```
```yaml
kind: ConfigMap
data:
  config.ini: |
    user = 'admin'
---
kind: Secret
data:
  pass: YWJjZA==
```
