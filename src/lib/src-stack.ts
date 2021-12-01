import * as cdk from '@aws-cdk/core'

// TODO: npm uninstall @aws-cdk/aws-s3
// Just a test, wont be necessary for final project
import * as s3 from '@aws-cdk/aws-s3'
export class SrcStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    new s3.Bucket(this, 'TestBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })
  }
}
