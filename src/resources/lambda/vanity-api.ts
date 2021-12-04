import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult, Context } from 'aws-lambda'
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})
const vanityTableName = process.env.VANITY_TABLE_NAME

const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // TODO: There has to be a better way
    const result = await client.send(new QueryCommand({
      TableName: vanityTableName,
      IndexName: 'modified',
      ProjectionExpression: 'phoneNumber, vanityNumbers, modified', // All the Web App UI needs to know
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: { '#type': 'type' },
      ExpressionAttributeValues: { ':type': { 'S': 'vanity' } },
      ScanIndexForward: false,
      Limit: 5
    }))

    // const result = await client.send(new ScanCommand({
    //   TableName: vanityTableName,
    //   IndexName: 'modified',
    //   Limit: 5
    // }))

    console.log({ result })

    const response = (result.Items || []).map((value, key) => unmarshall(value))
    console.log({ response })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    }
  }

}

export { handler }
