import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"

import { Context } from 'aws-lambda'
import { ConnectContactFlowEvent, ConnectContactFlowResult } from 'aws-lambda/trigger/connect-contact-flow'

const client = new DynamoDBClient({})
const vanityTableName = process.env.VANITY_TABLE_NAME

type VanityNumberRecord = {
  phoneNumber: string
  vanityNumbers: string[] | null
  modified: string | null // TODO: Date format available? Standardize as GMT?
}

const load = async (phoneNumber: string): Promise<VanityNumberRecord> => {
  try {
    const query: GetItemCommandInput = {
      TableName: vanityTableName,
      Key: marshall({
        phoneNumber
      })
    }

    const result = await client.send(new GetItemCommand(query))
    console.log(result)

    if (result.Item) {
      const item = unmarshall(result.Item || {}) as VanityNumberRecord
      console.log(item)

      if (item)
        return item
    }

  } catch (err) {
    console.log(err)
  }

  return {
    phoneNumber,
    vanityNumbers: null,
    modified: null
  }
}

const save = async (record: VanityNumberRecord): Promise<void> => {
  try {
    const query: PutItemCommandInput = {
      TableName: vanityTableName,
      Item: marshall(record)
    }

    const result = await client.send(new PutItemCommand(query))
    console.log(result)
  } catch (err) {
    console.log(err)
  }
}

const vanityFromNumber = async (phoneNumber: string): Promise<string[]> => {
  // TODO
  // vanity logic
  return [phoneNumber, 'FOO', 'BAR']
}

const handler = async (event: ConnectContactFlowEvent, context: Context): Promise<ConnectContactFlowResult | null> => {

  console.log(JSON.stringify(event))

  try {
    // See docs/ContactFlowEvent.json
    const contactAddress = event?.Details?.ContactData?.CustomerEndpoint?.Address
    const contactType = event?.Details?.ContactData?.CustomerEndpoint?.Type

    if (contactType != 'TELEPHONE_NUMBER' || typeof contactAddress !== 'string')
      return null // TODO: Verify null triggers the error condition in the flow

    const phoneNumber = contactAddress! // +1234567890, TODO: verify format?
    let vanityRecord = await load(phoneNumber)

    if (!vanityRecord?.vanityNumbers)
      // Vanity numbers have not been calculated for this number
      vanityRecord.vanityNumbers = await vanityFromNumber(phoneNumber)

    console.log(vanityRecord)
    if (vanityRecord?.vanityNumbers != null) {
      // TODO: is this sanity check necessary
      vanityRecord.modified = new Date().toISOString()
      await save(vanityRecord)
    }

    // Using 1-based indexing for the names for human-ness in the Connect UI
    return {
      phoneNumber: vanityRecord.phoneNumber,
      vanity1: vanityRecord.vanityNumbers[0],
      vanity2: vanityRecord.vanityNumbers[1],
      vanity3: vanityRecord.vanityNumbers[2],
    }

  } catch (err) {
    console.log(err)
    return null
  }
}

export { handler }
