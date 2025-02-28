import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as sd from '@aws-cdk/aws-servicediscovery'

import * as base from './ecs-base-stack';
import { AppContext } from '../../lib/template/app-context';
import { Override } from '../../lib/template/stack/base/base-stack';


export class EcsCommonServiceStack extends base.EcsBaseStack {

    constructor(appContext: AppContext, stackConfig: any) {
        super(appContext, stackConfig);
    }

    @Override
    onEcsPostConstructor(vpc: ec2.IVpc, cluster: ecs.ICluster, ns: sd.IPrivateDnsNamespace): void {
        this.createEcsServiceTask(cluster, 256, 512);
    }

    private createEcsServiceTask(cluster: ecs.ICluster, cpu: number, memory: number): ecs.FargateService {
        const baseName = this.stackName;
        const targetServiceStackName = this.stackConfig.TargetStack;

        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
            cpu: cpu,
            memoryLimitMiB: memory,
        });

        const container = taskDefinition.addContainer("Container", {
            containerName: `${baseName}Container`,
            image: ecs.ContainerImage.fromAsset(this.stackConfig.AppPath),
            logging: new ecs.AwsLogDriver({
                streamPrefix: `${baseName}Log`
            }),
            environment: {
                Namespace: `${this.projectPrefix}-NS`,
                TargetServiceName: targetServiceStackName,
                AlbDnsName: this.getParameter(`${targetServiceStackName}AlbDnsName`)
            }
        });

        const service = new ecs.FargateService(this, 'Service', {
            serviceName: `${baseName}Service`,
            cluster,
            taskDefinition,
            desiredCount: this.stackConfig.DesiredTasks,
            cloudMapOptions: {
                name: this.stackName,
            }
        });

        const serviceSecurityGroup = service.connections.securityGroups[0];
        const targetSecurityGroupId = this.getParameter(`${targetServiceStackName}ServiceSecurityGroupId`)
        const targetSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'target-security-group', targetSecurityGroupId);
        targetSecurityGroup.addIngressRule(serviceSecurityGroup, ec2.Port.tcp(parseInt(this.getVariable(`${this.stackConfig.TargetStack}`))));

        return service;
    }
}
