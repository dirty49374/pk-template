import { IObject } from "../common";
import * as pkyaml from '../pk-yaml';
import { getChalk } from '../lazy';
import { IPktArgs } from "../pkt/args";
import { IPkDeployment } from ".";
import { PkConf } from "../pk-conf/conf";
import { generate } from "../pkt/pkt";

const objectError = (object: IObject, err: string) => {
    console.log(pkyaml.dumpYaml(object));
    console.error(getChalk().red('ERROR: ' + err));
    process.exit(1);

}

export const buildPkd = async (conf: PkConf, appName: string, envName: string) => {
    const app = conf.getApp(appName);
    if (!app) {
        throw new Error(`app ${appName} not exits`);
    }

    const env = conf.getMergedEnv(appName, envName);
    if (!env) {
        throw new Error(`app ${appName} does not have env ${envName}`);
    }

    env.values.namespace = `${conf.project.name}-${app.name}-${envName}`;

    const deploymentName = `${conf.project.name}-${appName}-${envName}`;
    const deploymentId = `${app.id}-${envName}`;

    const args: IPktArgs = {
        options: {},
        files: [`app.pkt`],
        env: env.name,
        values: env.values,
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

            return `${kind}/${apiGroup}/${name}/${namespace}`;
        })
        .join('\n');

    const header = {
        id: deploymentId,
        name: deploymentName,
        created: new Date().toJSON(),
        project: conf.project,
        app: {
            name: app.name,
            id: app.id,
        },
        env: env,
    };

    newList.unshift({
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
            name: deploymentName,
            namespace: "pk-deployments",
            annotations: {
                "pkt.io/type": "deployment",
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
                pkyaml.dumpYaml(header) +
                '\n' +
                '#--------------------------------------------------------\n' +
                '\n',
            catalog: catalog,
        },
    });

    const pkd: IPkDeployment = {
        header: header,
        objects: newList,
    };

    return pkd;
}
