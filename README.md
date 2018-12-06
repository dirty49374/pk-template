# pkt - p kubernetes template

# usage


## Without .spec file

yaml is template.
```bash

$ echo "kind: Pod" > pod.yaml
$ pkt *.yaml
kind: Pod
$
```

with variables
```bash
$ echo "kind: {{ kind }}" > pod.yaml
$ pkt --kind Deployment *.yaml
kind: Deployment
$
```

multiple yaml files
```bash
$ echo "metadata:\n  name: {{ name1 }}" > pod1.yaml
$ echo "metadata:\n  name: {{ name2 }}" > pod2.yaml
$ pkt --name1 server1 --name2 server2 *.yaml
metadata:
  name: server1
---
metadata:
  name: server2
$
```

multi-document yaml files
```bash
$ echo "metadata:\n  name: {{ name1 }}\n---\nmetadata:\n  name: {{ name2 }}" > pods.yaml
$ pkt --name1 server1 --name2 server2 *.yaml
metadata:
  name: server1
---
metadata:
  name: server2
$
```
