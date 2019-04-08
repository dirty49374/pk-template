import { IObject } from "../common";
import * as pkyaml from '../pk-yaml';
import { getChalk } from '../lazy';
import { IPktArgs } from "../pkt/args";
import { IPkDeployment, IPkDeploymentHeader } from ".";
import { PkProjectConf } from "../pk-conf/projectConf";
import { generate } from "../pkt/pkt";
import { sha256, repository, repositoryPath } from "../pk-template/utils";
import { IPkApp } from "../pk-conf";

const objectError = (object: IObject, err: string) => {
  console.log(pkyaml.dumpYaml(object));
  console.error(getChalk().red('ERROR: ' + err));
  process.exit(1);
}

const buildCatalog = (buildInfo: IPkDeploymentHeader, objects: IObject[]) => {

  const catalog = objects
    .map(o => {
      const kind = o.kind;
      const avs = o.apiVersion.split('/');
      const apiGroup = avs.length == 2 ? avs[0] : '';
      const namespace = o.metadata.namespace || '';
      const name = o.metadata.name;
      const sha = (o.metadata.annotations && o.metadata.annotations['pk.io/sha']) || sha256(o, 8);

      return `${kind}/${apiGroup}/${name}/${namespace}/${sha}`;
    })
    .join('\n');

  return {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: buildInfo.name,
      namespace: "pk-deployments",
      annotations: {
        "pkt.io/type": "pk-deployment",
        "pkt.io/pk-deployment-id": buildInfo.id,
        "pkt.io/pk-deployment-name": buildInfo.name,
      },
    },
    data: {
      header:
        '\n' +
        '#--------------------------------------------------------\n' +
        '#  DEPLOYMENT SPEC\n' +
        '#--------------------------------------------------------\n' +
        '\n' +
        pkyaml.dumpYaml(buildInfo) +
        '\n' +
        '#--------------------------------------------------------\n' +
        '\n',
      catalog: catalog,
    },
  };
}

const expandNamespaceSpec = (namespaceSpec: string, conf: PkProjectConf, app: IPkApp, envName: string, clusterName: string) => {
  return namespaceSpec.replace(/({\w+})/g, (m, p1, p2) => {
    const key = m.substr(1, m.length - 2);
    if (key == 'project') {
      return conf.data.project.name;
    }
    if (key == 'app') {
      return app.name;
    }
    if (key == 'env') {
      return envName;
    }
    if (key == 'cluster') {
      return clusterName;
    }
    throw new Error(`unknown key from namespace {${key}}`);
  });
}

const validateObjects = (objects: IObject[]) => {
  for (const o of objects) {
    if (!o.metadata) {
      objectError(o, 'object does not have metadata');
    }
    if (!o.kind) {
      objectError(o, 'object does not have kind');
    }
    if (!o.apiVersion) {
      objectError(o, 'object does not have apiVersion');
    }
    if (!o.metadata.name) {
      objectError(o, 'object does not have name');
    }
  }
}

const makeBuildSpec = (conf: PkProjectConf, app: IPkApp, envName: string, clusterName: string) => {

  const namespaceSpec = app.namespace || conf.data.namespace || '{project}-{app}-{env}';
  const namespace = expandNamespaceSpec(namespaceSpec, conf, app, envName, clusterName);

  const deploymentName = `${conf.data.project.name}-${app.name}-${envName}-${clusterName}`;
  const deploymentId = `${app.id}-${envName}-${clusterName}`;
  const buildSpec = {
    id: deploymentId,
    name: deploymentName,
    created: new Date().toJSON(),
    project: conf.data.project,
    cluster: clusterName,
    namespace,
    git: {
      repo: repository(),
      path: repositoryPath('./app.pkt'),
    },
    app: {
      name: app.name,
      id: app.id,
    },
    env: envName,
  } as IPkDeploymentHeader;

  if (app.owner) {
    buildSpec.app.owner = app.owner;
  }

  return buildSpec;
}

export const buildPkd = async (conf: PkProjectConf, appName: string, envName: string, clusterName: string) => {
  const app = conf.getApp(appName);
  if (!app) {
    throw new Error(`app ${appName} not exits`);
  }

  const env = conf.getMergedEnv(appName, envName, clusterName);
  if (!env) {
    throw new Error(`app ${appName} does not have env ${envName}`);
  }

  const buildSpec = makeBuildSpec(conf, app, envName, clusterName);

  let objects = await generate({
    options: {},
    file: `app.pkt`,
    env: env.name,
    values: {
      // ...env.values,
      namespace: buildSpec.namespace,
      env: env.name,
      cluster: clusterName,
      deployment: buildSpec,
    },
  });

  objects = objects.map(o => o);
  validateObjects(objects);

  const catalogObject = buildCatalog(buildSpec, objects);
  objects.push(catalogObject);

  const pkd: IPkDeployment = {
    header: buildSpec,
    objects,
  };

  return pkd;
}
