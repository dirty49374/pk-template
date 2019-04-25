# pk-template
```pk-template``` is structured yaml template engine for kubernetes manifests.

It consist of two command line tools.

* pkt - structured yaml template engine
* pk - kubernetes deployments tool

## Features

pkt - template engine

* template engine understands yaml structure
* utilize custom yaml tags
* can program using javascript
* can use any npm modules

## Install
```
$ npm install pk-template -g
```

## Example
```yaml
# pod.pkt
apiVersion: v1
kind: Pod
spec:
  containers:
  - image: !js image
```

```bash
$ pkt pod.yaml --image nginx
apiVersion: v1
kind: Pod
spec:
  containers:
    - image: nginx
```

## more info
- [Examples](doc/examples.md)
