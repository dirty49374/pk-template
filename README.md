# pk-template
p template engine for kubernetes.
this is proof of concept project for kubernetes yaml templating.

## using yaml files as template

create tmp directory for testing
```base
$ mkdir tmp
$ cd tmp
$
```

yaml is template.
```bash
$ echo "kind: Pod" > pod.yaml
$ pkt pod.yaml
kind: Pod

$
```

with variables
```bash
$ echo "kind: <<<= kind >>>" > pod.yaml
$ pkt --kind Deployment pod.yaml
kind: Deployment

$
```

multiple yaml files
```bash
$ echo -e "metadata:\n  name: <<<= name1 >>>" > pod1.yaml
$ echo -e "metadata:\n  name: <<<= name2 >>>" > pod2.yaml
$ pkt --name1 server1 --name2 server2 pod1.yaml pod2.yaml
metadata:
  name: server1
---
metadata:
  name: server2

$
```

multi-document yaml files
```bash
$ echo -e "metadata:\n  name: <<<= name1 >>>\n---\nmetadata:\n  name: <<<= name2 >>>" > pods.yaml
$ pkt --name1 server1 --name2 server2 pods.yaml
metadata:
  name: server1
---
metadata:
  name: server2

$
```

using spec file
```bash
$ cat > pod.pkt <<EOF
values:
  kind: Pod
steps:
- files: pod.yaml
EOF
$ pkt pod.pkt
kind: Pod

$
```

overriding values
```bash
$ pkt pod.pkt --kind Deployment
kind: Deployment

$
```

using preset
```bash
$ cat > pod.pkt <<EOF
presets:
  v1:
    kind: Pod
  v2:
    kind: Deployment
steps:
- files: pod.yaml
EOF

$ pkt pod.pkt
kind: null

$ pkt pod.pkt -p v1
kind: Pod

$ pkt pod.pkt -p v2
kind: Deployment

$
```

multiple steps
```bash
$ cat > pods.pkt <<EOF
steps:
- files: pod.yaml
- files: pod.yaml
EOF

$ pkt pods.pkt --kind Pod
kind: Pod
---
kind: Pod

$
```

using javascript
```bash
$ cat > pods.pkt <<EOF
steps:
- script.js: |
    expand('pod.yaml', { kind: 'StatefulSet' })
EOF
$ pkt pods.pkt
kind: StatefulSet

$
```

updating yaml using javascript
```bash
$ cat > pods.pkt <<EOF
values:
  namespace: hello
steps:
- files: pod.yaml
- script.js: |
    objects.forEach(o => o.metadata = { namespace: values.namespace });
EOF
$ pkt pods.pkt --kind DaemonSet
kind: DaemonSet
metadata:
  namespace: hello

$ pkt pods.pkt --kind DaemonSet --namespace world
kind: DaemonSet
metadata:
  namespace: world

$
```

using *.pkt spec files in spec file
```bash
$ cat > final.pkt <<EOF
values:
  namespace: hello
steps:
- files: pods.pkt
  values:
    kind: Pod
- files: pods.pkt
  values:
    kind: DaemonSet
- script.js: |
    objects.forEach(o => o.metadata.name = o.kind.toLowerCase());
EOF
$ pkt final.pkt
kind: Pod
metadata:
  namespace: hello
  name: pod
---
kind: DaemonSet
metadata:
  namespace: hello
  name: daemonset

$
```

## real example

create reusable basic deployment yaml
```bash
$ rm *
$ cat > deployment.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <<<= name >>>
  labels:
    app: <<<= name >>>
spec:
  replicas: 3
  selector:
    matchLabels:
      app: <<<= name >>>
  template:
    metadata:
      labels:
        app: <<<= name >>>
    spec:
      containers:
      - name: <<<= name >>>
        image: <<<= image >>>
EOF
$ pkt deployment.yaml --name nginx --image nginx:latest
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
```

create spec script converting container image name to deployment name
```bash
$ cat > deployment.pkt <<EOF
values:
  image: alpine:latest
steps:
- script.js: |
    const image = values.image.split(':')[0]
    const pathes = image.split('/');
    expand('deployment.yaml', { name: values.name || pathes[pathes.length - 1] });
EOF
$ pkt deployment.pkt --image nginx
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx

$
```

create service yaml
```bash
$ cat > service.yaml <<EOF
apiVersion: v1
kind: Service
metadata:
  name: <<<= name >>>
spec:
  ports:
  - protocol: TCP
    port: <<<= port >>>
EOF
$ pkt service.yaml --name nginx --port 80
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
    - protocol: TCP
      port: 80

$
```

create script attaching containerPort and add corresponding service
```bash
$ cat > attach_service.pkt <<EOF
values:
  app: none
  port: 80
steps:
- script.js: |
    const clone = [ ...objects ];
    clone.forEach(o => {
      if (o.kind != 'Deployment') return;
      if (!o.metadata || !o.metadata.labels) return;
      if (o.metadata.labels.app == values.app) {
        expand('service.yaml', { name: values.app });

        const c = o.spec.template.spec.containers[0];
        c.ports = c.ports || [];
        if (!c.ports.some(p => p.containerPort == values.port))
          c.ports.push({ containerPort: values.port });
      }
    });
EOF
$ pkt deployment.pkt --image nginx:latest | pkt -i attach_service.pkt --app nginx
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
          ports:
            - : 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
    - protocol: TCP
      port: 80
```

crate resource limiting script
```bash
$ cat > limit.pkt <<EOF
values:
  name: none
  rmemory: "32Mi"
  rcpu: "10m"
  lmemory: "64Mi"
  lcpu: "20m"
presets:
  web:
    rmemory: "64Mi"
    rcpu: "50m"
    lmemory: "128Mi"
    lcpu: "100m"
  api:
    rmemory: "256Mi"
    rcpu: "100m"
    lmemory: "128Mi"
    lcpu: "200m"
steps:
- script.js: |
    objects.forEach(o => {
      if (o.kind != 'Deployment' || o.metadata.name != values.name) return;
      o.spec.template.spec.containers[0].resources = {
        requests: {
          memory: values.rmemory,
          cpu: values.rcpu,
        },
        limits: {
          memory: values.lmemory,
          cpu: values.lcpu,
        }
      }
    });
EOF

$ pkt deployment.pkt --image nginx:latest | pkt -i attach_service.pkt --app nginx | pkt -i limit.pkt -p web --name nginx
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: 64Mi
              cpu: 50m
            limits:
              memory: 128Mi
              cpu: 100m
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
    - protocol: TCP
      port: 80

$
```

make all in one script
```bash
$ cat > cluster.pkt <<EOF
steps:
- files: deployment.pkt
  values:
    image: nginx:latest
- files: deployment.pkt
  values:
    image: custom/apiserver:latest
- files: attach_service.pkt
  values:
    app: nginx
    port: 443
- files: attach_service.pkt
  values:
    app: apiserver
    port: 80
- files: limit.pkt
  preset: web
  values:
    name: nginx
- files: limit.pkt
  preset: api
  values:
    name: apiserver
EOF
$ pkt cluster.pkt
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: 'nginx:latest'
          ports:
            - containerPort: 443
          resources:
            requests:
              memory: 64Mi
              cpu: 50m
            limits:
              memory: 128Mi
              cpu: 100m
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: apiserver
  labels:
    app: apiserver
spec:
  replicas: 3
  selector:
    matchLabels:
      app: apiserver
  template:
    metadata:
      labels:
        app: apiserver
    spec:
      containers:
        - name: apiserver
          image: 'custom/apiserver:latest'
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: 32Mi
              cpu: 10m
            limits:
              memory: 64Mi
              cpu: 20m
---
apiVersion: v1
kind: Service
metadata:
  name: nginx
spec:
  ports:
    - protocol: TCP
      port: 443
---
apiVersion: v1
kind: Service
metadata:
  name: apiserver
spec:
  ports:
    - protocol: TCP
      port: 80

$
```

