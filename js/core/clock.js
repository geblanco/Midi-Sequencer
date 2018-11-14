'use strict'

let { input } = require('midi')
const { cloneDeep } = require('lodash')

const CLOCK_MSGS = {
  START: 248,
  STOP : 250,
  RUN  : 252
}

class Clock {
  constructor(midiPort, nSteps, resolution=24) {
    this.midiPort = midiPort
    this.sequencer = null
    this.displayOut = null
    this.clockData = {
      resolution: resolution,
      beatcount : 0,
      count     : 0,
      steps     : nSteps
    }
    this.midiInput = new input()
    this.midiInput.on('message', this.onMessage.bind(this))
    this.midiInput.openPort(midiPort)
    this.midiInput.ignoreTypes(true, false, true)
    this.state = CLOCK_MSGS.STOP
    this.started = false
    console.log(`Clock registered at ${this.midiPort}`)
  }
  registerDisplayOutput(displayOut){
    this.displayOut = displayOut
  }
  onMessage(deltaTime, message){
    if( null === this.sequencer ){
      console.log('No sequencer registered')
      console.log('m:' + message + ' d:' + deltaTime)
    }else{
      var status = message[0]
      this.state = status
      if (!this.started || this.shouldRun(status)) {
        this.run()
      }else if (this.shouldStart(status)) {
        this.start()
        this.started = true
      }else if ( this.shouldStop(status)) {
        this.stop()
      }else{
        console.log('Unknown clock message ' + status)
        // Continue the clock, just in case
        this.state = CLOCK_MSGS.RUN
      }
    }
  }
  shouldStart(status){
    return (CLOCK_MSGS.START === status)
  }
  shouldStop(status){
    return (CLOCK_MSGS.STOP === status)
  }
  shouldRun(status){
    return (CLOCK_MSGS.RUN === status)
  }
  start(){
    this.clockData.beatcount = 0
    this.sequencer.start()
  }
  stop(){
    this.clockData.beatcount = 0
    // this.sequencer.stop()
  }
  run(){
    this.clockData.count++
    if (0 === (this.clockData.count % this.clockData.resolution)) {
      this.clockData.beatcount = (this.clockData.beatcount + 1) % this.clockData.steps
      console.log('clock run', this.clockData.beatcount)
      this.clockData.count = 0
      let blinkTracks = cloneDeep(this.sequencer.getActivatedTracks(this.clockData.beatcount))
      blinkTracks[this.sequencer.getCurrTrack()] = 127
      let sequence = cloneDeep(this.sequencer.getTrack(this.sequencer.getCurrTrack()).getSequence())
      sequence[this.clockData.beatcount] = 127
      this.displayOut.updateSteps(sequence)
      if (blinkTracks.length) {
        for (let trackId = 0; trackId < blinkTracks.length; trackId++) {
          this.displayOut.setTrack(trackId, blinkTracks[trackId])
        }
      }
      this.sequencer.step()
    }
  }
  close(){
    this.midiInput.closePort()
  }
  registerSequencer(sequencer){
    this.sequencer = sequencer
  }
  offset(dir){
    if (dir) {
      this.clockData.count = (1 + this.clockData.count) % this.clockData.resolution
    }else{
      this.clockData.count = this.clockData.count > 0 ? this.clockData.count -1 : this.clockData.resolution -1
    }
  }
}

module.exports = Clock
