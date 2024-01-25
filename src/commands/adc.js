/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2019 The Johns Hopkins University Applied Physics Laboratory LLC (JHU/APL).  All Rights Reserved.
//
// This material may be only be used, modified, or reproduced by or for the U.S. Government pursuant to the license
// rights granted under the clauses at DFARS 252.227-7013/7014 or FAR 52.227-14. For any other permission, please
// contact the Office of Technology Transfer at JHU/APL: Telephone: 443-778-2792, Internet: www.jhuapl.edu/ott
//
// NO WARRANTY, NO LIABILITY. THIS MATERIAL IS PROVIDED "AS IS." JHU/APL MAKES NO REPRESENTATION OR WARRANTY WITH
// RESPECT TO THE PERFORMANCE OF THE MATERIALS, INCLUDING THEIR SAFETY, EFFECTIVENESS, OR COMMERCIAL VIABILITY, AND
// DISCLAIMS ALL WARRANTIES IN THE MATERIAL, WHETHER EXPRESS OR IMPLIED, INCLUDING (BUT NOT LIMITED TO) ANY AND ALL
// IMPLIED WARRANTIES OF PERFORMANCE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT OF
// INTELLECTUAL PROPERTY OR OTHER THIRD PARTY RIGHTS. ANY USER OF THE MATERIAL ASSUMES THE ENTIRE RISK AND LIABILITY
// FOR USING THE MATERIAL. IN NO EVENT SHALL JHU/APL BE LIABLE TO ANY USER OF THE MATERIAL FOR ANY ACTUAL, INDIRECT,
// CONSEQUENTIAL, SPECIAL OR OTHER DAMAGES ARISING FROM THE USE OF, OR INABILITY TO USE, THE MATERIAL, INCLUDING,
// BUT NOT LIMITED TO, ANY DAMAGES FOR LOST PROFITS.
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const {Command, flags} = require('@oclif/command')
const adcs = require('../pressure.js')
const EventEmitter = require('events')

const state = new EventEmitter()

async function initialize(test, args) {
  console.log('Test')
  console.log(test)
  await adcs.initialize(test)
  state.emit('initialized', args)
}

function defaultMode(adcNumber, interval) {
  console.log(adcNumber.toString() + `
Raw Differential Output (V)\tCal'd Differential Output (V)\tPV Output (pv units):`)
  setInterval(() => {
    var raw = adcs.obj[adcNumber].rawOutput
    var cal = adcs.obj[adcNumber].calOutput
    var pv = adcs.obj[adcNumber].output
    console.log(raw.toFixed(4).padEnd(20) + '\t\t' + cal.toFixed(4).padEnd(20) + '\t\t' + pv.toFixed(4).padEnd(20))
    adcs.obj[adcNumber].getPV().catch(error => {
      console.log('getPV error')
      console.log(error)
    })
  }, interval)
}

function allRawMode(interval) {
  console.log('All Raw Outputs')
  var adcTitle = Object.keys(adcs.obj).join('\t')
  console.log(adcTitle)

  setInterval(() => {
    var output = []
    var latestStr
    Object.entries(adcs.obj).forEach(([, adcItem]) => {
      latestStr = adcItem.rawOutput.toFixed(4).padEnd(9)
      output.push(latestStr)
      adcItem.getPV().catch(error => {
        console.log('getPV error')
        console.log(adcItem.ID.value)
        console.log(error)
      })
    })
    // console.log('output')
    console.log(output.join('\t'))
  }, interval)
}

function handle(args) {
  // console.log('args')
  // console.log(args)
  if (args.mode === 'default') {
    defaultMode(args.adcNumber, args.interval)
  } else if (args.mode === 'raw') {
    allRawMode(args.interval)
  }
}

class ModeCommand extends Command {
  async run() {
    const {flags, args} = this.parse(ModeCommand)
    state.on('initialized', handle)
    initialize(flags.test, args).catch(error => {
      console.log(error)
    })
  }
}

ModeCommand.description = 'Diagnostic interface for ADCs'

ModeCommand.examples = [
  `$ sample-purification adc 0 default
ADC 0:
Raw Differential (V):
0.123\t0.123
Calibrated (V)
0.1\t0.1
PV (pv units)
10\t10`,
]

ModeCommand.flags = {
  help: flags.help({char: 'h'}),
  test: flags.boolean({char: 't',
    description: 'run command in "test" mode (put rpio into mock mode)',
    default: false,
  }),
}

ModeCommand.args = [{
  name: 'adcNumber',
  description: 'The ADC to diagnose',
  required: true,
  default: 'Pressure 1',
  options: ['Pressure 1', 'Pressure 2', 'Pressure 3', 'Pressure 4', 'all'],
},
{
  name: 'mode',
  description: 'The mode to view an ADC',
  required: false,
  default: 'default',
  options: ['default', 'stream', 'raw'],
},
{
  name: 'interval',
  description: 'The interval (ms) for updating the ADC output',
  required: false,
  default: 800,
}]

module.exports = ModeCommand
