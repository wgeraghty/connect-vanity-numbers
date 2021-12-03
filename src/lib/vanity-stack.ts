import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as iam from '@aws-cdk/aws-iam'
import * as cr from '@aws-cdk/custom-resources'
import * as logs from '@aws-cdk/aws-logs'

import { RemovalPolicy } from '@aws-cdk/core'

export class VanityStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // https://bobbyhadz.com/blog/aws-cdk-parameters-example#caveats-when-using-cdk-parameters
    // TODO: Switch to ENV instead of Parameter?
    const connectInstanceArn = new cdk.CfnParameter(this, 'connectInstanceArn', {
      type: 'String',
      description: 'The ARN of the Amazon Connect instance you want to use.'
    })

    const vanityTable = new dynamodb.Table(this, 'VanityNumber', {
      partitionKey: {
        name: 'phoneNumber',
        type: dynamodb.AttributeType.STRING
      }
    })

    // AWS JavaScript SDK V3 is not supported in Lambda by default
    // The package.zip file must be built before deploying, no reason to keep the zip in source control
    // See 'Build Lambda Layer' in README.md
    const layer = new lambda.LayerVersion(this, 'AwsSdkV3', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: lambda.Code.fromAsset(`${__dirname}/../resources/lambda-layer/package.zip`),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    })

    // The lambda called by the Contact Flow
    const vanityLambda = new lambda.Function(this, 'VanityHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/lambda'),
      handler: 'vanity.handler',
      environment: {
        VANITY_TABLE_NAME: vanityTable.tableName
      },
      layers: [layer]
    })
    // Grant the lambda DB access
    vanityTable.grantReadWriteData(vanityLambda)

    // Grant Connect access to Vanity lambda
    const connectServicePrincipal = new iam.ServicePrincipal('connect.amazonaws.com', {
      conditions: {
        ArnEquals: {
          'aws:SourceArn': vanityLambda.functionArn
        }
      }
    })
    vanityLambda.addPermission('ConnectAccess', {
      principal: connectServicePrincipal
    })

    // Setup Custom Resource Handler, it will be invoked by any custom resources defined below
    const customResourceLambda = new lambda.Function(this, 'CustomResourceHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/lambda'),
      handler: 'custom-resource.handler',
      layers: [layer]
    })

    // Grant Custom Resource Handler access to Connect Contact Flow
    // TODO: Standardize how IAM is handled? see ServicePrincipal above
    const createContactFlowPolicy = new iam.ManagedPolicy(this, `CreateContactFlowPolicy`, {
      statements: [
        iam.PolicyStatement.fromJson({
          Sid: 'CreateContactFlow',
          Effect: 'Allow',
          Action: [
            'connect:AssociateLambdaFunction',
            'connect:DisassociateLambdaFunction',
            'connect:CreateContactFlow',
            'connect:DeleteContactFlow'
          ],
          Resource: [connectInstanceArn.valueAsString, `${connectInstanceArn.valueAsString}/*`],
        }),
        // Also required or it will not see the lambda
        // Note: Manually create an IAM role to see what hints it gives for additional necessary permissions
        iam.PolicyStatement.fromJson({
          Sid: 'CreateContactFlowLambda',
          Effect: 'Allow',
          Action: [
            'lambda:AddPermission',
            'lambda:RemovePermission',
          ],
          Resource: [vanityLambda.functionArn],
        })
      ],
    })
    customResourceLambda.role?.addManagedPolicy(createContactFlowPolicy)

    const provider = new cr.Provider(this, 'CustomResourceProvider', {
      onEventHandler: customResourceLambda,
      // logRetention: logs.RetentionDays.ONE_DAY
      // totalTimeout: cdk.Duration.minutes(1) // Requires isCompleteHandler
    })

    // Process Contact Flow via Custom Resource Handler
    const customResource = new cdk.CustomResource(this, 'CreateContactFlow', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::LoadLambda',
      properties: {
        customAction: 'CreateContactFlow',
        connectInstanceArn: connectInstanceArn.valueAsString,
        vanityLambdaArn: vanityLambda.functionArn
      }
    })
  }
}
