'use strict'

const { output } = require('midi')
const { getNoteOn, getKnob } = require('./midi-utils')

class Track {
  constructor(trackControls, continuousControls, nSteps, id) {
    this.steps = new Array(nSteps).fill(0)
    this.id = id
    this._mute = false
    this._solo = false
    this.controlPointers = {}
    this.trackControls = {}
    this.continuousControls = {}
    for (let control of trackControls) {
      let value = 127
      if (control === 'mute' || control === 'solo') {
        value = 0
      }
      this.trackControls[control] = value
      this.controlPointers[control] = 'trackControls'
    }
    for (let control of continuousControls) {
      this.continuousControls[control] = 100
      this.controlPointers[control] = 'continuousControls'
    }
  }
  setStep(s, vel=100){ this.steps[s] = vel }
  getStep(s){ return (this._solo || !this._mute) ? this.steps[s] : 0 }
  toggleStep(s, vel=100){
    if (this.steps[s] === 0) {
      this.steps[s] = vel
    }else {
      this.steps[s] = 0
    }
  }
  get(control){ return this[this.controlPointers[control]][control] }
  set(control, value){
    if (control === 'mute') {
      this.mute()
    }else if (control === 'solo') {
      this.solo()
    }else{
      this[this.controlPointers[control]][control] = Math.max(Math.min(value, 127), 0)
    }
  }
  toggleControl(control){
    if (control === 'mute') {
      this.mute()
    }else if (control === 'solo') {
      this.solo()
    }else{
      let value = this[this.controlPointers[control]][control]
      if (value === 0) {
        value = 127
      }else{
        value = 0
      }
      this[this.controlPointers[control]][control] = value
    }
  }
  getId(){ return this.id }
  setId(id){ this.id = id }
  getSequence(){ return this.steps }
  getControls(){
    let controls = []
    let keys = Object.keys(this.controlPointers)
    for (let key of keys) {
      controls.push([key, this.get(key)])
    }
    return controls
  }
  getContinousControls(){
    let controls = []
    let keys = Object.keys(this.continuousControls)
    for (let key of keys) {
      controls.push([key, this.continuousControls[key]])
    }
    return controls
  }
  getTrackControls(){
    let controls = []
    let keys = Object.keys(this.trackControls)
    for (let key of keys) {
      controls.push([key, this.trackControls[key]])
    }
    return controls
  }
  mute(){
    this._mute = !this._mute
    let value = this._mute ? 127 : 0
    this.trackControls['mute'] = value
  }
  isMuted(){ return this._mute }
  solo(){
    this._solo = !this._solo
    let value = this._solo ? 127 : 0
    this.trackControls['solo'] = value
  }
  isSoloed(){ return this._solo }
  isContinuous(control){ return this.controlPointers[control] === 'continuousControls' }
}

class Sequencer {
  constructor(nTracks, nSteps, midiPort, midiChannel, settingsFile) {
    this.numTracks = nTracks
    this.numSteps = nSteps
    this.midiPort = midiPort
    this.midiChannel = midiChannel
    this.settings = require(settingsFile)
    this.midiOut = new output()
    this.midiOut.openVirtualPort(this.midiPort)
    this.currStep = 0
    this.prevStep = -1
    this.currTrack = 0
    this.prevTrack = -1
    this.vel = 100
    this.tracks = []
    for (let trackId = 0; trackId < this.numTracks; trackId++) {
      this.tracks.push(new Track(this.settings.trackControls, this.settings.continuousControls, this.numSteps, trackId))
    }
    console.log(`Sequencer registered at ${this.midiPort}:${this.midiChannel}`)
  }
  getTrackControlValue(track, control){
    return this.tracks[track].get(control)
  }
  trackControl({ track, control }){
    // ToDo := Is it useful to send non knob values out??
    this.tracks[track].toggleControl(control)
    console.log('Track control', track, control, this.tracks[track].get(control))
  }
  continuousControl({ track, control, value }){
    console.log('Sequencer continuousControl', track, control, this.tracks[track].get(control))
    this.tracks[track].set(control, value)
    let cc = this.settings.tracks[track][control]
    let message = [getKnob(this.midiChannel), cc, this.tracks[track].get(control)]
    this.midiOut.sendMessage(message)
  }
  getCurrTrack(){ return this.currTrack }
  getPrevTrack(){ return this.prevTrack }
  getTrack(trackNo){ return this.tracks[trackNo] }
  getPrevStep(){ return this.tracks[this.currTrack].getStep(this.prevStep) }
  getPrevStepNo(){ return this.prevStep }
  getStep(){ return this.tracks[this.currTrack].getStep(this.currStep) }
  getStepNo(){ return this.currStep }
  getStepValue(step){ return this.tracks[this.currTrack].getStep(step) }
  getNumTracks(){ return this.numTracks }
  getNumSteps(){ return this.numSteps }
  getPortName(){ return this.midiPort }
  getActivatedTracks(step){
    let active = new Array(this.nTracks).fill(0)
    let trackList = this.tracks.filter(track => track.isSoloed())
    if (trackList.length === 0) {
      trackList = this.tracks.filter(track => !track.isMuted())
    }
    for (let track of trackList) {
      active[track.getId()] = track.getStep(step)
    }
    return active
  }
  setStep(step){
    this.tracks[this.currTrack].toggleStep(step, this.vel)
    console.log('Sequencer setStep', this.currTrack, 'step', step, this.tracks[this.currTrack].getStep(step))
  }
  setCurrTrack(track){
    this.prevTrack = this.currTrack
    this.currTrack = track
    console.log('Sequencer selectTrack', track)
  }
  _trackIter(trackSet){
    let toLit = []
    for (let i = 0; i < trackSet.length; i++) {
      if (trackSet[i].isSoloed() || !trackSet[i].isMuted()) {
        let stepOut = trackSet[i].getStep(this.currStep)
        // console.log('Current step', stepOut, 'track', i, 'curr', this.currStep)
        if (stepOut) {
          let trackId = trackSet[i].getId()
          this.stepOut(trackId, stepOut)
          if (this.currTrack !== trackId) {
            // Blink track led when it should sound
            // but is not selected
            toLit.push(trackId)
          }
        }
      }
    }
    return toLit
  }
  step(){
    this.prevStep = this.currStep
    this.currStep = (++this.currStep) % this.numSteps
    let soundTracks = this.tracks.filter(track => track.isSoloed())
    if (!soundTracks.length) {
      soundTracks = this.tracks
    }
    let litTracks = this._trackIter(soundTracks)
    console.log('Current step', this.currStep)
    return litTracks
  }
  stepOut(track, step){
    let message = [ getNoteOn(this.midiChannel), this.settings.baseValue + track, step ]
    this.midiOut.sendMessage(message)
  }
  start(){
    this.prevStep = this.currStep
    this.currStep = 0
  }
}

module.exports = Sequencer
