'use strict'

const MAX_KNOB = 191
const MIN_KNOB = 176
const MAX_NOTE_ON = 159
const MIN_NOTE_ON = 144
const MAX_NOTE_OFF = 143
const MIN_NOTE_OFF = 128

function isNoteMessage(message){
  return (isNoteOnMessage(message) || isNoteOffMessage(message))
}

function isNoteOnMessage(message){
  const status = message[0]
  return (MIN_NOTE_ON <= status && status <= MAX_NOTE_ON)
}

function isNoteOffMessage(message){
  const status = message[0]
  return (MIN_NOTE_OFF <= status && status <= MAX_NOTE_OFF)
}

function isKnob(message){
  return (MIN_KNOB <= message[0] && message[0] <= MAX_KNOB)
}

function getChannel(message){
  let decr = isNoteOnMessage(message) ? MIN_NOTE_ON : MAX_NOTE_OFF
  return message[0] - decr
}

function getNoteOn(channel){
  return (MIN_NOTE_ON + channel)
}

function getNoteOff(channel){
  return (MIN_NOTE_OFF + channel)
}

function getKnob(channel){
  return (MIN_KNOB + channel)
}

function encoderDirection(value){
  return value === 1 ? 1 : -1
}

module.exports = {
  isNoteMessage   : isNoteMessage,
  isNoteOnMessage : isNoteOnMessage,
  isNoteOffMessage: isNoteOffMessage,
  isKnob          : isKnob,
  getChannel      : getChannel,
  getNoteOn       : getNoteOn,
  getNoteOff      : getNoteOff,
  getKnob         : getKnob,
  encoderDirection: encoderDirection
}
