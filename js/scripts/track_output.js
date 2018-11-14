'use strict'

const { readFileSync, writeFileSync } = require('fs')
const tracksSettings = JSON.parse(readFileSync('../settings.json'))
const controllerSettings = JSON.parse(readFileSync(process.argv[2]))

const nTracks = tracksSettings['nTracks']
const nSteps = tracksSettings['nSteps']
const nTControls = tracksSettings['trackControls'].length
const nCControls = tracksSettings['continuousControls'].length
const baseValue = tracksSettings['baseValue']

const outputValues = { tracks: [] }
const allControls = tracksSettings['trackControls'].concat(tracksSettings['continuousControls'])
const amount = 1 + allControls.length
for (let trackId = 0; trackId < nTracks; trackId++) {
  // Values: noteOn that makes the track sound
  // ToDo := In-sequencer mute or mute in daw? For now sequencer, altough it goes out
  // Track control Values: from settings, mute, solo
  // Sound control Values: from settings, volume, pan, send...
  let shift = baseValue + amount * trackId
  let track = {}
  for (let ctrl = 0; ctrl < allControls.length; ctrl++) {
    track[allControls[ctrl]] = ctrl + shift
  }
  outputValues['tracks'].push(track)
}

writeFileSync('./sequencer_output.json', JSON.stringify(outputValues, null, 2))

