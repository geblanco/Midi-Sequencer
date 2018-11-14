'use strict'

const { readFileSync, writeFileSync } = require('fs')
const k2 = JSON.parse(readFileSync('./k2_tracks_in.json'))
const k = [ 'select', 'mute', 'volume', 'r' ]
const out = []

for (let track of k2) {
  let t = {}
  let keys = Object.keys(track)
  for (let i = 0; i < keys.length; i++) {
    t[keys[i]] = { value: track[keys[i]], control: k[i] }
  }
  out.push(t)
}

writeFileSync('./k2_map.json', JSON.stringify({'tracks': out}, null, 2))
