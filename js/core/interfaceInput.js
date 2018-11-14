'use strict'

let { input } = require('midi')
const { isNoteOnMessage, isKnob, encoderDirection } = require('./midi-utils')
const LAYER_CHANGE = [20, 12, 16]

class InterfaceInput {
  constructor(midiPort, midiChannel, layer=0) {
    this.midiPort = midiPort
    this.midiChannel = midiChannel
    this.workingLayer = layer
    this.clock = null
    this.sequencer = null
    this.currentLayer = null
    // ToDo := Pot mode
    this.potMode = false
    this.midiInput = new input()
    this.midiInput.on('message', this.onMessage.bind(this))
    this.midiInput.openPort(midiPort)
    this.displayOut = null
    console.log(`Interface Input registered at ${this.midiInput.getPortName(this.midiPort)}(${this.midiPort})`)
  }
  registerMapper(map){
    this.map = map
  }
  registerDisplayOutput(displayOut){
    this.displayOut = displayOut
  }
  registerSequencer(sequencer){
    this.sequencer = sequencer
  }
  onMessage(deltaTime, message){
    // console.log('onMessage', 1)
    // Avoid extra callbacks by blocking note off events
    // if( this.filterMessage(message) ){
      // console.log('onMessage', 2)
      if (isNoteOnMessage(message)) {
        // console.log('onMessage', 3)
        // Attend the event, else it's not for us
        this.onButton(message)
      }else if (isKnob(message)) {
        this.onKnob(message)
      }
    // }
  }
  filterMessage(message){
    var ch = message[1]
    var layerIndex = LAYER_CHANGE.indexOf(ch)
    // console.log('Filter', ch, layerIndex)
    if( -1 !== layerIndex ){
      // Change layer
      this.currentLayer = layerIndex
    }
    return (this.currentLayer === this.workingLayer)
  }
  onButton(message){
    if (this.map.isTrackSelect(message)) {
      let track = this.map.getTrackSelect(message)
      this.sequencer.setCurrTrack(track)
      if (this.sequencer.getCurrTrack() !== this.sequencer.getPrevTrack()) {
        this.displayOut.updateTrack(this.sequencer.getPrevTrack(), track)
        this.displayOut.updateSteps(this.sequencer.getTrack(track).getSequence())
      }
    }else if (this.map.isTrackControl(message)) {
      let change = this.map.getTrackControlInput(message)
      let track = change.track
      let control = change.control
      this.sequencer.trackControl({ track: track, control: control })
      this.displayOut.setTrackControl(track, control, this.sequencer.getTrackControlValue(track, control))
    }else if (this.map.isStep(message)) {
      let step = this.map.getStepInput(message)
      this.sequencer.setStep(step)
      this.displayOut.setStep(step, this.sequencer.getStepValue(step))
    }
  }
  onKnob(message){
    let change = this.map.getTrackControlInput(message)
    if (change !== null) {
      // ToDo := Knob to display output?
      let track = change.hasOwnProperty('track') ? change.track : this.sequencer.getCurrTrack()
      let control = change.control
      let value = change.value
      if (change.encoder) {
        console.log('encoder', value, message)
        let incr = this.map.controller.encoderIncrement || 1
        value = this.sequencer.getTrackControlValue(track, control) + (incr * encoderDirection(value))
      }
      this.sequencer.continuousControl({ track: track, control: control, value: value })
    }
  }
  close(){
    this.midiInput.closePort()
  }
}

module.exports = InterfaceInput
