// Based on https://github.com/efriis/t9

import * as fs from 'fs'
import * as path from 'path'

export class WordFinder {
  words: string[]
  dialpad: { [letter: string]: string } = {
    'a': '2',
    'b': '2',
    'c': '2',
    'd': '3',
    'e': '3',
    'f': '3',
    'g': '4',
    'h': '4',
    'i': '4',
    'j': '5',
    'k': '5',
    'l': '5',
    'm': '6',
    'n': '6',
    'o': '6',
    'p': '7',
    'q': '7',
    'r': '7',
    's': '7',
    't': '8',
    'u': '8',
    'v': '8',
    'w': '9',
    'x': '9',
    'y': '9',
    'z': '9'
  }
  suggestion_limit: Number = 10

  public async init() {
    // Load the word list

    console.log('WordFinder::init')
    console.log(__dirname)
    console.log(path.resolve('./filtered-word-list.txt'))

    const promises = [
      new Promise<void>((resolve, reject) => {
        fs.readFile(path.resolve('./word-finder/sorted-filtered-word-list.txt'), 'utf8', (err, contents) => {
          if (err) {
            console.log(err)
            this.words = []
          } else {
            console.log('Word List Loaded')
            this.words = contents?.split(/\r?\n/) || []
          }
          resolve()
        })
      })
    ]

    return await Promise.all(promises)
  }

  /**
   * Finds best possible matches to number sequence
   * @param sequence The number sequence to match a word to
   */
  public search(sequence: string): string[] {
    let rtn: string[] = []
    let haystack: string[] = this.words

    for (let i = 0; i < haystack.length && rtn.length < this.suggestion_limit; i++)
      if (this.search_match(sequence, haystack[i]))
        rtn.push(haystack[i])

    return rtn
  }

  /**
   * Simple function to figure out if a number sequence matches a word
   * @param sequence The number sequence that the user typed on the dialpad
   * @param prospective_match The word to check
   * @returns {boolean} Whether the prospective_match actually matches sequence or not
   */
  private search_match(sequence: string, prospective_match: string) {
    if (sequence.length != prospective_match.length)
      return false

    for (let i = 0; i < sequence.length; i++)
      if (this.dialpad[prospective_match[i]] !== sequence[i])
        return false

    return true
  }
}
