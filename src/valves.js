/// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright (C) 2019 The Johns Hopkins University Applied Physics Laboratory LLC (JHU/APL).  All Rights Reserved.
//
// This material may be only be used, modified, or reproduced by or for the U.S. Government pursuant to the license
// rights granted under the clauses at DFARS 252.227-7013/7014 or FAR 52.227-14. For any other permission, please
// contact the Office of Technology Transfer at JHU/APL: Telephone: 443-778-2792, Internet: www.jhuapl.edu/ott
//
// NO WARRANTY, NO LIABILITY. THIS MATERIAL IS PROVIDED 'AS IS.' JHU/APL MAKES NO REPRESENTATION OR WARRANTY WITH
// RESPECT TO THE PERFORMANCE OF THE MATERIALS, INCLUDING THEIR SAFETY, EFFECTIVENESS, OR COMMERCIAL VIABILITY, AND
// DISCLAIMS ALL WARRANTIES IN THE MATERIAL, WHETHER EXPRESS OR IMPLIED, INCLUDING (BUT NOT LIMITED TO) ANY AND ALL
// IMPLIED WARRANTIES OF PERFORMANCE, MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT OF
// INTELLECTUAL PROPERTY OR OTHER THIRD PARTY RIGHTS. ANY USER OF THE MATERIAL ASSUMES THE ENTIRE RISK AND LIABILITY
// FOR USING THE MATERIAL. IN NO EVENT SHALL JHU/APL BE LIABLE TO ANY USER OF THE MATERIAL FOR ANY ACTUAL, INDIRECT,
// CONSEQUENTIAL, SPECIAL OR OTHER DAMAGES ARISING FROM THE USE OF, OR INABILITY TO USE, THE MATERIAL, INCLUDING,
// BUT NOT LIMITED TO, ANY DAMAGES FOR LOST PROFITS.
/// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const pinMap = require('./pin-map.js')
const rpio = require('rpio')
const ui = require('./ui.js')
const bkup = require('./backup.js')

var valvesID = 'valves'
var valvesPath = 'config/' + valvesID

class ValveC {
  constructor({
    GPIO,
    ValveNumber,
    Description,
    Details,
    // State,
    testFlag = false,
  }) {
    this.Valve = new ui.ShowUser({value: ValveNumber.toString()})
    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    this.GPIO = new ui.ShowUser({value: GPIO, type: ['output', 'number']})
    this.Description = new ui.ShowUser({value: Description})
    this.Details = new ui.ShowUser({value: Details})
    Object.defineProperty(this, 'valveState', {
      value: new ui.ShowUser({value: false, type: ['output', 'binary']}),
      writable: true,
    })
    Object.defineProperty(this, 'State', {
      enumerable: true,
      get: () => {
        return this.valveState
      },
      set: val => {
        console.log('Setting Valve ' + this.Valve.value.toString() + ' to ' + val.toString())
        var pinMapIndex = pinMap.getIndexFromGPIO(this.GPIO.value)
        if (val) {
          console.log('Pulling' + pinMap.HeaderNumber[pinMapIndex] + ' HIGH')
          rpio.write(pinMap.HeaderNumber[pinMapIndex], rpio.HIGH)
        } else {
          console.log('Pulling' + pinMap.HeaderNumber[pinMapIndex] + ' LOW')
          rpio.write(pinMap.HeaderNumber[pinMapIndex], rpio.LOW)
        }
        this.valveState.value = val
        console.log('Valve State')
        console.log(this.valveState)
        console.log('Valve: ' + this.Valve.value + ' ' + val + ' (GPIO ' + this.GPIO.value +
        ' Header: ' + pinMap.HeaderNumber[pinMapIndex] + ' Info: ' + pinMap.Name[pinMapIndex] + ')')
      },
    })
    this.datastreams = {refreshRate: 300}
    this.updateable = ['State']
  }
}

// we should be using the physical header numbers for the IOs because the GPIOs
// change with revision. Because we don't actually use the gpio mapping in
// rpio, we don't actually use the GPIO numbers, since these *internally* map
// directly to header numbers which are used. Thus, with newer revisions,
// this internal mapping will stay constant, and thus, the header numbers will too

var valveMap = {
  1: {GPIO: 17, ValveNumber: 1, Description: '', Details: '', State: 0},
  2: {GPIO: 27, ValveNumber: 2, Description: '', Details: '', State: 0},
  3: {GPIO: 22, ValveNumber: 3, Description: '', Details: '', State: 0},
  4: {GPIO: 24, ValveNumber: 4, Description: '', Details: '', State: 0},
  J1: {GPIO: 0, ValveNumber: 'J1', Description: '', Details: '', State: 0},
  J2: {GPIO: 5, ValveNumber: 'J2', Description: '', Details: '', State: 0},
}

function lookupPins(vMap) {
  var pins = []
  // console.log(typeof vMap)
  Object.entries(vMap).forEach(([key, value]) => {
    if (key !== 'Toggle') {
      pins.push(pinMap.HeaderNumber[pinMap.getIndexFromGPIO(value.GPIO)])
    }
  })
  // console.log(pins)
  return pins
}

function pullDownPins() {
  var pins = lookupPins(valveMap)
  // var state = rpio.PULL_DOWN
  for (var pin of pins) {
    /* Configure pin as output with the initiate state set low */
    // console.log('Pulling down pin: '+pin)
    rpio.open(pin, rpio.OUTPUT, rpio.LOW)
  }
}

module.exports = {
  initialize: async function (test) {
    console.log('intializing valves')
    // intialize pins
    this.pinInit(test)

    if (bkup.configExists(valvesPath)) {
      // this should eventually be in a try-catch with a default config
      var loadMap = bkup.load(valvesPath)
      Object.entries(loadMap).forEach(([key, value]) => {
        // specify bare-minimum amount that the config should have
        if (value.GPIO.value === undefined) {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value.GPIO.value')
          console.log(value)
        } else {
          console.log(key)
          // console.log(value)
          valveMap[key] = new ValveC({
            GPIO: value.GPIO.value,
            ValveNumber: value.Valve.value,
            Description: value.Description.value,
            Details: value.Details.value,
            State: value.State.value,
            testFlag: test,
          })
          // valveMap[key] = new MFC({id: value.ID.value,router: router, testFlag: test,Description: value.Description.value,Details: value.Details.value})
        }
      })
    } else {
      // add details to valve map
      Object.entries(valveMap).forEach(([key, value]) => {
        var pinMapIndex = pinMap.getIndexFromGPIO(valveMap[key].GPIO)
        var details = 'GPIO ' + valveMap[key].GPIO + ' Header: ' + pinMap.HeaderNumber[pinMapIndex] + ' Info: ' + pinMap.Name[pinMapIndex]
        valveMap[key] = new ValveC({
          GPIO: value.GPIO,
          Details: details,
          Description: value.Description,
          ValveNumber: value.ValveNumber,
          testFlag: test,
        })
        // console.log(value)
        bkup.save(valveMap[key], valvesPath)
      })
    }
    return
  },
  pinInit: function (test) {
    if (test) {
      console.log('Operating in test-mode')
      /*
       * Explicitly request mock mode to avoid warnings when running on known
       * unsupported hardware, or to test scripts in a different hardware
       * environment (e.g. to check pin settings).
       */
      rpio.init({mock: 'raspi-3'})

      /* Override default warn handler to avoid mock warnings */
      rpio.on('warn', function () {})
    } else {
      console.log('NOT operating in test-mode')
    }
    pullDownPins()
  },
  id: valvesID,
  obj: valveMap,
  path: valvesPath,
}
