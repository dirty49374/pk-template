# pk-template
p template engine for kubernetes.
this is proof of concept project for kubernetes yaml templating influenced by helm, css, jquery.

## install
```
$ npm install pk-template -g
```

## example
```bash
$ cat > pod.yaml <<EOF
apiVersion: v1
kind: Pod
spec:
  containers:
  - image: <<<= image >>>
EOF

$ pkt pod.yaml --image nginx
apiVersion: v1
kind: Pod
spec:
  containers:
    - image: nginx
```

```bash
$ cat > sample.pkt <<EOF
input:
  namespace: test
routine:
- assign:
    image: nginx
- include: pod.yaml
- assign:
    image: apache
- include: pod.yaml
- script: |
    for obj in $.objects
      obj.metadata =
        name: obj.spec.containers[0].image.split(':')[0].split('/')[*-1*]
        namespace: namespace
EOF
$ pkt sample.pkt --namespace pkt
apiVersion: v1
kind: Pod
spec:
  containers:
    - image: nginx
metadata:
  name: nginx
  namespace: pkt
---
apiVersion: v1
kind: Pod
spec:
  containers:
    - image: apache
metadata:
  name: apache
  namespace: pkt

```

## more info
- [QuickStarts](quickstarts/QuickStarts.md)

