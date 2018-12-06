options:
  name: xxx
  tag: xxx tag

values:
  name: hello
  tag: none

presets:
  prod:
    name: prod
    tag: 1.0.0-release
  dev:
    name: dev
    tag: 1.0.0-develop

steps:
- name: create namespace
  files: namespace.yaml
- name: create additional pods
  values:
    tag: aaa
  script: |
    const services = [ 'server1', 'server2' ];
    services.forEach(app => {
      expand('pod.yaml', {
        name: app,
        image: `${app}:${values.tag}`
      });
    });
- name: update namespaces
  script: |
    objects
      .filter(o => !o.metadata.namespace)
      .forEach(o => o.metadata.namespace = values.name);

