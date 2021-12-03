import { CdkCustomResourceEvent, CdkCustomResourceHandler, CdkCustomResourceResponse, Context } from 'aws-lambda'
import {
  AssociateLambdaFunctionCommand, AssociateLambdaFunctionCommandInput,
  AssociateLambdaFunctionCommandOutput, ConnectClient, ContactFlowType,
  CreateContactFlowCommand, CreateContactFlowCommandInput, CreateContactFlowRequest,
  CreateContactFlowResponse,
  DeleteContactFlowCommand, DeleteContactFlowCommandInput,
  DeleteContactFlowCommandOutput,
  DisassociateLambdaFunctionCommand, DisassociateLambdaFunctionCommandInput, DisassociateLambdaFunctionCommandOutput
} from '@aws-sdk/client-connect'

const client = new ConnectClient({})

import { vanityContactFlow } from './vanity-contact-flow'

// Wrappers

const associateLambda = async (input: AssociateLambdaFunctionCommandInput): Promise<AssociateLambdaFunctionCommandOutput> =>
  client.send(new AssociateLambdaFunctionCommand(input))

const disassociateLambda = async (input: DisassociateLambdaFunctionCommandInput): Promise<DisassociateLambdaFunctionCommandOutput> =>
  client.send(new DisassociateLambdaFunctionCommand(input))

const createFlow = async (input: CreateContactFlowRequest): Promise<CreateContactFlowResponse> =>
  client.send(new CreateContactFlowCommand(input))

const deleteFlow = async (input: DeleteContactFlowCommandInput): Promise<DeleteContactFlowCommandOutput> =>
  client.send(new DeleteContactFlowCommand(input))

// Main Handler

const handler: CdkCustomResourceHandler = async (
  event: CdkCustomResourceEvent,
  context: Context
): Promise<CdkCustomResourceResponse> => {
  // Sanity check
  if (event.ResourceProperties?.customAction !== 'CreateContactFlow')
    return {} // TODO: Return real value for doing nothing?

  if (event.RequestType == 'Create') {
    // TODO: Clean this up

    // Associate the lambda first, then use it in the flow

    const lambdaResult = await associateLambda({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      FunctionArn: event.ResourceProperties?.vanityLambdaArn
    })
    // TODO: Verify lambdaResult

    const flowResult = await createFlow({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      Name: 'Vanity Number Contact Flow',
      Type: ContactFlowType.CONTACT_FLOW,
      Content: JSON.stringify(vanityContactFlow(event.ResourceProperties?.vanityLambdaArn))
    })
    // TODO: Verify flowResult

    return {
      PhysicalResourceId: flowResult.ContactFlowId
    }
  }

  if (event.RequestType == 'Delete') {
    // TODO: More cleanup & verifications

    // Remove flow before disassociating lambda

    const flowResult = await deleteFlow({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      ContactFlowId: event.PhysicalResourceId
    })

    const lambdaResult = await disassociateLambda({
      InstanceId: event.ResourceProperties?.connectInstanceArn,
      FunctionArn: event.ResourceProperties?.vanityLambdaArn
    })
  }

  return {}
}

export { handler }
