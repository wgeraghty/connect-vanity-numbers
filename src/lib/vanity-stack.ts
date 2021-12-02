import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import { RemovalPolicy } from '@aws-cdk/core'

export class VanityStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const layer = new lambda.LayerVersion(this, 'AwsSdkV3', {
      removalPolicy: RemovalPolicy.RETAIN,
      code: lambda.Code.fromAsset(`${__dirname}/../resources/lambda-layer/package.zip`),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    })

    const vanityTable = new dynamodb.Table(this, 'VanityNumber', {
      partitionKey: {
        name: 'phoneNumber',
        type: dynamodb.AttributeType.STRING
      }
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

    vanityTable.grantReadWriteData(vanityLambda)
  }
}
