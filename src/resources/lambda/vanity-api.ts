import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDBClient, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { VanityNumberRecord } from './vanity-common'

const client = new DynamoDBClient({})
const vanityTableName = process.env.VANITY_TABLE_NAME

const load = async (): Promise<VanityNumberRecord[]> => {
  try {
    // Either the KeyConditions or KeyConditionExpression parameter must be specified in the request
    // const query: QueryCommandInput = {
    //   TableName: vanityTableName
    // }
    // const result = await client.send(new QueryCommand(query))

    const scan: ScanCommandInput = {
      TableName: vanityTableName
    }
    const result = await client.send(new ScanCommand(scan))

    console.log({ result })

    for (const i of result.Items || []) {
      const item = unmarshall(i) as VanityNumberRecord
      console.log({ item })
    }

    const response = (result.Items || []).map((value, key) => unmarshall(value)) as VanityNumberRecord[]
    console.log({ response })

    return response
  } catch (err) {
    console.log(err)
  }

  return []
}

const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(await load())
  }
}

export { handler }
