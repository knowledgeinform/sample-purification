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

// const NodeSSH = require('node-ssh')
var EventEmitter = require('events')
const Client = require('ssh2').Client
const ui = require('./ui.js')
const ad = require('./abstract-driver.js')
const bkup = require('./backup.js')
const rpio = require('rpio')

var desorbID = 'Desorber'
var desorbPath = 'config/' + desorbID
var desorbMap = {
  0: {},
}

class DesorberEvents extends EventEmitter {
  constructor({
    testFlag = false,
    DesorberSerial = 2,
    GASPserial = 2,
    services,
    serialPort,
    extraPreHeatDelay = 2,
    tubeRange = '1-10',
    autoExecMode = 'NONE',
  }) {
    super()
    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    this.on('error', error => {
      console.log('Error:')
      console.log(error)
    })
    this.DesorberSerial = DesorberSerial
    this.GASPserial = GASPserial
    this.CommandReady = false
    this.preheatDelay = extraPreHeatDelay
    this.address = '192.168.1.101'
    this.port = 22
    this.username = 'root'
    this.password = 'SkyFall1!'
    this.connectionTimeout = 30000
    this.strRange = tubeRange
    this.rangeGroups = this.validRange(this.strRange)
    this.services = services
    this.gcReadyPin = 8 // Rpi 3 hardware pin
    this.gcStartPin = 10 // Rpi 3 hardware pin
    this.initializePins()
    this.secondTrapFired = false
    this.serialPort = serialPort
    this.compressed = false
    this.connected = false
    this.stayConnected()
    this.userSelectedMode = autoExecMode
    this.userExit = false
    console.log('Range Groups')
    console.log(this.rangeGroups)
  }

  stayConnected() {
    setInterval(() => {
      if (!this.connected) {
        this.connect()
      }
    }, this.connectionTimeout + 2000)
  }

  validRange(val) {
    return val.match(/^(?!([ \d]*-){2})\d+(?: *[-,] *\d+)*$/g)
  }

  get StringRange() {
    return this.strRange
  }

  set StringRange(val) {
    // check val
    var tempGroups = this.validRange(val)
    if (tempGroups !== null) {
      this.strRange = val
      this.rangeGroups = tempGroups
      console.log('Range Groups')
      console.log(this.rangeGroups)
    }
  }

  process(d) {
    d = d.toString()
    console.log(d)
    if (d.includes('Hit <ENTER> to Continue')) {
      console.log('Found enter')
      this.emit('EnterRequest', d)
    }
    if (d.includes('Enter DESORBER SERIAL NUMBER')) {
      console.log('Found serial')
      this.emit('DesorberSerialRequst', d)
    }
    if (d.includes('Enter GASP SERIAL NUMBER')) {
      console.log('Found gasp')
      this.emit('GASPSerialRequst', d)
    }
    if (d.includes('MAIN  MENU')) {
      console.log('Emitting main menu ready event')
      this.emit('MainMenuReady', d)
      this.CommandReady = true
    }
    if (d.includes('Enter Extra Pre Heat Delay in Seconds')) {
      console.log('Found pre heat delay')
      this.emit('PreheatDelay', d)
    }
    if (d.includes('Hit <Enter> to WAIT FOR BNL ...')) {
      console.log('Found WAIT FOR BNL')
      this.emit('AutoReady', d)
    }
  }

  setUpResponses() {
    this.once('EnterRequest', () => {
      // 'hit enter'
      console.log('Hitting Enter')
      this.stream.write('\n')
    })

    this.once('DesorberSerialRequst', () => {
      console.log('Entering Desorber Serial #' + this.DesorberSerial)
      this.stream.write(this.DesorberSerial + '\n')
    })

    this.once('GASPSerialRequst', () => {
      console.log('Entering GASP Serial #' + this.GASPserial)
      this.stream.write(this.GASPserial + '\n')
    })
  }

  clearResponses() {
    this.removeAllListeners('EnterRequest')
    this.removeAllListeners('DesorberSerialRequst')
    this.removeAllListeners('GASPSerialRequst')
    this.removeAllListeners('PreheatDelay')
    this.removeAllListeners('AutoReady')
  }

  async connect() {
    console.log('Desorber: ' + this.DesorberSerial.toString() + ' GASP: ' + this.GASPserial.toString())
    // create a new client on each connection to not have to clear all the event listeners on closing
    this.client = new Client()
    // handle the 'error' event since the client code doesn't handle it itself
    // and it will kill the process if we don't
    this.client.on('error', error => {
      console.log('Client Error')
      console.log(error)
      this.emit('error', error)
    })

    this.setUpResponses()
    this.client.once('error', () => {
      this.clearResponses()
    })
    try {
      this.client.on('ready', function () {
        this.emit('connected')
        console.log('Client :: ready')
        this.client.shell(function (err, stream) {
          if (err) throw err
          this.stream = stream
          this.connected = true
          this.stream.on('close', function () {
            console.log('Stream :: close')
            this.client.end()
            this.emit('Closed')
          }.bind(this)).on('data', this.process.bind(this))
          this.stream.write('cd /comix\n')
          this.stream.write('python desorb.py\n')
        }.bind(this))
      }.bind(this))
      this.client.connect({
        host: this.address,
        port: this.port,
        username: this.username,
        password: this.password,
        readyTimeout: this.connectionTimeout,
      })
      return Promise.resolve()
    } catch (error) {
      this.clearResponses()
      this.emit('error', error)
      return Promise.reject(error)
    }
  }

  async automode() {
    this.userExit = false
    if (!this.CommandReady) {
      throw new Error('Desorber not ready')
    }
    this.once('PreheatDelay', () => {
      console.log('Entering extra preheat delay: ' + this.preheatDelay + ' s')
      this.stream.write(this.preheatDelay + '\n')
    })
    this.once('AutoReady', () => {
      console.log('Hitting ENTER to start automode with SPS')
      this.stream.write('\n')
      this.waitForGCready().then(() => {
        this.emit('status', 'GC is ready; click Begin to start desorbing the tubes')
      })
    })
    this.stream.write('A\n')

    return
  }

  beginWrapper() {
    this.beginFiring().catch(error => {
      console.log('Firing error')
      console.log(error)
      // cancel the automode and try to exit the program
      // this.stream.write('\x03')
      this.emit('status', 'Error in Automade; connected but not ready: ' + error)
    })
  }

  stopFiring() {
    this.userExit = true
    if (this.serialPort.router.portPath === 'NONE') {
      console.log('Automode Error: No Serial Port Connected')
    }
    // do something with serial

    // stop the automode execute routine
    var sysMode = this.getSystemMode()
    sysMode.stop()
  }

  initializePins() {
    if (this.testFlag) {
      // running in dev-mode
      rpio.init({mock: 'raspi-3'})

      /* Override default warn handler to avoid mock warnings */
      rpio.on('warn', function () {})
    } else {
      rpio.open(this.gcReadyPin, rpio.INPUT, rpio.LOW)
      // when the start pin is set as an input, it is high-impedance
      // and will prevent the start pin from going low
      rpio.open(this.gcStartPin, rpio.INPUT, rpio.LOW)
    }
  }

  gcReady() {
    return (rpio.read(this.gcReadyPin))
  }

  gcStartSink() {
    // as an output, the rpi can sink up to 16 mA; the agilent requires
    // sinking at least 3.3 mA; measurement indicates 5 mA are sinked when
    // start is shorted to the agilent ground
    rpio.mode(this.gcStartPin, rpio.OUTPUT, rpio.LOW)
  }

  gcStartStopSinking() {
    // when the start pin is set as an input, it is high-impedance
    // and will prevent the start pin from going low
    rpio.mode(this.gcStartPin, rpio.INPUT, rpio.LOW)
  }

  gcFire() {
    // agilent 7890 only needs a 500 us pulse so 2 ms is 4*t_pulse_min
    var pullTimems = 50
    this.gcStartSink()
    return new Promise(resolve => {
      setTimeout(() => {
        this.gcStartStopSinking()
        resolve()
      }, pullTimems)
    })
  }

  waitForGCready() {
    return new Promise((resolve, reject) => {
      var checkInterval = setInterval(() => {
        if (this.userExit) {
          reject(new Error('User exit'))
        }
        if (this.gcReady()) {
          clearInterval(checkInterval)
          console.log('clearing interval for waitforGCready')
          resolve()
        }
      }, 100)
    })
  }

  waitForGCstart() {
    return new Promise((resolve, reject) => {
      var checkInterval = setInterval(() => {
        if (this.userExit) {
          reject(new Error('User exit'))
        }
        if (!this.gcReady()) {
          clearInterval(checkInterval)
          console.log('clearing interval for waitforGCstart')
          resolve()
        }
      }, 100)
    })
  }

  generateTubeList() {
    var list = []
    for (var group of this.rangeGroups) {
      // first tube is startFinish[0]; last tube is startFinish[1]
      var startFinish = group.split('-') // '1-10' ==> ['1', '10']
      // console.log(startFinish)
      for (var i = Number(startFinish[0]); i <= Number(startFinish[1]); i++) {
        // console.log(i)
        list.push(i.toString())
      }
    }
    return list // final list of tubes: [1,2,3,4,5,6...]
  }

  waitForTrap2() {
    var checkInterval = 50
    return new Promise((resolve, reject) => {
      var intervalTimer = setInterval(() => {
        if (this.userExit) {
          reject(new Error('User exit'))
        }
        if (this.secondTrapFired) {
          clearInterval(intervalTimer)
          console.log('Clearing the interval for trap 2 wait')
          resolve()
        }
      }, checkInterval)
    })
  }

  get modes() {
    var retI
    // console.log('services')
    // console.log(this.services)
    this.services.forEach((service, i) => {
      if (Object.prototype.hasOwnProperty.call(service, 'id')) {
        if (service.id === 'modes') {
          retI = i
        }
      }
    })
    if (retI) {
      return this.services[retI]
    }
    return undefined
  }

  async waitForModeStop(mode) {
    var checkInterval = 50
    return new Promise((resolve, reject) => {
      var intervalTimer = setInterval(() => {
        if (this.userExit) {
          reject(new Error('User exit'))
        }
        if (mode.State.value === 'Stopped') {
          clearInterval(intervalTimer)
          console.log('Mode stopped, clearing timer')
          resolve()
        }
      }, checkInterval)
    })
  }

  // async startTestMode() {
  //   var sysMode = this.getSystemMode()
  //   // console.log('Stopping mode')
  //   // sysMode.stop()
  //   // console.log('Starting mode')
  //   // sysMode.start()
  //   // console.log('Stopping mode')
  //   // sysMode.stop()
  //   await this.waitForModeStop(sysMode)
  //
  //   // start mode and tube desorbing
  //   sysMode.start()
  // }

  getSystemMode() {
    var systemModes = this.modes
    if (systemModes === undefined) {
      throw new Error('Automode Error: Modes not defined')
    }
    systemModes = systemModes.obj // use the object map, rather than the container
    if (this.userSelectedMode === 'NONE') {
      throw new Error('Automode Error: Exec mode not selected')
    }
    return systemModes[this.userSelectedMode]
  }

  async beginFiring() {
    this.userExit = false
    var desorberMsg = 'DESORB,D,'
    this.currentList = this.generateTubeList()
    var tube
    var sysMode = this.getSystemMode()
    if (this.serialPort.router.portPath === 'NONE') {
      throw new Error('Automode Error: No Serial Port Connected')
    }
    if (this.compressed) {
      // normal mode
      for (tube of this.currentList) {
        // conditions to be met to start desorbing a tube
        await this.waitForModeStop(sysMode)

        // start mode and tube desorbing
        sysMode.start()
        // await this.userSignal()
        // adding \r to flush buffers (hopefully)
        this.serialPort.serial((desorberMsg + tube + '\r')).catch(error => {
          console.log('Error writing to desorber. MSG:')
          console.log((desorberMsg + tube + '\r'))
          console.log('Error:')
          console.log(error)
        })
        // this.stream.write((desorberMsg + tube + '\r'))
        this.emit('status', 'Tube ' + tube + ' desorbing; awaiting second trap')
        await this.waitForTrap2()

        // for error notification
        if (!this.gcReady()) {
          throw new Error('GC Error: Not Ready') // stops execution of the desorber and gc
        }

        this.emit('status', 'Second trap fired, firing gc')
        console.log('Second trap fired, firing gc')
        await this.gcFire()
        this.emit('status', 'GC Fire command sent; awaiting confirmation')
        console.log('GC Fire command sent')
        await this.waitForGCstart()
        this.emit('status', 'GC firing confirmed')
        console.log('GC Firing')
      }
    } else {
      // normal mode
      for (tube of this.currentList) {
        // conditions to be met to start desorbing a tube
        await this.waitForGCready()
        this.emit('status', 'GC ready; waiting for mode to stop')
        await this.waitForModeStop(sysMode)

        // start mode and tube desorbing
        sysMode.start()
        // await this.userSignal()
        // adding \r to flush buffers (hopefully)
        this.serialPort.serial((desorberMsg + tube + '\r')).catch(error => {
          console.log('Error writing to desorber. MSG:')
          console.log((desorberMsg + tube + '\r'))
          console.log('Error:')
          console.log(error)
        })
        // this.stream.write((desorberMsg + tube + '\r'))
        this.emit('status', 'Tube ' + tube + ' desorbing; awaiting second trap')
        await this.waitForTrap2()
        this.emit('status', 'Second trap fired, firing gc')
        console.log('Second trap fired, firing gc')
        await this.gcFire()
        this.emit('status', 'GC Fire command sent; awaiting confirmation')
        console.log('GC Fire command sent')
        await this.waitForGCstart()
        this.emit('status', 'GC firing confirmed; waiting for GC to finish')
        console.log('GC Firing')
      }
      this.emit('status', 'All tubes completed; Please disconnect and reconnect ethernet')
    }
  }

  close() {
    if (this.connected) {
      this.stream.write('\x03')
      this.stream.write('\x03')
      this.stream.end('exit\n')
      this.connected = false
    }
  }
}

class Desorber {
  constructor({
    testFlag = false,
    id,
    Description,
    Details,
    services,
    dserial,
    gserial,
    extraPreHeatDelay,
    tubeRange,
    autoExecMode,
  }) {
    this.ID = new ui.ShowUser({value: id.toString()})
    this.datastreams = {refreshRate: 1000}
    this.updateable = ['Compressed']
    this.Description = new ui.ShowUser({value: Description})
    this.Details = new ui.ShowUser({value: Details})
    Object.defineProperty(this, 'testFlag', {
      writable: true,
      value: testFlag,
    })
    // console.log('Dservices')
    // console.log(this.services)
    Object.defineProperty(this, 'services', {
      writable: true,
      value: services,
    })

    Object.defineProperty(this, 'r', {
      writable: true,
      value: new ad.Router({portPath: 'NONE', testFlag: true}),
    })
    Object.defineProperty(this, 's', {
      writable: true,
      value: new ad.SerialControl({router: this.r, timeout: 1000}),
    })

    Object.defineProperty(this, 'dEvents', {
      writable: true,
      value: new DesorberEvents({
        testFlag: this.testFlag,
        services: this.services,
        serialPort: this.s,
        DesorberSerial: dserial,
        GASPserial: gserial,
        extraPreHeatDelay: extraPreHeatDelay,
        tubeRange: tubeRange,
        autoExecMode: autoExecMode,
      }),
    })
    this.Status = new ui.ShowUser({value: 'Not Connected', type: ['input', 'string']})
    this['Serial Status'] = new ui.ShowUser({value: 'Not Connected', type: ['input', 'string']})
    this['Ethernet Status'] = new ui.ShowUser({value: 'Not Connected', type: ['input', 'string']})
    Object.defineProperty(this, 'Desorber Serial Port Number', {
      enumerable: true,
      get: () => {
        var dport = 'Not Connected'
        // console.log(this.r.portArray)
        if (Array.isArray(this.r.portArray)) {
          for (var port of this.r.portArray) {
            // console.log('port')
            // console.log(port)
            if (port.manufacturer === 'FTDI') {
              dport = port.path
            }
          }
        }

        return new ui.ShowUser({value: dport, type: ['input', 'string']})
      },
    })
    this.dEvents.on('Closed', () => {
      this['Ethernet Status'].value = 'Connection Closed'
    })
    this.dEvents.on('error', error => {
      this['Ethernet Status'].value = 'Error: ' + error
    })
    this.dEvents.on('MainMenuReady', () => {
      this.Status.value = 'Ready'
    })
    this.dEvents.on('connected', () => {
      this['Ethernet Status'].value = 'Connected'
    })
    this.dEvents.on('status', e => {
      this.Status.value = e
    })
    Object.defineProperty(this, 'Desorber Serial', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: this.dEvents.DesorberSerial, type: ['output', 'number']})
      },
      set: val => {
        // do necessary stuff to tell Desorber to update its desorber serial #
        this.dEvents.DesorberSerial = val
      },
    })
    Object.defineProperty(this, 'GASP Serial', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: this.dEvents.GASPserial, type: ['output', 'number']})
      },
      set: val => {
        // do necessary stuff to tell Desorber to update its GASP serial #
        this.dEvents.GASPserial = val
      },
    })
    Object.defineProperty(this, 'Serial Connect', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.connect()
        res.send()
      },
    })
    Object.defineProperty(this, 'Serial Disconnect', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: new ui.Action({name: 'post', data: ''}), type: ['output', 'button']})
      },
      set: ({res}) => {
        this.disconnect()
        res.send()
      },
    })
    Object.defineProperty(this, 'Ethernet Connect', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.Status.value = 'Connecting to desorber via ssh'
        this.dEvents.connect()
        .catch(error => {
          this.Status.value = 'Error: ' + error
        })
      },
    })
    Object.defineProperty(this, 'Ethernet Disconnect', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.Status.value = 'Disconnecting'
        this.dEvents.close()
      },
    })
    Object.defineProperty(this, 'Extra Pre-heat Delay', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ad.DataPoint({value: this.dEvents.preheatDelay, units: 's'}), type: ['output', 'datapoint']}))
      },
      set: val => {
        this.dEvents.preheatDelay = val
      },
    })
    Object.defineProperty(this, 'Tube Range', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: this.dEvents.StringRange, type: ['output', 'string']}))
      },
      set: val => {
        this.dEvents.StringRange = val
      },
    })
    Object.defineProperty(this, 'Compressed', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: this.dEvents.compressed, type: ['output', 'binary']})
      },
      set: val => {
        this.dEvents.compressed = val
      },
    })
    Object.defineProperty(this, 'Automode', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.Status.value = 'Automode'
        this.dEvents.automode()
        .catch(error => {
          this.Status.value = 'Error: ' + error
        })
      },
    })
    Object.defineProperty(this, 'Start', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.Status.value = 'Starting auto desorb'
        this.dEvents.beginWrapper()
      },
    })
    Object.defineProperty(this, 'End', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
      },
      set: ({res}) => {
        res.send()
        this.Status.value = 'Ending auto desorb'
        this.dEvents.stopFiring()
      },
    })
    Object.defineProperty(this, 'Second Trap Fired', {
      enumerable: true,
      get: () => {
        return (new ui.ShowUser({value: this.dEvents.secondTrapFired, type: ['output', 'binary']}))
      },
      set: val => {
        this.dEvents.secondTrapFired = val
      },
    })
    Object.defineProperty(this, 'Desorber Serial Port', {
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
    Object.defineProperty(this, 'Desorber Serial Portlist', {
      get: function () {
        return this.r.PortList
      },
    })
    Object.defineProperty(this, 'Auto Exec Mode', {
      enumerable: true,
      get: () => {
        return new ui.ShowUser({value: this.dEvents.userSelectedMode, type: ['output', 'list']})
      },
      set: val => {
        this.dEvents.userSelectedMode = val
      },
    })
    Object.defineProperty(this, 'Auto Exec Modelist', {
      enumerable: true,
      get: () => {
        var sysModes = this.dEvents.modes
        // console.log('modes')
        // console.log(sysModes)
        if (sysModes === undefined) {
          return 'NONE'
        } else {
          return Object.keys(sysModes.obj)
        }
      },
    })
    // Object.defineProperty(this, 'Test mode exec', {
    //   enumerable: true,
    //   get: () => {
    //     return (new ui.ShowUser({value: new ui.Action({name: 'post', data: this.State}), type: ['output', 'button']}))
    //   },
    //   set: ({res}) => {
    //     res.send()
    //     this.Status.value = 'Testing mode exec'
    //     this.dEvents.startTestMode()
    //     .catch(error => {
    //       this.Status.value = 'Error: ' + error
    //     })
    //   },
    // })
  }

  async connect() {
    this.Status.value = 'Connecting to Desorber Serial Port...'
    try {
      this.r.reopen({portPath: this.portPath, testFlag: false, baud: 9600})
      await this.r.openPort()
      this['Serial Status'].value = 'Connected to Serial Port: ' + this.r.portPath
    } catch (error) {
      console.log('Error connecting to desorbers serial')
      console.log(error)
      this['Serial Status'].value = 'Error Connecting to Serial Port'
    }
  }

  async disconnect() {
    if (this.r.open) {
      this.r.close()
    }
    this['Serial Status'].value = 'Disconnected from Serial Port'
  }
}

module.exports = {
  initialize: function (test, reinit, baseServices) {
    // test = false
    console.log('intializing desorber interface')

    if (bkup.configExists(desorbPath)) {
      // this should eventually be in a try-catch with a default config
      var loadMap = bkup.load(desorbPath)
      Object.entries(loadMap).forEach(([key, value]) => {
        // specify bare-minimum amount that the config should have
        if (value.ID) {
          console.log(key)
          desorbMap[key] = new Desorber({
            id: value.ID.value,
            testFlag: test,
            Description: value.Description.value,
            Details: value.Details.value,
            services: baseServices,
            dserial: value['Desorber Serial'].value,
            gserial: value['GASP Serial'].value,
            extraPreHeatDelay: value['Extra Pre-heat Delay'].value.value,
            tubeRange: value['Tube Range'].value,
            autoExecMode: value['Auto Exec Mode'].value,
          })
        } else {
          // did not have bare minimum so fail out loudly
          console.log('Configuration missing critical component(s):')
          console.log('value.ID')
          console.log(value)
        }
      })
    } else {
      // re-write desorbMap object into object of MFC classes
      Object.entries(desorbMap).forEach(([key]) => {
        desorbMap[key] = new Desorber({id: key, testFlag: test, services: baseServices})
        // this one is useful for debugging
        bkup.save(desorbMap[key], desorbPath)
        // console.log(desorbMap[key])
      })
    }
    console.log(desorbMap)
  },
  id: desorbID,
  obj: desorbMap,
  path: desorbPath,
}

// var ssh = new NodeSSH()
//
//
// async function f() {
//   try {
//     await ssh.connect({
//       host: '192.168.1.101',
//       username: 'root',
//       port: 22,
//       password: 'SkyFall1!',
//       readyTimeout: 30000
//     })
//     var result = await ssh.execCommand('ls', {cwd: '/comix'})
//     console.log('Stdout')
//     console.log(result.stdout)
//     console.log('Stderr')
//     console.log(result.stderr)
//     result = await ssh.execCommand('python desorb.py', {cwd: '/comix'})
//     console.log('Stdout')
//     console.log(result.stdout)
//     console.log('Stderr')
//     console.log(result.stderr)
//     // result = await ssh.exec('python',['desorb.py'], {
//     //   cwd: '/comix',
//     //   stream: 'both', options: { pty: true },
//     //   onStdout(chunk) {
//     //     console.log('stdoutChunk', chunk.toString('utf8'))
//     //   },
//     //   onStderr(chunk) {
//     //     console.log('stderrChunk', chunk.toString('utf8'))
//     //   },
//     // })
//     // console.log('Result')
//     // console.log(result)
//     // console.log('Stdout')
//     // console.log(result.stdout)
//     // console.log('Stderr')
//     // console.log(result.stderr)
//     await ssh.execCommand('exit', { cwd:'/' })
//     console.log('logged out')
//   } catch (e) {
//     console.log('Error')
//     console.log(e)
//   }
//
// }
//
// f()
