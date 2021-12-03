import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as iam from '@aws-cdk/aws-iam'
// import * as cr from '@aws-cdk/custom-resources'

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
    console.log('connectInstanceArn:', connectInstanceArn.valueAsString)

    const vanityTable = new dynamodb.Table(this, 'VanityNumber', {
      partitionKey: {
        name: 'phoneNumber',
        type: dynamodb.AttributeType.STRING
      }
    })

    const layer = new lambda.LayerVersion(this, 'AwsSdkV3', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: lambda.Code.fromAsset(`${__dirname}/../resources/lambda-layer/package.zip`),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    })

    const vanityLambda = new lambda.Function(this, 'VanityHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/lambda'),
      handler: 'vanity.handler',
      environment: {
        VANITY_TABLE_NAME: vanityTable.tableName
      },
      layers: [layer]
    })

    // Grant DB access
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

    // Setup CR Handler, it will be invoked by any custom resources defined below
    const customResourceLambda = new lambda.Function(this, 'CustomResourceHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/lambda'),
      handler: 'custom-resource.handler',
      layers: [layer]
    })

    // Grant CR Handler access to Connect Contact Flow
    // TODO: Standardize how IAM is handled, see ServicePrincipal above
    const createContactFlowPolicy = new iam.ManagedPolicy(this, `CreateContactFlowPolicy`, {
      statements: [
        iam.PolicyStatement.fromJson({
          Sid: 'CreateContactFlow',
          Effect: 'Allow',
          Action: ['connect:CreateContactFlow'],
          Resource: [`${connectInstanceArn.valueAsString}`, `${connectInstanceArn.valueAsString}/*`],
        }),
      ],
    })
    customResourceLambda.role?.addManagedPolicy(createContactFlowPolicy)

    // TODO: Figure out if this is necessary to wrap the lambda
    // const provider = cr.Provider({ ... })

    // Process Contact Flow via CR Handler
    const customResource = new cdk.CustomResource(this, 'CreateContactFlow', {
      serviceToken: customResourceLambda.functionArn, // TODO?: provider.serviceToken ... this would wrap the lambda?
      resourceType: 'Custom::LoadLambda',
      properties: {
        customAction: 'CreateContactFlow',
        connectInstanceArn: connectInstanceArn.valueAsString,
        vanityLambdaArn: vanityLambda.functionArn
      }
    })
  }
}
