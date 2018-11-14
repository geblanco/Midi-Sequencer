'use strict'

const midi = require('midi')
const { isNoteOnMessage, getChannel, getNoteOff } = require('../core/midi-utils')
const readline = require('readline')

function flatten(matrix){
  let output = []
  for (let row of matrix) {
    for (let col of row) {
      output.push(col)
    }
  }
  return output
}

function composeRows(startNote, cols, rows){
  let matrix1 = []
  let matrix2 = []
  let matrix3 = []
  let matrix4 = []
  for (let j = 0; j < rows; j++) {
    matrix1.push(startNote + j)
    matrix2.push(startNote - j)
    matrix3.push(startNote + (4 * j))
    matrix4.push(startNote - (4 * j))
  }
  return [matrix1, matrix2, matrix3, matrix4]
}

function end(){
  midiInput.closePort()
  midiOutput.closePort()
  process.exit(0)
}

function rowOff(row, noteOff){
  for (let i = 0; i < row.length; i++) {
    midiOutput.sendMessage([noteOff, row[i], 0])
  }
}

function rowOn(row, noteOn){
  for (let i = 0; i < row.length; i++) {
    midiOutput.sendMessage([noteOn, row[i], 127])
  }
}

function yesNo(callback){
  rl.question('Correct (y/n) ', (input) => {
    if (input.toLowerCase() === 'y') {
      callback(true)
    }else if (input.toLowerCase() === 'n') {
      callback(false)
    }else{
      yesNo(callback)
    }
  })
}

function save(outputPath, json){
  const { writeFileSync } = require('fs')
  console.log('Saving to', outputPath)
  writeFileSync(outputPath, JSON.stringify(json, null, 2))
}

function testRow(row, noteOn, callback){
  rowOn(row, noteOn)
  yesNo(callback)
}

function testCandidates(candidateRows, cols, noteOn, noteOff, callback){
  if (candidateRows.length === 0){
    callback(null)
  }else{
    let row = candidateRows.splice(0, 1)[0]
    console.log('Test candidate ', row)
    testRow(row, noteOn, (correct) => {
      if (correct) {
        callback( row )
      }else{
        rowOff(row, noteOff)
        testCandidates(candidateRows, cols, noteOn, noteOff, callback)
      }
    })
  }
}

function getNote(callback){
  midiInput.on('message', (deltaTime, message) => {
    if (isNoteOnMessage(message)) {
      midiInput.removeAllListeners()
      callback(message)
    }
  })
}

function mapMatrix(cols, rows, outputMatrix, callback){
  console.log(`Row:Col ${outputMatrix.length +1}:1`)
  getNote((message) => {
    let noteOn = message[0]
    let noteOff = getNoteOff(getChannel(message))
    let candidateRows = composeRows(message[1], cols, rows)
    testCandidates(candidateRows, cols, noteOn, noteOff, (outputRow) => {
      if (outputRow !== null) {
        outputMatrix.push(outputRow)
        if (outputMatrix.length === cols) {
          callback(true)
        }else{
          mapMatrix(cols, rows, outputMatrix, callback)
        }
      }else{
        callback(false)
      }
    })
  })
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
    rl.question('Number of matrix columns: ', (input) => {
      const cols = parseInt(input)
      rl.question('Number of matrix rows: ', (input) => {
        const rows = parseInt(input)
        const matrix = []
        mapMatrix(cols, rows, matrix, (correct) => {
          if (correct) {
            console.log(flatten(matrix))
            let output = './' + midiInput.getPortName(midiPort) + '_matrix.json'
            let json = { matrix: flatten(matrix), ncols: cols, nrows: rows }
            save(output, json)
            end()
          }else{
            console.log('Unable to automap, config by hand')
            end()
          }
        })
      })
    })
  })
})

