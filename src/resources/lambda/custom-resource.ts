import { CdkCustomResourceEvent, CdkCustomResourceHandler, CdkCustomResourceResponse, Context } from 'aws-lambda'
import {
  ConnectClient, ContactFlowType,
  AssociateLambdaFunctionCommand, AssociateLambdaFunctionCommandInput, AssociateLambdaFunctionCommandOutput,
  CreateContactFlowCommand, CreateContactFlowCommandInput, CreateContactFlowCommandOutput,
  DeleteContactFlowCommand, DeleteContactFlowCommandInput, DeleteContactFlowCommandOutput,
  DisassociateLambdaFunctionCommand, DisassociateLambdaFunctionCommandInput, DisassociateLambdaFunctionCommandOutput
} from '@aws-sdk/client-connect'
import { vanityContactFlow } from './vanity-contact-flow'

const client = new ConnectClient({})

// Wrappers
// TODO: await might be unnecessary here

const associateLambda = async (input: AssociateLambdaFunctionCommandInput): Promise<AssociateLambdaFunctionCommandOutput> =>
  await client.send(new AssociateLambdaFunctionCommand(input))

const disassociateLambda = async (input: DisassociateLambdaFunctionCommandInput): Promise<DisassociateLambdaFunctionCommandOutput> =>
  await client.send(new DisassociateLambdaFunctionCommand(input))

const createContactFlow = async (input: CreateContactFlowCommandInput): Promise<CreateContactFlowCommandOutput> =>
  await client.send(new CreateContactFlowCommand(input))

const deleteContactFlow = async (input: DeleteContactFlowCommandInput): Promise<DeleteContactFlowCommandOutput> =>
  await client.send(new DeleteContactFlowCommand(input))

// Main Handler

const handler: CdkCustomResourceHandler = async (
  event: CdkCustomResourceEvent,
  context: Context
): Promise<CdkCustomResourceResponse> => {

  // TODO: Wrap all this in a try/catch/finally to prevent errors causing a "stack rollback update cleanup" from taking an hour

  console.log(event)

  // Sanity check
  if (event.ResourceProperties?.customAction !== 'CreateContactFlow') {
    console.log('Incorrect customAction')
    return {}
  }

  // Contact Flow calls just use the Id, not the full ARN
  // Associate/Disassociate Lambda do use the full ARN
  const connectInstanceArn = event.ResourceProperties?.connectInstanceArn
  const connectInstanceId = connectInstanceArn.split("/")[1] // Just the Id
  const vanityLambdaArn = event.ResourceProperties?.vanityLambdaArn

  if (event.RequestType == 'Create') {
    // Associate the lambda first, then use it in the flow
    console.log('Associating Lambda')
    const lambdaResult = await associateLambda({
      InstanceId: connectInstanceArn,
      FunctionArn: vanityLambdaArn
    })
    // TODO: Verify lambdaResult
    console.log(lambdaResult)

    // Contact Flow content must be in string format
    const content = JSON.stringify(vanityContactFlow(vanityLambdaArn))
    console.log('Contact Flow Content:', content)

    console.log('Creating Contact Flow')
    const flowResult = await createContactFlow({
      InstanceId: connectInstanceId,
      Name: 'Vanity Number Contact Flow',
      Type: ContactFlowType.CONTACT_FLOW,
      Content: content
    })
    // TODO: Verify flowResult
    console.log(flowResult)

    console.log('Create Success')
    return {
      PhysicalResourceId: flowResult.ContactFlowId
    }
  }

  // If we needed to make a change during a deploy update
  // if (event.RequestType == 'Update') { }

  if (event.RequestType == 'Delete') {
    // Remove flow before disassociating lambda
    console.log('Deleting Contact Flow')
    try {
      const flowResult = await deleteContactFlow({
        InstanceId: connectInstanceId,
        ContactFlowId: event.PhysicalResourceId
      })
    } catch (err) {
      /*
        Contact Flow is likely still being used:
            Received response status [FAILED] from custom resource. Message returned: Invalid request.
            Contact Flow Id is referenced in the following resources: [arn:aws:connect:us-west-2:...:instance/.../phone-number/...]
        We can continue safely, but this fragment will be left behind
      */
    }

    console.log('Disassociating Lambda')
    const lambdaResult = await disassociateLambda({
      InstanceId: connectInstanceArn,
      FunctionArn: vanityLambdaArn
    })

    console.log('Delete Success')
    return {}
  }

  console.log('Did Nothing! Update Success?')
  return {}
}

export { handler }
