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

const ad = require('./abstract-driver.js')
var EventEmitter = require('events')
const ui = require('./ui.js')

class ArduinoController extends EventEmitter {
  constructor({router,
    testFlag = true,
    // address=1,
    debugTest = false,
  }) {
    super()
    this.testFlag = testFlag
    this.debugTest = debugTest
    // eventually, this should all be done in intialization
    this.numberPVs = 4
    this.numberSPs = 4
    this.numberLoops = 4
    // this.loops = []
    this.frameRepeat = {}
    this.rrTimeout = 200 // 200 ms before a recent request is cleared
    this.processValue = []
    this.setPoint = []
    this.controllerOutput = []
    var i
    for (i = 0; i < this.numberPVs; i++) {
      this.processValue.push(new ad.DataPoint({units: 'C', value: 0}))
    }
    for (i = 0; i < this.numberSPs; i++) {
      this.setPoint.push(new ad.DataPoint({units: 'C', value: 74}))
      this.controllerOutput.push(new ad.DataPoint({units: '%', value: 0}))
    }
    this.processValue.forEach((item, i) => {
      Object.defineProperty(this, 'PV' + i, {
        configurable: true,
        enumerable: true,
        get: () => {
          return (new ad.DataPoint({value: 0}))
        },
      })
    })

    this.setPoint.forEach((item, i) => {
      Object.defineProperty(this, 'SP' + i, {
        configurable: true,
        enumerable: true,
        get: () => {
          return (new ad.DataPoint({value: 0}))
        },
        // set: (val) => {
        //
        // }
      })
    })

    this.controllerOutput.forEach((item, i) => {
      Object.defineProperty(this, 'CO' + i, {
        configurable: true,
        enumerable: true,
        get: () => {
          return (new ad.DataPoint({value: 0}))
        },
      })
    })

    // this.address = address
    this.objName = 'c'
    this.curObj = ''
    this.delimiter = '.'

    // ideally, this should use the linker object to somehow generate the class properties...
    this.respObj = {}
    this.controllerLinker = {
      status: 'status',
      address: 'address',
      numLoops: 'Number of Loops',
      loops: [],
    }
    this.loopLinker = {
      status: 'status',
      pid: {
        p: 'P',
        i: 'I',
        d: 'D',
        rlow: 'Range Low',
        rhigh: 'Range High',
        DIR: 'Direction',
      },
      loopVars: {
        pvUnits: 'Process Value Units',
        pv: 'Process Value',
        sp: 'Set Point',
        co: 'Controller Output',
      },
      safety: {
        EN: 'Enabled',
        FSP: 'Failure Set Point',
        ULAL: 'Upper Limit Alarm',
        LLAL: 'Lower Limit Alarm',
      },
    }
    // Object.entries(this.controllerLinker).forEach(([key, value], i) => {
    //   if (key === 'loops') {
    //     for (var i2 = 0 i2 < this.numberLoops i2++) {
    //       this.controllerLinker[key].push({})
    //     }
    //     this.controllerLinker[key].forEach((item, i) => {
    //       this.controllerLinker[key][i] = this.loopLinker
    //     })
    //
    //   } else {
    //     Object.defineProperty(this, value, {
    //       writable: true,
    //       enumerable: true,
    //     })
    //   }
    // })
    this.router = router
    this.serialControl = new ad.SerialControl({router: this.router, testFlag: testFlag, timeout: 50, debugTest: this.debugTest})
    this.Settings = new ui.ShowUser({
      value: [],
      type: ['output', 'link'],
    })
    // this.getFullObject().catch((err) => console.log(err))
    // console.log(obj)
    // Object.entries(obj).forEach(([key, value]) => {
    //
    // })
  }

  async getLoopVars(i) {
    // console.log(i)
    this.curObj = 'loops[' + i + '].loopVars'
    var command = this.commandString({obj: this.objName + this.delimiter + this.curObj})
    // command = 'getPV'
    var time
    var resp
    resp = await this.serialControl.serial(command)
    time = Date.now()
    if (!this.testFlag) {
      console.log(resp)
    }

    if (resp) {
      try {
        var respObj = JSON.parse(resp)
        this.processValue[i].value = respObj.pv
        this.processValue[i].units = respObj.pvUnits
        this.processValue[i].time = time

        this.setPoint[i].value = respObj.sp
        this.setPoint[i].units = respObj.pvUnits
        this.setPoint[i].time = time

        this.controllerOutput[i].value = respObj.co
        this.controllerOutput[i].time = time
      } catch (error) {
        console.log('loop vars error')
        console.log(error)
        throw error
      }
    }
    return
  }

  noRecentRequests(baseKey) {
    var sum = 0
    Object.values(this.frameRepeat[baseKey].keys).forEach(value => {
      sum += value
    })
    if (sum === 0) {
      // there have been no recent requests
      return true
    } else {
      return false
    }
  }

  clearRecentRequests(frameRepeatObject) {
    Object.keys(frameRepeatObject.keys).forEach(key => {
      frameRepeatObject.keys[key] = 0
    })
  }

  commandString({
    obj,
    set,
    // get = true,
    val,
  }) {
    if (set === undefined) {
      // default to get
      if (obj === undefined) {
        return 'get ' + this.objName + '\r'
      } else {
        return 'get ' + obj + '\r'
      }
    } else {
      if (val === undefined) {
        throw new Error('No value defined for set!')
      } else {
        if (obj === undefined) {
          return 'set ' + this.objName + ' ' + val + '\r'
        } else {
          return 'set ' + obj + ' ' + val + '\r'
        }
      }
    }
  }

  update() {
    this.getFullObject()
    this.respObj.loops.forEach((respObj, i) => {
      this.processValue[i].value = respObj.pv
      this.processValue[i].units = respObj.pvUnits
      // this.processValue[i].time = time

      this.setPoint[i].value = respObj.sp
      this.setPoint[i].units = respObj.pvUnits
      // this.setPoint[i].time = time

      this.controllerOutput[i].value = respObj.co
      // this.controllerOutput[i].time = time
    })
  }

  async getFullObject() {
    var resp
    var command = this.commandString({})
    console.log(command)
    // await this.serialControl.serialTx(command)
    resp = await this.serialControl.serial(command, true, 3000)
    resp = await this.serialControl.serial(command, true, 3000) // executed twice to ensure any serial line garbage is cleared
    console.log(resp)
    if (resp) {
      // parse json
      if (Array.isArray(resp)) {
        resp = resp.join('')
      }
      console.log(resp)
      try {
        var respObj = JSON.parse(resp)
        this.respObj = respObj
        console.log(respObj)
      } catch (error) {
        console.log('get full object error')
        console.log(error)
        throw error
      }
    }
    return
  }

  detectType(obj) {
    var typeStr
    if (ui.sameType(obj, new ad.DataPoint({}))) {
      typeStr = this.detectType(obj.value)
    } else {
      if (typeof obj === 'number') {
        // console.log('number')
        typeStr = 'number'
      } else if (typeof obj === 'string') {
        // console.log('string')
        typeStr = 'string'
      } else if (typeof obj === 'boolean') {
        // console.log('boolean')
        typeStr = 'binary'
      } else if (typeof obj === 'object') {
        // console.log('object')
        typeStr = 'object'
      } else {
        console.log('Could not find object type')
        console.log(typeof obj)
        console.log(obj)
        // throw new Error('Could not find object type')
      }
    }
    return typeStr
  }

  frameAssign(baseObject, baseKey, respObj, key, time) {
    if (this.frameRepeat[baseKey] === undefined) {
      if (Object.prototype.hasOwnProperty.call(baseObject[key + 'hidden'], 'value')) {
        baseObject[key + 'hidden'].value = respObj[key]
        baseObject[key + 'hidden'].time = time
      } else {
        baseObject[key + 'hidden'] = respObj[key]
      }
    } else {
      Object.keys(this.frameRepeat[baseKey].keys).forEach(fkey => {
        if (Object.prototype.hasOwnProperty.call(baseObject[fkey + 'hidden'], 'value')) {
          baseObject[fkey + 'hidden'].value = respObj[fkey]
          baseObject[fkey + 'hidden'].time = time
        } else {
          baseObject[fkey + 'hidden'] = respObj[fkey]
        }
      })
      if (this.frameRepeat[baseKey].timer !== undefined) {
        clearTimeout(this.frameRepeat[baseKey].timer)
      }
      this.frameRepeat[baseKey].timer = setTimeout(() => {
        this.clearRecentRequests(this.frameRepeat[baseKey])
      }, this.rrTimeout)
    }
  }

  async getObject(baseKey, baseObject, key) {
    if (this.frameRepeat[baseKey].keys[key] === 1 || this.noRecentRequests(baseKey)) {
      this.frameRepeat[baseKey].keys[key] = 1
    } else {
      return
    }
    // console.log(i)
    console.log('Getting object')
    // command = 'getPV'
    var time
    var resp
    var command = this.commandString({obj: baseKey})
    console.log(command)
    // await this.serialControl.serialTx(command)
    resp = await this.serialControl.serial(command, true)
    time = Date.now()
    // console.log(resp)
    if (resp === undefined) {
      throw new Error('Resp undefined')
    } else {
      // console.log(resp)
      if (Array.isArray(resp)) {
        resp = resp.join('')
      }
      console.log(resp)
      try {
        var respObj = JSON.parse(resp)
        console.log(respObj)
        this.frameAssign(baseObject, baseKey, respObj, key, time)
      } catch (error) {
        console.log('get full object error')
        console.log(error)
        throw error
      }
    }
    return
  }

  async setObject(baseKey, baseObject, key, val) {
    // console.log(i)
    console.log('Setting object')
    // command = 'getPV'
    var time
    var resp
    var command = this.commandString({obj: baseKey + this.delimiter + key, val: val, set: true})
    console.log(command)
    // await this.serialControl.serialTx(command)
    resp = await this.serialControl.serial(command, true)
    time = Date.now()
    // console.log(resp)
    if (resp === undefined) {
      throw new Error('Resp undefined')
    } else {
      // console.log(resp)
      if (Array.isArray(resp)) {
        resp = resp.join('')
      }
      console.log(resp)
      try {
        var respObj = JSON.parse(resp)
        console.log(respObj)
        this.frameAssign(baseObject, baseKey, respObj, key, time)
      } catch (error) {
        console.log('get full object error')
        console.log(error)
        throw error
      }
    }
    return
  }

  define(key, value, baseKey, baseObject) {
    var type = this.detectType(value)
    // console.log(baseKey)
    // console.log(key)
    // console.log(type)
    // console.log(value)
    if (type !== undefined) {
      if (type === 'object') {
        if (Array.isArray(baseObject)) {
          baseKey = baseKey + '[' + key + ']'
        } else {
          baseKey = baseKey + this.delimiter + key
        }

        if (Array.isArray(value)) {
          Object.defineProperty(baseObject, key, {
            writable: true,
            enumerable: true,
            value: [],
          })
        } else {
          Object.defineProperty(baseObject, key, {
            writable: true,
            enumerable: true,
            value: {},
          })
        }

        Object.entries(value).forEach(([newKey, newValue]) => {
          console.log(baseKey + ' ' + newKey)
          this.define(newKey, newValue, baseKey, baseObject[key])
        })
      } else {
        if (type === 'binary') {
          baseObject[key + 'hidden'] = value
        } else {
          baseObject[key + 'hidden'] = new ad.DataPoint({value: value})
        }
        if (Object.prototype.hasOwnProperty.call(this.frameRepeat, baseKey)) {
          this.frameRepeat[baseKey].keys[key] = 0
        } else {
          this.frameRepeat[baseKey] = {keys: {}, timer: undefined}
          this.frameRepeat[baseKey].keys[key] = 0
        }
        Object.defineProperty(baseObject, key, {
          enumerable: true,
          get: () => {
            this.getObject(baseKey, baseObject, key).catch(error => {
              console.log(error)
            })
            return (baseObject[key + 'hidden'])
          },
          set: val => {
            console.log('Executing set function for ' + key)
            if (!Object.prototype.hasOwnProperty.call(baseObject[key + 'hidden'], 'units')) {
              // if the object does not have the field 'units', it must be binary;
              // convert val to 1 or 0
              if (val) {
                val = 1
              } else {
                val = 0
              }
            }
            this.setObject(baseKey, baseObject, key, val).catch(error => {
              console.log(error)
            })
          },
        })
        var loopsPart
        loopsPart = baseKey.match(/loops\[\d+\]/g)
        if (loopsPart !== null) {
          var loopNum
          loopNum = this.findArrayNumber(loopsPart)
          this.defineAbstraction(baseObject, key, {loopNum: loopNum})
        }
        var trapsPart
        trapsPart = baseKey.match(/traps\[\d+\]/g)
        if (trapsPart !== null) {
          var trapNum
          trapNum = this.findArrayNumber(trapsPart)
          console.log('trapNum: ' + trapNum)
          this.defineAdditionalFieldsTraps(baseObject, key, {trapNumber: trapNum}, type)
        }
      }
    }
  }

  findArrayNumber(strArray) {
    var arrayNum
    var arrayStrNum
    if (strArray !== null) {
      // console.log('strArray')
      // console.log(strArray)
      arrayStrNum = strArray[0].match(/\d+/g)
      // console.log('arrayStrNum')
      // console.log(arrayStrNum)
      if (arrayStrNum !== null) {
        arrayNum = Number(arrayStrNum[0])
        if (isNaN(arrayNum)) {
          arrayNum = undefined
        }
      }
    }
    return arrayNum
  }

  defineAdditionalFieldsTraps(baseObject, key, args, type) {
    var trapNum = 0
    if (args !== undefined) {
      if (args.trapNumber !== undefined) {
        trapNum = args.trapNumber
      }
    }
    if (!Object.prototype.hasOwnProperty.call(this, 'AdditionalFields')) {
      Object.defineProperty(this, 'AdditionalFields', {
        writable: true,
        enumerable: true,
        value: {},
      })
    }
    // guarantee uniqueness of new key
    if (Object.prototype.hasOwnProperty.call(this.AdditionalFields, 'trap ' + trapNum.toString() + ' ' + key)) {
      console.log('non-unique field')
      return
    }
    console.log(key)
    console.log(type)
    if (type === 'binary') {
      // something
    } else {
      type = 'datapoint'
    }
    Object.defineProperty(this.AdditionalFields, 'trap ' + trapNum.toString() + ' ' + key, {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: baseObject[key], type: ['output', type]})
      },
      set: val => {
        console.log('Executing top set function for ' + key)
        if (typeof val === 'boolean') {
          if (val) {
            baseObject[key] = 1
          } else {
            baseObject[key] = 0
          }
        } else {
          baseObject[key] = val
        }
      },
    })
  }

  defineAbstraction(baseObject, key, args) {
    var loopNum = 0
    if (args !== undefined) {
      if (args.loopNum !== undefined) {
        loopNum = args.loopNum
      }
    }
    var units
    if (Object.prototype.hasOwnProperty.call(baseObject, 'pvUnitshidden')) {
      units = baseObject.pvUnitshidden.value
    }
    if (key === 'sp') {
      console.log('Reassigning sp loopNum: ' + loopNum.toString())
      console.log(args)
      if (units !== undefined) {
        baseObject[key + 'hidden'].units = units
      }

      // define getter/setter with abstract names
      Object.defineProperty(this, 'SP' + loopNum.toString(), {
        enumerable: true,
        get: () => {
          return baseObject[key]
        },
        set: val => {
          baseObject[key] = val
        },
      })
    } else if (key === 'pv') {
      console.log('Reassigning pv loopNum: ' + loopNum.toString())
      console.log(args)
      if (units !== undefined) {
        baseObject[key + 'hidden'].units = units
      }
      // define getter/setter with abstract names
      Object.defineProperty(this, 'PV' + loopNum.toString(), {
        enumerable: true,
        get: () => {
          return baseObject[key]
        },
        set: val => {
          baseObject[key] = val
        },
      })
    } else if (key === 'co') {
      console.log('Reassigning co loopNum: ' + loopNum.toString())
      console.log(args)
      if (units !== undefined) {
        baseObject[key + 'hidden'].units = 'ms'
      }
      // define getter/setter with abstract names
      Object.defineProperty(this, 'CO' + loopNum.toString(), {
        enumerable: true,
        get: () => {
          return baseObject[key]
        },
        set: val => {
          baseObject[key] = val
        },
      })
    } else {
      // none of the three
    }
  }

  generateSettings() {
    // generates a link object based off the loops for PID tuning and other
    // loop parameters
    var services = []
    if (this.loops === undefined) {
      return
    }
    Object.entries(this.loops).forEach(([key, value]) => {
      // e.g. key = '0', value = [ Object ]
      var subservice = {}
      subservice[key] = {'Loop Index': key, datastreams: {refreshRate: 1000}}
      var updateable = []
      Object.entries(value).forEach(([loopKey, loopValue]) => {
        var type = this.detectType(loopValue)
        // console.log(baseKey)
        // console.log(key)
        // console.log(type)
        // console.log(value)
        if (type !== undefined) {
          if (type === 'object') {
            Object.entries(loopValue).forEach(([subKey, subValue]) => {
              var io = 'output'
              if (subKey === 'sp' || subKey === 'co' || subKey === 'pv') {
                io = 'input'
              }
              if (!subKey.endsWith('hidden')) {
                var dpType
                if (Object.prototype.hasOwnProperty.call(subValue, 'value')) {
                  dpType = 'datapoint'
                } else {
                  dpType = this.detectType(subValue)
                }
                Object.defineProperty(subservice[key], subKey, {
                  enumerable: true,
                  get: () => {
                    return (new ui.ShowUser({value: loopValue[subKey], type: [io, dpType]}))
                  },
                  set: val => {
                    loopValue[subKey] = val
                  },
                })
                if (io === 'output') {
                  updateable.push(subKey)
                }
              }
            })
          } else {
            if (!loopKey.endsWith('hidden')) {
              Object.defineProperty(subservice[key], loopKey, {
                enumerable: true,
                get: () => {
                  return (new ui.ShowUser({value: value[loopKey], type: ['output', 'datapoint']}))
                },
                set: val => {
                  value[loopKey] = val
                },
              })
            }
          }
        }
      })
      subservice[key].updateable = updateable
      var subObj = {id: 'Loop ' + key, obj: subservice} // path left undefined for now
      services.push(subObj)
    })
    this.Settings.value = services
    this.emit('settingsAvailable')
  }

  async initialize() {
    console.log('Getting full object')
    console.log('Test flag')
    console.log(this.testFlag)
    await this.getFullObject()
    var baseKey = this.objName
    var baseObject = this
    console.log('Defining full object')
    Object.entries(this.respObj).forEach(([key, value]) => {
      this.define(key, value, baseKey, baseObject)
    })
    this.emit('initialized')
    console.log('Generating Settings')
    this.generateSettings()
    return
  }
}

module.exports = {
  Device: ArduinoController,
}

// setTimeout(() => {
//   var router = new ad.Router({portPath: '/dev/tty.usbmodem1432201', testFlag: false, baud: 57600, delimiter: '\r\n', maxQueueLength: 400, manufacturer: 'Arduino (www.arduino.cc)', seriallineSerial: '957303339373510191F1'})
//   var a = new ArduinoController({router: router, testFlag: false, debugTest: true})
//   console.log(a)
//   a.once('settingsAvailable', () => {
//     // console.log(JSON.stringify(a.Settings.value[0].obj))
//     console.log(a.frameRepeat)
//   })
//   a.once('initialized', () => {
//     console.log(a)
//     setInterval(() => {
//       console.log(a.CO0)
//       console.log(a.SP0)
//       console.log(a.PV0)
//     }, 500)
//   })
//   // setTimeout(() => {
//   //   a.initialize()
//   // },2000)
//
//   // setTimeout(() => {
//   //   console.log(a)
//   // },5000)
//   if (router.open) {
//     setTimeout(() => {
//       a.initialize().catch((e) => {})
//     }, 2000)
//
//   } else {
//     router.once('open', () => {
//       setTimeout(() => {
//         a.initialize().catch((e) => {})
//       }, 2000)
//     })
//   }
// },4000)
