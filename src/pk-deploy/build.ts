import { IObject } from "../common";
import * as pkyaml from '../pk-yaml';
import { getChalk } from '../lazy';
import { IPktArgs } from "../pkt/args";
import { IPkDeployment } from ".";
import { PkProjectConf } from "../pk-conf/projectConf";
import { generate } from "../pkt/pkt";
import { sha256, repository, repositoryPath } from "../pk-template/utils";

const objectError = (object: IObject, err: string) => {
    console.log(pkyaml.dumpYaml(object));
    console.error(getChalk().red('ERROR: ' + err));
    process.exit(1);

}

export const buildPkd = async (conf: PkProjectConf, appName: string, envName: string) => {
    const app = conf.getApp(appName);
    if (!app) {
        throw new Error(`app ${appName} not exits`);
    }

    const env = conf.getMergedEnv(appName, envName);
    if (!env) {
        throw new Error(`app ${appName} does not have env ${envName}`);
    }

    env.values.env = envName;
    env.values.namespace = conf.data.namespace
        ? conf.data.namespace.replace(/({\w+})/g, (m, p1, p2) => {
            const key = m.substr(1, m.length - 2);
            if (key == 'project') {
                return conf.data.project.name;
            }
            if (key == 'app') {
                return app.name;
            }
            return env.values[key];
        })
        : `${conf.data.project.name}-${app.name}-${envName}`;
    const deploymentName = `${conf.data.project.name}-${appName}-${envName}`;
    const deploymentId = `${app.id}-${envName}`;
    const deployment = {
        id: deploymentId,
        name: deploymentName,
        created: new Date().toJSON(),
        project: conf.data.project,
        git: {
            repo: repository(),
            path: repositoryPath('./app.pkt'),
        },
        app: {
            name: app.name,
            id: app.id,
        },
        env: env,
    } as any;
    if (app.owner) {
        deployment.app.owner = app.owner;
    }

    const args: IPktArgs = {
        options: {},
        file: `app.pkt`,
        env: env.name,
        values: {
            ...env.values,
            deployment,
        },
    }

    const objects = await generate(args);

    const newList = objects.map(o => o);
    newList.push({
        "apiVersion": "v1",
        kind: "Namespace",
        metadata: {
            name: "pk-deployments",
        },
    });
    for (const o of newList) {
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

    newList.unshift({
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
            name: deploymentName,
            namespace: "pk-deployments",
            annotations: {
                "pkt.io/type": "pk-deployment",
                "pkt.io/pk-deployment-id": deploymentId,
                "pkt.io/pk-deployment-name": deploymentName,
            },
        },
        data: {
            header:
                '\n' +
                '#--------------------------------------------------------\n' +
                '#  DEPLOYMENT SPEC\n' +
                '#--------------------------------------------------------\n' +
                '\n' +
                pkyaml.dumpYaml(deployment) +
                '\n' +
                '#--------------------------------------------------------\n' +
                '\n',
            catalog: catalog,
        },
    });

    const pkd: IPkDeployment = {
        header: deployment,
        objects: newList,
    };

    return pkd;
}
