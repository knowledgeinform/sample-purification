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
const ad = require('./abstract-driver.js')

var trapsID = 'traps'
var trapsPath = 'config/' + trapsID

class Trap {
  constructor({
    GPIO,
    trapNumber,
    Description,
    Details,
    // State,
    testFlag = false,
    fireTime = 500,
  }) {
    this.ID = new ui.ShowUser({value: trapNumber.toString()})

    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    this.GPIO = new ui.ShowUser({value: GPIO, type: ['output', 'number']})
    this.Description = new ui.ShowUser({value: Description})
    this.Details = new ui.ShowUser({value: Details})
    this.Status = new ui.ShowUser({value: 'Off', type: ['input', 'string']})
    Object.defineProperty(this, 'trapState', {
      value: new ui.ShowUser({value: false, type: ['output', 'binary']}),
      writable: true,
    })
    Object.defineProperty(this, 'State', {
      enumerable: true,
      get: () => {
        return this.trapState
      },
      set: val => {
        console.log('Setting Trap ' + this.ID.value.toString() + ' to ' + val.toString())
        var pinMapIndex = pinMap.getIndexFromGPIO(this.GPIO.value)
        if (val) {
          rpio.write(pinMap.HeaderNumber[pinMapIndex], rpio.HIGH)
          this.Status.value = 'On'
        } else {
          rpio.write(pinMap.HeaderNumber[pinMapIndex], rpio.LOW)
          this.Status.value = 'Off'
        }
        this.trapState.value = val
        console.log('Trap State')
        console.log(this.trapState)
        if (this.testFlag) console.log('Trap: ' + this.ID.value + ' ' + val + ' (GPIO ' + this.GPIO.value +
        ' Header: ' + pinMap.HeaderNumber[pinMapIndex] + ' Info: ' + pinMap.Name[pinMapIndex] + ')')
      },
    })
    Object.defineProperty(this, 'hiddenFireTime', {
      writable: true,
      value: new ad.DataPoint({value: fireTime, units: 'ms'}),
    })
    this['Fire Time'] = new ui.ShowUser({value: this.hiddenFireTime, type: ['output', 'datapoint']})
    Object.defineProperty(this, 'Fire', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.State = true
        this.Status.value = 'Firing'
        setTimeout(() => {
          this.State = false
          this.Status.value = 'Done Firing'
        }, this.hiddenFireTime.value)
      },
    })
    this.datastreams = {refreshRate: 300}
    this.updateable = ['State']
  }
}

var trapMap = {1: {GPIO: 6},
  2: {GPIO: 13},
}

function lookupPins(obj) {
  var pins = []
  // console.log(typeof obj)
  Object.entries(obj).forEach(([, value]) => {
    pins.push(pinMap.HeaderNumber[pinMap.getIndexFromGPIO(value.GPIO)])
  })
  // console.log(pins)
  return pins
}

function pullDownPins() {
  var pins = lookupPins(trapMap)
  // var state = rpio.PULL_DOWN
  for (var pin of pins) {
    /* Configure pin as output with the initiate state set low */
    rpio.open(pin, rpio.OUTPUT, rpio.LOW)
  }
}

module.exports = {
  initialize: async function (test) {
    console.log('intializing traps')
    this.pinInit(test)

    if (bkup.configExists(trapsPath)) {
      // this should eventually be in a try-catch with a default config
      var loadMap = bkup.load(trapsPath)
      Object.entries(loadMap).forEach(([key, value]) => {
        // specify bare-minimum amount that the config should have
        if (value.GPIO.value === undefined) {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value.GPIO.value')
          console.log(value)
        } else {
          console.log(key)
          trapMap[key] = new Trap({
            GPIO: value.GPIO.value,
            trapNumber: value.ID.value,
            Description: value.Description.value,
            Details: value.Details.value,
            State: value.State.value,
          })
          if (Object.prototype.hasOwnProperty.call(value, 'Fire Time')) {
            if (Object.prototype.hasOwnProperty.call(value['Fire Time'], 'value')) {
              if (Object.prototype.hasOwnProperty.call(value['Fire Time'].value, 'value')) {
                trapMap[key].hiddenFireTime.value = value['Fire Time'].value.value
              }
            }
          }
          // trapMap[key] = new MFC({id: value.ID.value,router: router, testFlag: test,Description: value.Description.value,Details: value.Details.value})
        }
      })
    } else {
      // create trap map
      Object.entries(trapMap).forEach(([key, value]) => {
        var pinMapIndex = pinMap.getIndexFromGPIO(trapMap[key].GPIO)
        var details = 'GPIO ' + trapMap[key].GPIO + ' Header: ' + pinMap.HeaderNumber[pinMapIndex] + ' Info: ' + pinMap.Name[pinMapIndex]
        trapMap[key] = new Trap({
          GPIO: value.GPIO,
          trapNumber: key,
          Details: details,
          testFlag: test,
        })
        // console.log(value)
        bkup.save(trapMap[key], trapsPath)
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
    }
    pullDownPins()
  },
  id: trapsID,
  obj: trapMap,
  path: trapsPath,
}
