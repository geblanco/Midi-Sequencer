'use strict'

const min_keys = ['matrix', 'tracks']
const { cloneDeep } = require('lodash')

class Mapper {
  constructor(sequencerSettings, controllerSettings) {
    this.settings = require(sequencerSettings)
    this.controller = require(controllerSettings)
    this.controller.trackValues = this._parseTrackControls(this.controller)
    this.controller.multiTrackValues = this._parseMultiTrackControls(this.controller)
    /*const error = this._validateSettings(this.settings)
    if (error) 
      throw new Error(error)
    }*/
  }
  _validateSettings(obj){
    let err = false
    let i = 0
    let len = min_keys.length
    for (; i < len && obj.hasOwnProperty(min_keys[i]); i++);
    return i >= len
  }
  _parseTrackControls(controller){
    // Grab the controller numeric value and map it to sequencer controls
    let ret = {}
    for (let i = 0; i < controller.tracks.length; i++) {
      let track = controller.tracks[i]
      for (let key of Object.keys(track)) {
        ret[track[key].value] = { control: track[key].control, track: i, encoder: !!track[key].encoder }
      }
    }
    return ret
  }
  _parseMultiTrackControls(controller){
    // Grab the controller numeric value and map it to sequencer controls
    let ret = {}
    for (let i = 0; i < controller.multitrack.length; i++) {
      let track = controller.multitrack[i]
      console.log('parsing controls', track)
      ret[track['value']] = { control: track['control'], encoder: !!track.encoder }
    }
    return ret
  }
  getTrackControlInput(message){
    let val = null
    if (this.isTrackControl(message)) {
      val = this.controller.trackValues[message[1]]
    }else if (this.isMultiTrackControl(message)) {
      val = this.controller.multiTrackValues[message[1]]
    }
    if (val !== null) {
      val = cloneDeep(val)
      val['value'] = message[2]
    }
    return val
  }
  getTrackSelect(message){
    let control = this.getTrackControlInput(message)
    return control.track
  }
  getTrackControlOutput(track, control){
    let ret = null
    let controls = this.controller.tracks[track]
    let controlKey = Object.keys(controls).find(key => controls[key]['control'] == control)
    if (controlKey) {
      ret = controls[controlKey]['value']
      if (this.controller['colors'] && this.controller['colors'][control]) {
        ret += this.controller['colors'][control]
      }
    }
    return ret
  }
  isTrackControl(message){
    return this.controller.trackValues.hasOwnProperty(message[1])
  }
  isMultiTrackControl(message){
    return this.controller.multiTrackValues.hasOwnProperty(message[1])
  }
  isTrackSelect(message){
    return this.isTrackControl(message) && this.getTrackControlInput(message)['control'] === 'select'
  }
  getStepInput(message){
    return this.controller.matrix.indexOf(message[1])
  }
  getStepOutput(step){
    // console.log('getStepOutput', step, this.controller.matrix)
    return this.controller.matrix[step]
  }
  isStep(message){
    // console.log('mapper isStep', message[1], this.controller.matrix)
    return this.controller.matrix.indexOf(message[1]) !== -1
  }
}

module.exports = Mapper
