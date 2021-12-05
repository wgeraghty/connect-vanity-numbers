import { WordFinder } from '.'

// Get all substring variations, with potential words
function getAllSubstrings(wf: WordFinder, str: string) {
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

  // Sort by longest words first, then number of words found
  return result.sort((a, b) => {
    if (a.text.length != 0 && b.text.length != 0)
      // both have words, sort by length, longest words first
      return a.slice.length < b.slice.length ? 1 : -1

    // Sort by number of words, most words first
    return a.text.length < b.text.length ? 1 : -1
  })
}

async function test() {
  const wf = new WordFinder()
  await wf.init()
  console.log('ready')

  let number = '+18008675309'

  // Split into pieces that are usable.
  const chunks = number
    .substring(5)
    .replace(/\+/g, '')    // Ignore the +
    .split(/([+10])/)     // 0(+) and 1 are not mapped to letters
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
        parts.push(x.chunk.split('').join(' ').trim())
      else
        parts.push(x.values[i % x.values.length])
    })
    vanities.push(parts.join(' '))
  }

  console.log(vanities)
}

test()
