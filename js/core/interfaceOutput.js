'use strict'

const { output } = require('midi')
const { getNoteOn, getNoteOff } = require('./midi-utils')

class InterfaceOutput {
  constructor(midiPort, midiChannel) {
    this.midiPort = midiPort
    this.midiChannel = midiChannel
    this.midiOutput = new output()
    this.midiOutput.openPort(midiPort)
    this.workLayer = -1
    this.currLayer = -1
    this.messageOn = new Array(3)
    this.messageOff = new Array(3)
    this.messageOn[0] = getNoteOn(midiChannel)
    this.messageOff[0] = getNoteOff(midiChannel)
    this.messageOn[2] = 127
    this.messageOff[2] = 0
    console.log(`Interface Output registered at ${this.midiOutput.getPortName(this.midiPort)}(${this.midiPort}):${this.midiChannel}`)
  }
  registerMapper(map){
    this.map = map
  }
  getPortName(){ return this.midiPort }
  setWorkLayer(layer){ this.workLayer = layer }
  setCurrLayer(layer){ this.currLayer = layer }
  _sendOut(out, value){
    let message = this.messageOn
    if (!value) {
      message = this.messageOff
    }
    message[1] = out
    // console.log('InterfaceOutput out', message)
    this.midiOutput.sendMessage(message)
  }
  setTrackControl(trackNo, trackControl, value){
    let control = this.map.getTrackControlOutput(trackNo, trackControl)
    this._sendOut(control, value)
    // console.log('InterfaceOutput setTrackControl', trackNo, trackControl, control, value)
  }
  setTrack(trackNo, value){
    let trackOut = this.map.getTrackControlOutput(trackNo, 'select')
    this._sendOut(trackOut, value)
    // console.log('InterfaceOutput', message, trackNo, value, stepOut)
  }
  setStep(stepNo, value){
    let stepOut = this.map.getStepOutput(stepNo)
    this._sendOut(stepOut, value)
    // console.log('InterfaceOutput', message, stepNo, value, stepOut)
  }
  blinkStep(step, maxSteps){
    // Set off previous step and blink the given one,
    // step passing from the clock
    let prevStep = step === 0 ? maxSteps : step -1
    this.messageOff[1] = this.map.getStepOutput(prevStep)
    this.midiOutput.sendMessage(this.messageOff)
    this.messageOn[1] = this.map.getStepOutput(step)
    this.midiOutput.sendMessage(this.messageOn)
  }
  blinkTrack(track){
    // Select control should always exist!! (maybe not with only one track?)
    this.messageOn[1] = this.map.getTrackControlOutput(track, 'select')
    this.midiOutput.sendMessage(this.messageOn)
  }
  reset(nTracks, nSteps){
    for (let track = 0; track < nTracks; track++) {
      this.messageOff[1] = this.map.getTrackControlOutput(track, 'select')
      this.midiOutput.sendMessage(this.messageOff)
      for (let step = 0; step < nSteps; step++) {
        this.messageOff[step] = this.map.getStepOutput(step)
        this.midiOutput.sendMessage(this.messageOff)
      }
    }
  }
  updateTrack(prevTrack, currTrack){
    this.setTrack(prevTrack, false)
    this.setTrack(currTrack, true)
  }
  updateControl(track, values){
    for (let keyValue of values) {
      console.log('updateControl', track, keyValue[0], keyValue[1])
      this.setTrackControl(track, keyValue[0], keyValue[1])
    }
  }
  updateSteps(steps){
    for (let stepNo = 0; stepNo < steps.length; stepNo++) {
      this.setStep(stepNo, steps[stepNo])
    }
  }
}

module.exports = InterfaceOutput
