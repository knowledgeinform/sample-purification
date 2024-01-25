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
const EventEmitter = require('events')
const traps = require('../traps.js')
const valves = require('../valves.js')

class Eemitter extends EventEmitter {}

const state = new Eemitter()

class ModeCommand extends Command {
  async run() {
    const {flags, args} = this.parse(ModeCommand)
    traps.initialize(state, flags.test)
    valves.initialize(state, flags.test)
    // this.log("Mode number: "+args.number)
    // this.log(typeof args.number)

    if (args.number === 1) {
      state.emit('Mode1')
    } else if (args.number === 2) {
      state.emit('Mode2')
    } else if (args.number === 3) {
      state.emit('Mode3')
    } else if (args.number === 4) {
      state.emit('Mode4')
    }
  }
}

ModeCommand.description = 'Puts the purification system into a given mode'

ModeCommand.examples = [
  `$ sample-purification mode 1
Valve 1: Off
Valve 2: Off
Valve 3: Off
Valve 4: Off`,
]

ModeCommand.flags = {
  help: flags.help({char: 'h'}),
  test: flags.boolean({char: 't',
    description: 'run command in "test" mode (put rpio into mock mode)',
  }),
}

ModeCommand.args = [{
  name: 'number',
  description: `Mode number
1: Back-flush Sample Tube, Backflush Trap #1, Back-flush PC Column, Backflush Red. Cat., Desorb Sample from Trap #2 (2 min)\n
2: Vent DG-1, Desorb Sample Tube and Collect Sample on Trap #1, Back-flush PC Column, Backflush Red. Cat., Desorb Sample from Trap #2 (5 min)\n
3: Back-flush Sample Tube, Vent DG-2, Load PC Column Eluent onto Trap #2, Vent Hy-2, Flush Analytical Column (5 min)\n
4: Back-flush Sample Tube, Vent DG-2, Vent PC Column, Back-flush Trap #2, Flush Analytical Column (6 min)`,
  required: true,
  options: ['1', '2', '3', '4'],
}]

module.exports = ModeCommand
