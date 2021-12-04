type VanityNumberRecord = {
  type: 'vanity'
  phoneNumber: string
  vanityNumbers: string[] | null
  modified: string | null // UTC
}

export { VanityNumberRecord }
