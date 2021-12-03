const vanityContactFlow = (lambdaArn: string) => ({
  "modules": [
    {
      "id": "5226b371-506d-4016-b05e-de46d2ddad6f",
      "type": "PlayPrompt",
      "branches": [
        {
          "condition": "Success",
          "transition": "f11eab37-3e3e-439e-96d2-e39e7374fee8"
        }
      ],
      "parameters": [
        {
          "name": "Text",
          "value": "Error",
          "namespace": null
        },
        {
          "name": "TextToSpeechType",
          "value": "text"
        }
      ],
      "metadata": {
        "position": {
          "x": 766,
          "y": 281
        },
        "useDynamic": false
      }
    },
    {
      "id": "f11eab37-3e3e-439e-96d2-e39e7374fee8",
      "type": "Disconnect",
      "branches": [],
      "parameters": [],
      "metadata": {
        "position": {
          "x": 1135,
          "y": 93
        }
      }
    },
    {
      "id": "45d7b06a-9ba0-49e1-a926-c2c084b55dbe",
      "type": "InvokeExternalResource",
      "branches": [
        {
          "condition": "Success",
          "transition": "684876be-b9ed-44ef-908f-89a35c44cf9d"
        },
        {
          "condition": "Error",
          "transition": "5226b371-506d-4016-b05e-de46d2ddad6f"
        }
      ],
      "parameters": [
        {
          "name": "FunctionArn",
          "value": lambdaArn,
          "namespace": null
        },
        {
          "name": "TimeLimit",
          "value": "3"
        }
      ],
      "metadata": {
        "position": {
          "x": 434,
          "y": 171
        },
        "dynamicMetadata": {},
        "useDynamic": false
      },
      "target": "Lambda"
    },
    {
      "id": "684876be-b9ed-44ef-908f-89a35c44cf9d",
      "type": "PlayPrompt",
      "branches": [
        {
          "condition": "Success",
          "transition": "f11eab37-3e3e-439e-96d2-e39e7374fee8"
        }
      ],
      "parameters": [
        {
          "name": "Text",
          "value": "Success $.External.vanity1 $.External.vanity2 $.External.vanity3",
          "namespace": null
        },
        {
          "name": "TextToSpeechType",
          "value": "text"
        }
      ],
      "metadata": {
        "position": {
          "x": 767,
          "y": 102
        },
        "useDynamic": false
      }
    }
  ],
  "version": "1",
  "start": "45d7b06a-9ba0-49e1-a926-c2c084b55dbe",
  "metadata": {
    "entryPointPosition": {
      "x": 20,
      "y": 20
    },
    "snapToGrid": false,
    "name": "Vanity Lambda",
    "description": null,
    "type": "contactFlow",
    "status": "published",
    "hash": "ff20951eb1eeeace99ed1031b1428c35b70c588a24f67346e48de952b74a9d15"
  },
  "type": "contactFlow"
})

export { vanityContactFlow }
