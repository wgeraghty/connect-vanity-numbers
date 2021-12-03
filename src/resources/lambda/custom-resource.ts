import { CdkCustomResourceEvent, CdkCustomResourceHandler, CdkCustomResourceResponse, Context } from 'aws-lambda'
import {
  AssociateLambdaFunctionCommand, AssociateLambdaFunctionCommandInput, AssociateLambdaFunctionCommandOutput,
  ConnectClient, ContactFlowType,
  CreateContactFlowCommand, CreateContactFlowCommandInput, CreateContactFlowModuleCommandOutput,
  DeleteContactFlowCommand, DeleteContactFlowCommandInput, DeleteContactFlowCommandOutput,
  DisassociateLambdaFunctionCommand, DisassociateLambdaFunctionCommandInput, DisassociateLambdaFunctionCommandOutput
} from '@aws-sdk/client-connect'

const client = new ConnectClient({})

import { vanityContactFlow } from './vanity-contact-flow'

// Wrappers

const associateLambda = async (input: AssociateLambdaFunctionCommandInput): Promise<AssociateLambdaFunctionCommandOutput> =>
  await client.send(new AssociateLambdaFunctionCommand(input))

const disassociateLambda = async (input: DisassociateLambdaFunctionCommandInput): Promise<DisassociateLambdaFunctionCommandOutput> =>
  await client.send(new DisassociateLambdaFunctionCommand(input))

const createFlow = async (input: CreateContactFlowCommandInput): Promise<CreateContactFlowModuleCommandOutput> =>
  await client.send(new CreateContactFlowCommand(input))

const deleteFlow = async (input: DeleteContactFlowCommandInput): Promise<DeleteContactFlowCommandOutput> =>
  await client.send(new DeleteContactFlowCommand(input))

// Main Handler

const handler: CdkCustomResourceHandler = async (
  event: CdkCustomResourceEvent,
  context: Context
): Promise<CdkCustomResourceResponse> => {

  console.log(event)

  // Sanity check
  if (event.ResourceProperties?.customAction !== 'CreateContactFlow') {
    console.log('doing nothing')
    return {} // TODO: Return real value for doing nothing?
  }

  // Contact Flow calls just use the Id, not the full ARN
  // Associate/Disassociate Lambda still use the full ARN
  const connectInstanceId = event.ResourceProperties?.connectInstanceArn.split("/")[1]

  if (event.RequestType == 'Create') {
    // TODO: Clean this up

    // Associate the lambda first, then use it in the flow

    console.log('Associating Lambda')
    const lambdaResult = await associateLambda({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      FunctionArn: event.ResourceProperties?.vanityLambdaArn
    })
    // TODO: Verify lambdaResult
    console.log(lambdaResult)

    console.log('Creating Contact Flow')

    const content = JSON
      .stringify(vanityContactFlow(event.ResourceProperties?.vanityLambdaArn))
      //.replace(/"/g, '\\"') // Needs escaped quotes?
    console.log(content)

    const flowResult = await createFlow({
      InstanceId: connectInstanceId,
      Name: 'Vanity Number Contact Flow',
      Type: ContactFlowType.CONTACT_FLOW,
      Content: content
    })
    // TODO: Verify flowResult
    console.log(flowResult)

    console.log('Returning')
    return {
      PhysicalResourceId: flowResult.Id
    }
  }

  if (event.RequestType == 'Delete') {
    // TODO: More cleanup & verifications

    // Remove flow before disassociating lambda
    // WARNING: Does not seem to be implemented by AWS
    // console.log('Deleting Contact Flow')
    // const flowResult = await deleteFlow({
    //   InstanceId: connectInstanceId,
    //   ContactFlowId: event.PhysicalResourceId
    // })

    console.log('Disassociating Contact Flow')
    const lambdaResult = await disassociateLambda({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      FunctionArn: event.ResourceProperties?.vanityLambdaArn
    })
  }

  console.log('returning')
  return {}
}

export { handler }
