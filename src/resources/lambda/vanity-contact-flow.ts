// Use `aws connect describe-contact-flow` to figure this out
// aws connect describe-contact-flow --instance-id INSTANCE_ID --contact-flow-id CONTACT_FLOW_ID
// Find the values in the URL of the Web UI
// Do not use the downloaded version from the Web UI

const vanityContactFlow = (lambdaArn: string) => ({
  "Version": "2019-10-30",
  "StartAction": "45d7b06a-9ba0-49e1-a926-c2c084b55dbe",
  "Metadata": {
    "entryPointPosition": {
      "x": 20,
      "y": 20
    },
    "snapToGrid": false,
    "ActionMetadata": {
      "45d7b06a-9ba0-49e1-a926-c2c084b55dbe": {
        "position": {
          "x": 163,
          "y": 37
        },
        "dynamicMetadata": {},
        "useDynamic": false
      },
      "5226b371-506d-4016-b05e-de46d2ddad6f": {
        "position": {
          "x": 401,
          "y": 251
        },
        "useDynamic": false
      },
      "684876be-b9ed-44ef-908f-89a35c44cf9d": {
        "position": {
          "x": 402,
          "y": 104
        },
        "useDynamic": false
      },
      "f11eab37-3e3e-439e-96d2-e39e7374fee8": {
        "position": {
          "x": 631,
          "y": 218
        }
      }
    }
  },
  "Actions": [
    {
      "Identifier": "45d7b06a-9ba0-49e1-a926-c2c084b55dbe",
      "Parameters": {
        "LambdaFunctionARN": lambdaArn,
        "InvocationTimeLimitSeconds": "3"
      },
      "Transitions": {
        "NextAction": "684876be-b9ed-44ef-908f-89a35c44cf9d",
        "Errors": [
          {
            "NextAction": "5226b371-506d-4016-b05e-de46d2ddad6f",
            "ErrorType": "NoMatchingError"
          }
        ],
        "Conditions": []
      },
      "Type": "InvokeLambdaFunction"
    },
    {
      "Identifier": "5226b371-506d-4016-b05e-de46d2ddad6f",
      "Parameters": {
        "Text": "I'm sorry, I was unable to figure out your vanity numbers."
      },
      "Transitions": {
        "NextAction": "f11eab37-3e3e-439e-96d2-e39e7374fee8",
        "Errors": [],
        "Conditions": []
      },
      "Type": "MessageParticipant"
    },
    {
      "Identifier": "684876be-b9ed-44ef-908f-89a35c44cf9d",
      "Parameters": {
        "SSML": '<speak><p>Your first vanity number is <prosody rate="x-slow">$.External.vanity1</prosody></p><p>Your second vanity number is <prosody rate="x-slow">$.External.vanity2</prosody></p><p>Your third vanity number is <prosody rate="x-slow">$.External.vanity3</prosody></p><p>Thank you! Goodbye!</p></speak>'
      },
      "Transitions": {
        "NextAction": "f11eab37-3e3e-439e-96d2-e39e7374fee8",
        "Errors": [],
        "Conditions": []
      },
      "Type": "MessageParticipant"
    },
    {
      "Identifier": "f11eab37-3e3e-439e-96d2-e39e7374fee8",
      "Type": "DisconnectParticipant",
      "Parameters": {},
      "Transitions": {}
    }
  ]
})

export { vanityContactFlow }
