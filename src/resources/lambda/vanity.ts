import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"

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
    // TODO: Log reason
    console.log(err)
  }

  return {
    phoneNumber,
    vanityNumbers: null,
    modified: null
  }
}

const save = async (record: VanityNumberRecord): Promise<void> => {
  // TODO
  // set current timestamp for querying recent updates
  // ddb put

  try {
    const query: PutItemCommandInput = {
      TableName: vanityTableName,
      Item: marshall(record)
    }

    const result = await client.send(new PutItemCommand(query))
    console.log(result)
  } catch (err) {
    // TODO: Log reason
    console.log(err)
  }
}

const vanityFromNumber = async (phoneNumber: string): Promise<string[]> => {
  // TODO
  // vanity logic
  return [phoneNumber, 'FOO', 'BAR']
}

const handler = async (event: any, context: any) => {
  try {
    const phoneNumber = '555-1212' // TODO
    let vanityRecord = await load(phoneNumber)

    if (!vanityRecord.vanityNumbers)
      // Vanity numbers have not been calculated for this number
      vanityRecord.vanityNumbers = await vanityFromNumber(phoneNumber)

    console.log(vanityRecord)
    if (vanityRecord?.vanityNumbers != null) {
      // TODO: is this sanity check necessary
      vanityRecord.modified = new Date().toISOString()
      await save(vanityRecord)
    }

    return vanityRecord

  } catch (err) {
    // TODO: Log error
    console.log(err)
    return null
  }
}

export { handler }
