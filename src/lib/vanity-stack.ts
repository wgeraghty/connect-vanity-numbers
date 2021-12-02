import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
// import * as connect from '@aws-cdk/aws-connect'
import * as iam from '@aws-cdk/aws-iam'

import { RemovalPolicy } from '@aws-cdk/core'

export class VanityStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const connectInstanceArn = new cdk.CfnParameter(this, "connectInstanceArn", {
      type: "String",
      description: "The ARN of the Amazon Connect instance you want to use."
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
        VANITY_TABLE_NAME: vanityTable.tableName,
        CONNECT_INSTANCE_ARN: connectInstanceArn.valueAsString
      },
      layers: [layer]
    })

    vanityTable.grantReadWriteData(vanityLambda)

    // https://github.com/amazon-connect/amazon-connect-snippets/blob/master/javascript/programmatically-create-task-example/lib/amazon_connect_tasks_cloud_formation_template-stack.ts
    // https://github.com/amazon-connect/amazon-connect-snippets/blob/master/javascript/programmatically-create-task-example/src/lambdaFunctions/SolutionHelperHandler.js

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

    // const customResource = new cdk.CustomResource(this, "CreateContactFlows", {
    //   serviceToken: vanityLambda.functionArn,
    //   resourceType: "Custom::LoadLambda",
    //   properties: {
    //     CustomAction: "CreateContactFlows",
    //     // SendEmailFunctionArn: sendEmailLambda.functionArn
    //   }
    // })

    // https://github.com/amazon-connect/amazon-connect-snippets/blob/master/javascript/programmatically-create-task-example/lib/amazon_connect_tasks_cloud_formation_template-stack.ts
    // const customResource = new cdk.CustomResource(this, "CreateContactFlows", {
    //   serviceToken: solutionHelperLambda.functionArn,
    //   resourceType: "Custom::LoadLambda",
    //   properties: {
    //     CustomAction: "CreateContactFlows",
    //     SendEmailFunctionArn: sendEmailLambda.functionArn
    //   }
    // })
  }
}
