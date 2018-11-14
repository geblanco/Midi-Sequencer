'use strict'

const midi = require('midi')
const { isNoteOnMessage, isKnob, getChannel, getNoteOff } = require('../core/midi-utils')
const readline = require('readline')

function end(){
  midiInput.closePort()
  midiOutput.closePort()
  process.exit(0)
}

function save(outputPath, json){
  const { writeFileSync } = require('fs')
  console.log('Saving to', outputPath)
  writeFileSync(outputPath, JSON.stringify(json, null, 2))
}

function mapTrackControls(nTracks, nControls, callback){
  let next = () => {}
  let lastCtrl = null
  midiInput.on('message', (deltaTime, message) => {
    // ToDo := Handle knob control
    if (isNoteOnMessage(message)) {
      next(message[1])
    }else if (isKnob(message) && message[1] !== lastCtrl) {
      lastCtrl = message[1]
      next(message[1])
    }
  })
  function mapTracks(tracksAcc, restOfTracks, restOfButtons, callback){
    if (restOfTracks === 0) {
      callback(tracksAcc)
    }else{
      restOfTracks--
      let controls = []
      next = (control) => {
        controls.push(control)
        restOfButtons--
        if (restOfButtons === 0){
          tracksAcc.push(controls)
          next = () => {}
          mapTracks(tracksAcc, restOfTracks, nControls, callback)
        }else{
          console.log(`Control ${nControls- restOfButtons}`)
        }
      }
      console.log(`Track ${nTracks - restOfTracks}`)
      console.log(`Control ${nControls- restOfButtons}`)
    }
  }
  mapTracks([], nTracks, nControls, callback)
}

function getOpenMidi(midiObj, callback){
  console.log('Available Ports:')
  for (let i = 0; i < midiObj.getPortCount(); i++) {
    console.log(`> (${i})`, midiObj.getPortName(i))
  }

  rl.question('Port ', (input) => {
    let port = parseInt(input)
    midiPort = port
    midiObj.openPort(port)
    callback(midiObj)
  })
}

const midiInput = new midi.input()
const midiOutput = new midi.output()
let midiPort = 0

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Input port')
getOpenMidi(midiInput, (midiObj) => {
  console.log('Output port')
  getOpenMidi(midiOutput, (midiObj) => {
    rl.question('Number of tracks: ', (input) => {
      const tracks = parseInt(input)
      console.log('Map select tracks: ')
      rl.question('Number of buttons per track: ', (input) => {
        let buttonsPerTrack = parseInt(input)
        mapTrackControls(tracks, buttonsPerTrack, (mappedTrackButtons) => {
          rl.question('Number of knobs per track: ', (input) => {
            let knobsPerTrack = parseInt(input)
            mapTrackControls(tracks, knobsPerTrack, (mappedTrackKnobs) => {
              let json = []
              for (let trackId = 0; trackId < mappedTrackButtons.length; trackId++) {
                let track = {}
                let trackButtons = mappedTrackButtons[trackId]
                for (let i = 0; i < trackButtons.length; i++) {
                  track[`ctrl_${i}`] = trackButtons[i]
                }
                let tracKnobs = mappedTrackKnobs[trackId]
                for (let i = 0; i < tracKnobs.length; i++) {
                  track[`knob_${i}`] = tracKnobs[i]
                }
                json.push(track)
              }
              let output = './' + midiInput.getPortName(midiPort) + '_tracks.json'
              save(output, {'tracks': json})
              end()
            })
          })
        })
      })
    })
  })
})

