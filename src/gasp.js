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
const ad = require('./abstract-driver.js')
const bkup = require('./backup.js')

var gaspID = 'GASP'
var gaspPath = 'config/' + gaspID
var gaspMap = {
  0: {},
}

class GASP {
  constructor({portName = 'COM1', id = 0, testFlag = false, Description = '', Details = ''}) {
    this.ID = new ui.ShowUser({value: id.toString()})
    this.datastreams = {refreshRate: 1000}
    this.updateable = ['Port', 'Status']
    this.Description = new ui.ShowUser({value: Description})
    this.Details = new ui.ShowUser({value: Details})
    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    Object.defineProperty(this, 'portPath', {
      writable: true,
      value: portName,
    })
    this.Status = new ui.ShowUser({value: 'Disconnected', type: ['input', 'string']})
    Object.defineProperty(this, 'r', {
      writable: true,
      value: new ad.Router({portPath: this.portPath, testFlag: true}),
    })
    Object.defineProperty(this, 's', {
      writable: true,
      value: new ad.SerialControl({router: this.r, timeout: 1000}),
    })
    Object.defineProperty(this, 'Connect', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.connect()
        res.send()
      },
    })
    Object.defineProperty(this, 'Disconnect', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.disconnect()
        res.send()
      },
    })
    this['Single Tube'] = new ui.ShowUser({value: 0, type: ['output', 'number']})
    this.Info = new ui.ShowUser({value: '', type: ['input', 'string']})
    Object.defineProperty(this, 'Desorb', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.desorb(this['Single Tube'].value)
        res.send()
      },
    })
    Object.defineProperty(this, 'Read Info', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.readTubeInfo(this['Single Tube'].value)
        res.send()
      },
    })
    this['Multi Tube Start'] = new ui.ShowUser({value: 0, type: ['output', 'number']})
    this['Multi Tube End'] = new ui.ShowUser({value: 1, type: ['output', 'number']})
    Object.defineProperty(this, 'Condition Multiple', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.conditionTube(this['Multi Tube Start'].value, this['Multi Tube End'].value)
        res.send()
      },
    })
    Object.defineProperty(this, 'Port', {
      enumerable: true,
      get: function () {
        return (new ui.ShowUser({value: this.portPath, type: ['output', 'list']}))
      },
      set: function (val) {
        console.log('New Port')
        console.log(val)
        this.portPath = val
      },
    })
    Object.defineProperty(this, 'Portlist', {
      get: function () {
        return this.r.PortList
      },
    })
  }

  async connect() {
    this.Status.value = 'Connecting...'
    this.r.reopen({portPath: this.portPath, testFlag: false})
    if (this.r.open) {
      this.Status.value = 'Connected'
    } else {
      this.r.once('open', () => {
        this.Status.value = 'Connected'
      })
    }
  }

  async disconnect() {
    if (this.r.open) {
      this.r.close()
    }
    this.Status.value = 'Disconnected'
  }

  async desorb(tubeNumber) {
    // '''Desorb a single tube'''
    // var time
    var resp
    try {
      var command = 'DESORB,D,' + tubeNumber.toString() + '\r'
      console.log('command: ')
      console.log(command)
      resp = await this.serialControl.serial(command)
    } catch (error) {
      this.Status.value = error
      console.log(error)
      return
    }
    console.log('resp')
    console.log(resp[0].length)
    console.log(resp[0])
    if (resp !== undefined) {
      resp = resp[0]
      var parts = resp.split(',')
      if (parts[parts.length - 1] === 'ACK') {
        this.Status.value = 'Desorbing ' + tubeNumber.toString()
        // settimeout to change status after a while? Maybe give a timestamp in the status?
      } else {
        this.Status.value = 'NACK'
      }
    }
  }

  async readTubeInfo(tubeNumber) {
    // '''Get metadata for a given tube. The GASP plans to support this eventually.'''
    // var time
    var resp
    try {
      var command = 'DESORB,I,' + tubeNumber.toString() + '\r'
      console.log('command: ')
      console.log(command)
      resp = await this.serialControl.serial(command)
      // time = Date.now()
    } catch (error) {
      this.Status.value = error
      console.log(error)
      return
    }
    console.log('resp')
    console.log(resp[0].length)
    console.log(resp[0])
    if (resp !== undefined) {
      resp = resp[0]
      var parts = resp.split(',')

      if (parts[parts.length - 1] === 'ACK') {
        var reply = this.r.readline()
        parts =  reply.split(',')
        this.Status.value = 'Reading Info for ' + tubeNumber.toString()
        this.Info.value = parts.slice(3).join(' ')
      } else {
        this.Status.value = 'NACK'
      }
    }
  }

  async conditionTube(tubeStart, tubeStop) {
    // ''' Condidtion a series of tubes beginning at tubeStart and ending at tubeStop'''
    // var time
    var resp
    try {
      var command = 'DESORB,C,' + tubeStart.toString() + ',' + tubeStop.toString() + '\r'
      console.log('command: ')
      console.log(command)
      resp = await this.serialControl.serial(command)
      // time = Date.now()
    } catch (error) {
      this.Status.value = error
      console.log(error)
      return
    }
    console.log('resp')
    console.log(resp[0].length)
    console.log(resp[0])
    if (resp !== undefined) {
      resp = resp[0]
      var parts = resp.split(',')
      if (parts[parts.length - 1] === 'ACK') {
        this.Status.value = 'Conditioning ' + tubeStart.toString() + ' to ' + tubeStop.toString()
        // settimeout to change status after a while? Maybe give a timestamp in the status?
      } else {
        this.Status.value = 'NACK'
      }
    }
  }
}

module.exports = {
  initialize: function (test) {
    console.log('intializing gasp interface')

    if (bkup.configExists(gaspPath)) {
      // this should eventually be in a try-catch with a default config
      var loadMap = bkup.load(gaspPath)
      Object.entries(loadMap).forEach(([key, value]) => {
        // specify bare-minimum amount that the config should have
        if (value.ID === undefined) {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value.ID')
          console.log(value)
        } else {
          console.log(key)
          gaspMap[key] = new GASP({
            id: value.ID.value,
            portName: value.Port.value,
            testFlag: test,
            Description: value.Description.value,
            Details: value.Details.value,
          })
        }
      })
    } else {
      // re-write gaspMap object into object of MFC classes
      Object.entries(gaspMap).forEach(([key]) => {
        gaspMap[key] = new GASP({id: key, testFlag: test, portName: 'NONE'})
        // this one is useful for debugging
        bkup.save(gaspMap[key], gaspPath)
        // console.log(gaspMap[key])
      })
    }
    console.log(gaspMap)
  },
  id: gaspID,
  obj: gaspMap,
  path: gaspPath,
}
