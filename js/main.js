'use strict'

const { joinSafe } = require('upath')

const Sequencer = require(joinSafe(__dirname, 'core', 'sequencer'))
const InterfaceInput = require(joinSafe(__dirname, 'core', 'interfaceInput'))
const InterfaceOutput = require(joinSafe(__dirname, 'core', 'interfaceOutput'))
const Mapper = require(joinSafe(__dirname, 'core', 'mapper'))
const Clock = require(joinSafe(__dirname, 'core', 'clock'))

const config = require(process.argv[2])

const clockMidiPort = config['clockMidiPort']
const controllerInputPort = config['controllerInputPort']
const controllerOutputPort = config['controllerOutputPort']
const sequencerOutputPort = config['sequencerOutputPort']
const sequencerOutputChannel = config['sequencerOutputChannel']

const controllerLayer = config.hasOwnProperty('layer') ? config['layer'] : 0
const controllerMidiChannel = config['controllerMidiChannel']
const nSteps = config['nSteps']
const nTracks = config['nTracks']
const resolution = config.hasOwnProperty('clockResolution') ? config['clockResolution'] : 24
const sequencerConfigPath = joinSafe(__dirname, config['sequencerConfigPath'])
const controllerConfigPath = joinSafe(__dirname, config['controllerConfigPath'])

const clock = new Clock(clockMidiPort, nSteps, resolution)
const controllerInput = new InterfaceInput(controllerInputPort, controllerLayer)
const controllerOutput = new InterfaceOutput(controllerOutputPort, controllerMidiChannel)
const sequencer = new Sequencer(nTracks, nSteps, sequencerOutputPort, sequencerOutputChannel, sequencerConfigPath)
const mapper = new Mapper(sequencerConfigPath, controllerConfigPath)

controllerInput.registerMapper(mapper)
controllerInput.registerDisplayOutput(controllerOutput)
controllerInput.registerSequencer(sequencer)
clock.registerSequencer(sequencer)
clock.registerDisplayOutput(controllerOutput)
controllerOutput.registerMapper(mapper)

// start
sequencer.setCurrTrack(0)
for (let track = 1; track < config.nTracks; track++){
  controllerOutput.updateControl(track, sequencer.getTrack(track).getTrackControls())
  controllerOutput.setTrack(track, false)
}
controllerOutput.updateControl(0, sequencer.getTrack(0).getTrackControls())
controllerOutput.setTrack(0, true)
controllerOutput.updateSteps(sequencer.getTrack(0).getSequence())

/*setTimeout(function() {
  clock.start()
  setInterval(function() {
    clock.run()
  }, 1000 / 86)
}, 1000);
*/