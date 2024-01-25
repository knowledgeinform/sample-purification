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
const assert = require('assert').strict
const fs = require('fs')

class TimelineEvent {
  constructor({call = 'api', time = 60, value = ''}) {
    this.call = call
    this.value = value
    this.time = time
  }
}

var modesID = 'modes'
var modesPath = 'config/' + modesID

class Timeline {
  constructor({services, id, events = [], description = '', server}) {
    this.Mode = new ui.ShowUser({value: id})

    this.Description = new ui.ShowUser({value: description})
    // var options = this.generateOptions(services)
    var options
    Object.defineProperty(this, 'services', {
      writable: true,
      value: services,
    })
    Object.defineProperty(this, 'server', {
      writable: true,
      value: server,
    })
    /**
      get -- should return the button
      post -- should push an event onto the sequence
    */
    Object.defineProperty(this, 'Add Event', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'formlist', data: {element: new TimelineEvent({}), options: options}}), type: ['output', 'button']}))
      },
      set: ({res, body}) => {
        var e = JSON.parse(body)
        // replicates what happens during a POST
        if (this.lint(e.call)) {
          e.value = JSON.stringify(e.value)
          this.Sequence.value.push(e)
          bkup.save(this, modesPath)
        }
        res.send()
        // res.json(this.Sequence)
      },
    })
    Object.defineProperty(this, 'Delete Event', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'formeventlist', data: this.Sequence.value}), type: ['output', 'button']}))
      },
      set: ({res, body}) => {
        var eIndex = JSON.parse(body)
        // replicates what happens during a POST
        eIndex.forEach(item => {
          if (item < this.Sequence.value.length) {
            this.Sequence.value.splice(item, 1)
          }
        })
        bkup.save(this, modesPath)
        res.send()
        // res.json(this.Sequence)
      },
    })
    Object.defineProperty(this, 'Export', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        var contents = ''
        Object.keys(this.Sequence.value[0]).forEach(item => {
          contents = contents.concat(item, ',')
        })
        contents = contents.concat('\n')
        this.Sequence.value.forEach(item => {
          contents = contents.concat(item.call, ',', item.value, ',', item.time, '\n')
        })
        console.log(contents)
        fs.writeFileSync(modesPath + this.Mode.value.toString() + '.csv', contents)
        res.json({type: ['nothing']})
        // res.json(this.Sequence)
      },
    })
    Object.defineProperty(this, 'Import', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        var contents
        try {
          contents = fs.readFileSync(modesPath + this.Mode.value.toString() + '.csv', 'utf8')
        } catch (error) {
          console.log('Read file error')
          console.log(error)
          console.log('Expected relative path and file name')
          console.log(modesPath + this.Mode.value.toString() + '.csv')
        }
        if (contents !== undefined) {
          var lines = contents.split('\n')
          var seqEvents = []
          for (var lineIndex = 1; lineIndex < lines.length; lineIndex++) {
            var objContents = lines[lineIndex].split(',')
            if (objContents.length === 3) {
              var obj = {call: objContents[0], value: objContents[1], time: Number(objContents[2])}
              if (this.lint(obj.call)) seqEvents.push(obj)
            }
          }
          if (seqEvents.length > 0) {
            console.log(seqEvents)
            console.log(this.Sequence.value)
            this.Sequence.value = seqEvents
            // this.Sequence.value = seqEvents
          }
        }
        res.json({type: ['nothing']})
        // res.json(this.Sequence)
      },
    })
    this.State = new ui.ShowUser({value: 'Stopped', type: ['input', 'string']})
    this.datastreams = {refreshRate: 300}
    this.updateable = []
    Object.defineProperty(this, 'Start-Pause', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        this.startPause()
        res.json(this['Start-Pause'])
      },
    })
    Object.defineProperty(this, 'Stop', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        // clear all timers
        this.stopTimers()
        res.json(this.Stop)
      },
    })
    Object.defineProperty(this, 'timers', {
      writable: true,
      value: [],
    })
    Object.defineProperty(this, 'executingEvents', {
      writable: true,
      value: [],
    })
    Object.defineProperty(this, 'longestTime', {
      writable: true,
      value: new ad.DataPoint({value: 0, units: 's'}),
    })
    Object.defineProperty(this, 'execTime', {
      writable: true,
      value: new ad.DataPoint({value: 0, units: 's'}),
    })
    Object.defineProperty(this, 'startTime', {
      writable: true,
      value: Date.now(),
    })
    Object.defineProperty(this, 'pauseTime', {
      writable: true,
      value: Date.now(),
    })
    Object.defineProperty(this, 'Duration', {
      enumerable: true,
      get: () => {
        this.longestTime.value = this.findLongest()
        return (new ui.ShowUser({value: this.longestTime, type: ['input', 'datapoint']}))
      },
    })
    Object.defineProperty(this, 'Time', {
      enumerable: true,
      get: () => {
        this.execTime.value = this.calculateExecTime()
        return (new ui.ShowUser({value: this.execTime, type: ['input', 'datapoint']}))
      },
    })

    this.Sequence = new ui.ShowUser({value: events, type: ['output', 'timeline']})
    if (this.Sequence.value.length === 0) {
      this.Sequence.value.push(new TimelineEvent({call: 'api/' + modesID + '/' + id + '/Stop', time: 5}))
    }
  }

  startPause() {
    if (this.State.value === 'Playing') {
      this.pause()
    } else {
      this.start()
    }
  }

  pause() {
    // allows us to use execTime in calculating a relative startTime on resume
    this.execTime.value = this.calculateExecTime()
    // async, pause sequence of events
    this.pauseTimers()
  }

  start() {
    // async, begin sequence of events
    this.startTimers()
  }

  stop() {
    this.stopTimers()
  }

  findLongest() {
    var longestTime = 0
    this.Sequence.value.forEach(item => {
      if (item.time > longestTime) {
        longestTime = item.time
      }
    })
    return longestTime
  }

  findSubObj(callkey, obj) {
    var retObj
    if (obj === undefined || obj === null) {
      return undefined
    }
    // console.log('find subobj')
    Object.entries(obj).forEach(([key, value]) => {
      // console.log(key)
      if (callkey === key) {
        retObj = value
      }
    })
    return retObj
  }

  lint(call) {
    if (call === undefined || call === null) {
      return false
    }
    var callParts = call.split('/')
    // console.log(callParts)
    // callParts[0] == 'api'
    var topObj
    // var path
    // var serviceIndex
    this.services.forEach(item => {
      // console.log(item.id)
      if (item.id === callParts[1]) {
        // serviceIndex = i
        topObj = item.obj
        // path = item.path
      }
    })
    if (topObj === undefined) {
      return false
    }
    // console.log(topObj)
    var componentObj = this.findSubObj(callParts[2], topObj) // e.g. valves -> 0
    // console.log(componentObj)
    var paramObj = this.findSubObj(callParts[3], componentObj) // e.g. valves -> 0 -> State
    // console.log(paramObj)
    if (paramObj === undefined) {
      console.log('Invalid API call!')
      console.log('NOT EXECUTING!')
      console.log(call)
      return false
    }
    return true
  }

  postVal(call, val) {
    var callParts = call.split('/')
    // console.log(callParts)
    // callParts[0] == 'api'
    var topObj
    // var path
    var serviceIndex
    this.services.forEach((item, i) => {
      // console.log(item.id)
      if (item.id === callParts[1]) {
        serviceIndex = i
        topObj = item.obj
        // path = item.path
      }
    })
    // console.log(topObj)
    var componentObj = this.findSubObj(callParts[2], topObj) // e.g. valves -> 0
    // console.log(componentObj)
    var paramObj = this.findSubObj(callParts[3], componentObj) // e.g. valves -> 0 -> State
    // console.log(paramObj)
    if (paramObj === undefined) {
      console.log('Invalid API call!')
      console.log('NOT EXECUTING!')
      console.log(call)
      console.log(val)
      return
    }
    this.server.handlePost({
      key: callParts[2],
      value: componentObj,
      subkey: callParts[3],
      subvalue: paramObj,
      service: this.services[serviceIndex],
      body: val,
      res: {
        send: () => {},
        json: () => {},
        status: () => {
          console.log('Mode Post Error')
          return {
            send: error => {
              console.log(error)
            },
          }
        },
      },
      basePath: '', // note: this would need to be filled in to use links
    })
  }

  calculateExecTime() {
    if (this.State.value === 'Playing') {
      return (Date.now() - this.startTime) / 1000 // ms --> s
    } else {
      // either stopped or paused
      if (this.State.value === 'Stopped') {
        return 0
      } else {
        // paused
        return (this.pauseTime - this.startTime) / 1000 // ms --> s
      }
    }
  }

  startTimers() {
    console.log('Starting sequence: ' + this.Mode.value)
    var eq
    try {
      assert.deepStrictEqual(this.executingEvents, this.Sequence.value)
      eq = true
    } catch (error) {
      console.log('Executing Sequence does not equal object sequence')
      eq = false
      // ensure everything's stopped
      this.stopTimers()
      // remove old timer's (in case they weren't already removed)
      this.timers = []
      Object.assign(this.executingEvents, this.Sequence.value)
    }
    console.log('eq')
    console.log(eq)
    this.startTime = Date.now() - (this.execTime.value * 1000) // if coming off of a stopped, execTime.value == 0
    this.Sequence.value.forEach((seqEvent, i) => {
      if (eq) {
        console.log('t executed')
        console.log(this.timers[i].executed)
        if (!this.timers[i].executed) {
          this.timers[i].timer = setTimeout(() => {
            // app.post seqEvent.call seqEvent.value
            console.log('posting from resume/start')
            console.log(seqEvent.call)
            console.log(seqEvent.value)
            this.timers[i].executed = true
            this.postVal(seqEvent.call, seqEvent.value)
          }, this.timers[i].remaining)
          this.timers[i].startTime = Date.now()
        }
      } else {
        // make new list
        this.timers.push({
          executed: false,
          timer: setTimeout(() => {
            // app.post seqEvent.call seqEvent.value
            console.log('posting')
            console.log(seqEvent.call)
            console.log(seqEvent.value)
            this.timers[i].executed = true
            this.postVal(seqEvent.call, seqEvent.value)
          }, seqEvent.time * 1000),
          startTime: Date.now(),
          remaining: seqEvent.time * 1000,
        })
      }
    })
    this.State.value = 'Playing'
  }

  pauseTimers() {
    console.log('Pausing sequence: ' + this.Mode.value)
    this.pauseTime = Date.now()
    for (var t of this.timers) {
      clearTimeout(t.timer)
      t.remaining -= (Date.now() - t.startTime)
      console.log('Remaining: ' + (t.remaining / 1000).toString() + ' s')
    }
    this.State.value = 'Paused'
  }

  stopTimers() {
    console.log('Stopping sequence: ' + this.Mode.value)
    this.execTime.value = 0 // slightly redunant (see calculateExecTime), but good protection
    for (var t of this.timers) {
      clearTimeout(t.timer)
      t.executed = false
    }
    var eq
    try {
      assert.deepStrictEqual(this.executingEvents, this.Sequence.value)
      eq = true
    } catch (error) {
      console.log('Executing Sequence does not equal object sequence')
      eq = false
    }
    console.log('eq')
    console.log(eq)
    if (eq) {
      this.timers.forEach((t, i) => {
        t.remaining = this.Sequence.value[i].time * 1000
      })
    } else {
      this.timers = []
    }
    this.State.value = 'Stopped'
  }
}

var modesMap = {}

module.exports = {
  initialize: async function (test, services, serverInstance) {
    console.log('intializing modes')
    if (bkup.configExists(modesPath)) {
      var loadMap = bkup.load(modesPath)
      console.log('Loading from files')
      Object.entries(loadMap).forEach(([key, value]) => {
        if (value.Mode === undefined) {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value.Mode')
          console.log(value)
        } else {
          console.log(key)
          modesMap[value.Mode.value] = (new Timeline({
            services: services,
            id: value.Mode.value,
            server: serverInstance,
          }))
          if (value.Sequence !== undefined) {
            modesMap[value.Mode.value].Sequence.value = value.Sequence.value
          }
          if (value.Description !== undefined) {
            modesMap[value.Mode.value].Description.value = value.Description.value
          }
        }
      })
    } else {
      for (var i = 1; i <= 5; i++) {
        // modesMap.push(new Timeline({services: services, id: i}))
        modesMap[i.toString()] = (new Timeline({
          services: services,
          id: i,
          server: serverInstance,
        }))
        bkup.save(modesMap[i.toString()], modesPath)
      }
    }
    //
    return modesMap
  },
  id: modesID,
  obj: modesMap,
  Timeline: Timeline,
  path: modesPath,
}
