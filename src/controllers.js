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

const ui = require('./ui.js')
const bkup = require('./backup.js')
const ad = require('./abstract-driver.js')
const arduino = require('./arduino-driver.js')

var controllersID = 'Controllers'
var controllersPath = 'config/' + controllersID

class ControllersC {
  constructor({router, Description, Details, testFlag = true, type, index}) {
    var i
    this.Index = new ui.ShowUser({value: index})
    this['Controller Type'] = new ui.ShowUser({value: type})
    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    // controller specific code
    if (type === 'arduino') {
      Object.defineProperty(this, 'hidden', {
        value: new arduino.Device({router: router, testFlag: testFlag}),
      })
    } else {
      console.log('UNKNOWN controller type:')
      console.log(type)
    }
    // generic controller code
    this.datastreams = {refreshRate: 3000}
    this.updateable = []
    if (this.hidden.numberPVs) {
      var descriptor = []
      var name = []
      for (i = 0; i < this.hidden.numberPVs; i++) {
        name.push('PV' + i.toString())
        descriptor.push('Process Value ' + i.toString())
      }
      descriptor.forEach((d, i) => {
        Object.defineProperty(this, d, {
          enumerable: true,
          get: () => {
            console.log('Getting PV ' + i)
            return (new ui.ShowUser({value: this.hidden[name[i]], type: ['input', 'datapoint']}))
          },
        })
      })
    } else {
      Object.defineProperty(this, 'Process Value', {
        enumerable: true,
        get: () => {
          return new ui.ShowUser({value: this.hidden.PV, type: ['input', 'datapoint']})
        },
      })
    }

    if (this.hidden.numberSPs) {
      var spdescriptor = []
      var spname = []
      var codescriptor = []
      var coname = []
      for (i = 0; i < this.hidden.numberSPs; i++) {
        spname.push('SP' + i.toString())
        spdescriptor.push('Set Point ' + i.toString())
        coname.push('CO' + i.toString())
        codescriptor.push('Controller Output ' + i.toString())
      }
      spdescriptor.forEach((d, i) => {
        Object.defineProperty(this, d, {
          enumerable: true,
          get: () => {
            return (new ui.ShowUser({value: this.hidden[spname[i]], type: ['output', 'datapoint']}))
          },
          set: val => {
            console.log('Setting sp: ' + val)
            this.hidden[spname[i]] = val
          },
        })
        this.updateable.push(d)
      })
      codescriptor.forEach((d, i) => {
        Object.defineProperty(this, d, {
          enumerable: true,
          get: () => {
            return (new ui.ShowUser({value: this.hidden[coname[i]], type: ['input', 'datapoint']}))
          },
        })
      })
    } else {
      Object.defineProperty(this, 'Set Point', {
        enumerable: true,
        get: () => {
          return new ui.ShowUser({value: this.hidden.SP, type: ['output', 'datapoint']})
        },
        set: val => {
          this.hidden.setPoint = val
        },
      })
      this.updateable.push('Set Point')
      Object.defineProperty(this, 'Controller Output', {
        enumerable: true,
        get: () => {
          return new ui.ShowUser({value: this.hidden.CO, type: ['input', 'datapoint']})
        },
        // set: val => {
        //   // something
        // },
      })
      // Object.defineProperty(this, 'Set Point', {
      //   enumerable: true,
      //   get: () => {
      //     return (new ui.ShowUser({value: this.hidden.setPoint, type: ['output', 'datapoint']}))
      //   }
      // })
    }

    if (Object.prototype.hasOwnProperty.call(this.hidden, 'Settings')) {
      console.log('Found Settings')
      this.Settings = this.hidden.Settings
    }

    this.Description = new ui.ShowUser({value: Description})
    this.Details = new ui.ShowUser({value: Details})
    // setTimeout(() => {
    //   this.initialize()
    // }, 2000)
  }

  checkAdditionalFields() {
    if (Object.prototype.hasOwnProperty.call(this.hidden, 'AdditionalFields')) {
      console.log('Found additional fields')
      Object.entries(this.hidden.AdditionalFields).forEach(([key]) => {
        Object.defineProperty(this, key, {
          enumerable: true,
          get: () => {
            return this.hidden.AdditionalFields[key]
          },
          set: val => {
            this.hidden.AdditionalFields[key] = val
          },
        })
      })
    }
  }

  initialize() {

  }

  /*
  returns an array of objects whose id's correspond to the key names
  */
  // findControllerParts(i) {
  //   var retObj = new ui.ShowUser({
  //     value: [{
  //       id: 'Settings',
  //       obj: {}
  //     }],
  //     type: ['output', 'link']
  //   })
  //   if (i != undefined) {
  //     // multiple loops
  //     if (this.hidden.loops[i].Settings != undefined) {
  //       // generate settings object with link
  //       Object.entries(this.hidden.loops[i].Settings).forEach(([key,value]) => {
  //
  //       })
  //     }
  //   } else {
  //
  //   }
  //
  // }
}

var controllersMap = {
  0: {Description: '', Details: '', 'Controller Type': 'arduino', index: '0'},
}

function delay(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000)
  })
}

module.exports = {
  initialize: async function (test) {
    // test = false
    // max time to wait for router to open
    var rTimer = setTimeout(() => {
      throw new Error('Timeout')
    }, 5000)

    console.log('Initializing Controllers in controllers js')
    // test = true
    if (test === undefined) {
      test = false
    }
    // console.log(test)
    // seriallineSerials for SPSs
    // SPS0: 95736323632351E0F050
    // SPS1: 95736323632351112261
    var router = new ad.Router({
      portPath: '/dev/tty.usbmodem1432201',
      manufacturer: 'Arduino (www.arduino.cc)',
      seriallineSerial: '95736323632351112261',
      testFlag: test,
      baud: 57600,
      delimiter: '\r\n',
      maxQueueLength: 400,
    })

    try {
      await router.openPort()
      clearTimeout(rTimer)
    } catch (error) {
      console.log('BIG OPEN PORT ERROR--Should NEVER reach here')
      throw error
      // throw error
    }

    if (bkup.configExists(controllersPath)) {
      // this should eventually be in a try-catch with a default config
      var loadMap = bkup.load(controllersPath)
      Object.entries(loadMap).forEach(([key, value]) => {
        // specify bare-minimum amount that the config should have
        // console.log(value)
        if (value['Controller Type'].value) {
          console.log(key)
          // console.log(value)
          // var router = selectRouter({controlSystem: value.controlSystem.value, test: test})
          controllersMap[key] = new ControllersC({
            router: router,
            Description: value.Description.value,
            Details: value.Details.value,
            testFlag: test,
            type: value['Controller Type'].value,
            index: value.Index.value,
          })
          // give the serial line 2 seconds to open up. Doing this just from
          // experience
          // controllersMap[key] = new MFC({id: value.ID.value,router: router, testFlag: test,Description: value.Description.value,Details: value.Details.value})
        } else {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value[\'Controller Type\'].value')
          console.log(value)
        }
      })
    } else {
      // add details to valve map
      Object.entries(controllersMap).forEach(([key, value]) => {
        console.log(value)
        // var router = selectRouter({controlSystem: value['Controller Type'].value, test: test})
        controllersMap[key] = new ControllersC({
          router: router,
          Description: value.Description,
          Details: value.Details,
          testFlag: test,
          type: value['Controller Type'],
          index: value.index,
        })
        // give the serial line 2 seconds to open up. Doing this just from
        // experience
        console.log(controllersMap[key])
        bkup.save(controllersMap[key], controllersPath)
      })
    }
    await delay(2) // 2 second delay necessary for Arduinos
    for (var key of Object.keys(controllersMap)) {
      await controllersMap[key].hidden.initialize()
      controllersMap[key].checkAdditionalFields()
    }
    console.log('Controllers map')
    console.log(controllersMap)
    return
  },
  id: controllersID,
  obj: controllersMap,
  path: controllersPath,
}
