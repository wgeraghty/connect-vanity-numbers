import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"

import { Context } from 'aws-lambda'
import { ConnectContactFlowEvent, ConnectContactFlowResult } from 'aws-lambda/trigger/connect-contact-flow'

import { WordFinder } from './word-finder'

const client = new DynamoDBClient({})
const vanityTableName = process.env.VANITY_TABLE_NAME

import { VanityNumberRecord } from './vanity-common'

const load = async (phoneNumber: string): Promise<VanityNumberRecord> => {
  console.log('Looking for phone number: ', phoneNumber)
  try {
    const query: GetItemCommandInput = {
      TableName: vanityTableName,
      Key: marshall({
        type: 'vanity',
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
    type: 'vanity',
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

// Get all substring variations, with potential words
const getAllSubstrings = (wf: WordFinder, str: string) => {
  var i, j, result = []

  for (i = 0; i < str.length; i++) {
    for (j = i + 1; j < str.length + 1; j++) {
      const value = str.slice(i, j)
      result.push({
        start: i,
        end: j,
        length: j - i,
        prefix: str.slice(0, i),
        slice: value,
        text: wf.search(value),
        postfix: str.slice(j, str.length)
      })
    }
  }

  // TODO: Combine non-overlapping slices
  // Example: 867428=TOPHAT but TOPHAT isn't in the word list
  //    TOP and HAT are in the word list but only one of them is currently picked

  // Sort by longest words first, then number of words found
  return result.sort((a, b) => {
    if (a.text.length != 0 && b.text.length != 0)
      // both have words, sort by length, longest words first
      return a.slice.length < b.slice.length ? 1 : -1

    // Sort by number of words, most words first
    return a.text.length < b.text.length ? 1 : -1
  })
}

const vanityFromNumber = async (phoneNumber: string): Promise<string[]> => {
  const wf = new WordFinder()
  await wf.init()

  // Split into pieces that are usable.
  const chunks = phoneNumber
    .substring(5)         // Strip country code and area code
    .replace(/\+/g, '')   // Ignore +
    .split(/([01])/)      // 0 and 1 are not mapped to letters
    .filter(x => x != '') // Ignore empty values

  const chunkResults = chunks
    .map(value => {
      // Get potential values for each chunk
      const substringValues = getAllSubstrings(wf, value)
        .map(x => {
          return x.text.map(y => {
            const prefix = x.prefix.split('').join(' ')
            const postfix = x.postfix.split('').join(' ')
            return `${prefix} ${y.toLowerCase()} ${postfix}`.trim()
          })
        })

      // Flatten out the possible values to 1d array
      return {
        chunk: value,
        values: substringValues
          .reduce((prev, cur) => {
            prev.push(...cur)
            return prev
          }, [])
      }
    })

  const vanities = []
  for (let i = 0; i < 5; i++) {
    const parts: string[] = []
    chunkResults.map(x => {
      if (!x.values.length)
        // Chunk does not have any found words, so use original chunk value
        parts.push(x.chunk.split('').join(' ').trim())
      else
        // Use next word on each loop
        parts.push(x.values[i % x.values.length])
    })
    vanities.push(parts.join(' '))
  }

  return vanities
}

const handler = async (event: ConnectContactFlowEvent, context: Context): Promise<ConnectContactFlowResult | null> => {

  console.log(JSON.stringify(event))

  try {
    // See docs/ContactFlowEvent.json
    const contactAddress = event?.Details?.ContactData?.CustomerEndpoint?.Address
    const contactType = event?.Details?.ContactData?.CustomerEndpoint?.Type

    if (contactType != 'TELEPHONE_NUMBER' || typeof contactAddress !== 'string')
      return null // TODO: Verify null triggers the error condition in the flow

    // TODO: Could contactType be TELEPHONT_NUMBER but the phone number invalid?

    const phoneNumber = contactAddress! // +1234567890, TODO: verify format?
    let vanityRecord = await load(phoneNumber)

    if (!vanityRecord?.vanityNumbers)
      // Vanity numbers have not been calculated for this number
      // Save processing on repeated calls
      vanityRecord.vanityNumbers = await vanityFromNumber(phoneNumber)

    console.log(vanityRecord)
    if (vanityRecord?.vanityNumbers != null) {
      // TODO: is this sanity check necessary
      vanityRecord.modified = new Date().toUTCString()
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
