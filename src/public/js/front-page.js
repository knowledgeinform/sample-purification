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

/* global url window document XMLHttpRequest */

function goToSettings() {
  window.open(url + '/settings.html')
}

function stopDesorbing() {
  var path = '/api/Desorber/0/End'
  postToServer(path, '')
}

function startDesorbing() {
  var path = '/api/Desorber/0/Start'
  postToServer(path, '')
}

function getObject(path) {
  return (new Promise((resolve, reject) => {
    const Http = new XMLHttpRequest()
    // console.log('path')
    // console.log(path)
    Http.open('Get', url + path)
    Http.send()
    Http.onreadystatechange = () => {
      if (Http.readyState === 4 && Http.status === 200) {
        // console.log(Http.response)
        resolve(JSON.parse(Http.response))
      } else {
        // console.log('readyState')
        // console.log(Http.readyState)
        // console.log(Http.status)
      }
    }
  }))
}

function getData({path, element}, cb) {
  // console.log('Getting data from: ' + path)
  // console.log(element)
  var tempBaseKey = path
  getObject(path)
  .then(obj => {
    // console.log(obj)
    if (obj.type[1] === 'datatpoint') {
      if (obj.value.value === undefined) {
        console.log('Undefined datapoint value')
      } else {
        element.value = obj.value.value
      }
    } else {
      if (obj.value === undefined) {
        console.log('Undefined value')
      } else {
        // console.log(obj)
        // console.log(element)
        element.value = obj.value
      }
    }
    // console.log(obj)
    if (obj.type[0] === 'input') {
      // console.log('Getting input data')
    } else if (obj.type[0] === 'output') {
      // console.log('Getting output data')
    } else {
      console.log('UNKNOWN DATA TYPE')
    }
    if (cb !== undefined) {
      cb()
    }
  })
  .catch(error => {
    console.log('error')
    console.log(error)
  })
}

function postToServer(path, params, cb, cbargs) {
  // var tempBaseKey = path
  const Http = new XMLHttpRequest()
  Http.open('Post', url + path, true)
  Http.setRequestHeader('Content-type', 'application/json')
  // console.log(path)
  console.log(params)
  Http.send(params)
  Http.onreadystatechange = function () {
    if (this.readyState === 4 && this.status === 200) {
      console.log(path)
      if (cb !== undefined) {
        console.log(cbargs)
        console.log(cb)
        cb(cbargs)
      }
    } else if (this.readyState === 4 && this.status !== 200) {
      console.log('Something went wrong with POST :(')
      console.log(this.status)
      console.log(this.readyState)
    }
  }
}

function updateMode() {
  var element = document.getElementById('modeSelect')
  // console.log('Found list')
  // console.log(element)
  var path = '/api/Desorber/0/Compressed'
  var trueFalse = {value: true}
  // console.log(trueFalse)
  getData({path, element: trueFalse}, () => {
    // console.log('element')
    // console.log(element)
    if (trueFalse.value) {
      element.value = 1
    } else {
      element.value = 0
    }
  })
  // element.value = obj.value
}

function changeDesorbMode() {
  var element = document.getElementById('modeSelect')
  var path = '/api/Desorber/0/Compressed'
  var val
  if (element.value === '0') {
    val = false
  } else {
    val = true
  }
  // console.log('element')
  // console.log(element)
  // console.log(element.value)
  // console.log('val')
  // console.log(val)
  postToServer(path, val)
}

function updateTubes() {
  var element = document.getElementById('tubeRangeInput')
  // console.log('Updating tubes')
  // console.log(element)
  var path = '/api/Desorber/0/Tube Range'
  if (element !== document.activeElement) {
    getData({path, element})
  }
}

function changeTubes() {
  var element = document.getElementById('tubeRangeInput')
  var path = '/api/Desorber/0/Tube Range'
  console.log('element')
  console.log(element)
  console.log(element.value)
  // console.log('val')
  // console.log(val)
  postToServer(path, element.value)
}

function updateStatus() {
  var element = document.getElementById('statusDiv')
  // console.log('Updating status')
  // console.log(element)
  var path = '/api/Desorber/0/Status'
  var obj = {value: ''}
  // console.log('obj')
  // console.log(obj)
  getData({path, element: obj}, () => {
    // console.log('obj')
    // console.log(obj)
    element.innerHTML = 'Status: ' + obj.value
  })
}

async function getAutoExecMode() {
  var path = '/api/Desorber/0/Auto Exec Mode'
  var ret = await getObject(path)
  return ret.value
}

async function getStopTime(mode) {
  var path  = '/api/modes/' + mode.toString() + '/Duration'
  var ret = await getObject(path)
  return ret.value.value // seconds
}

async function getCurrentTime(mode) {
  var path  = '/api/modes/' + mode.toString() + '/Time'
  var ret = await getObject(path)
  return ret.value.value // seconds
}

function time_convert(num) {
  var minutes = Math.floor(num / 60)
  var seconds = Math.round(num % 60)
  var retString = minutes + ':'
  if (seconds < 10) {
    retString += '0'
  }
  retString += seconds

  return retString
}

async function updateTimeRemaining() {
  var element = document.getElementById('timeRemainingDiv')
  // console.log('Updating remaining time')
  try {
    var mode = await getAutoExecMode()
    // console.log('mode')
    // console.log(mode)
    var totalTime = await getStopTime(mode)
    // console.log('totalTime')
    // console.log(totalTime)
    var curTime = await getCurrentTime(mode)
    // console.log('curTime')
    // console.log(curTime)
    var timeRemaining = totalTime - curTime // seconds
    element.innerHTML = 'Time Remaining: ' + time_convert(timeRemaining)
  } catch (error) {
    console.log('Error updating time remaining')
    console.log(error)
  }
}

function updatePressures() {
  var paths = [
    '/api/ADCs/Pressure 2/PV',
    '/api/ADCs/Pressure 1/PV',
    '/api/ADCs/Pressure 3/PV',
    '/api/ADCs/Pressure 4/PV',
  ]
  var elements = [
    document.getElementById('dgasCylPresP'),
    document.getElementById('o2CylPresP'),
    document.getElementById('h2CylPresP'),
    document.getElementById('n2CylPresP'),
  ]
  var elementFills = [
    document.getElementById('dgasCylFillDiv'),
    document.getElementById('o2CylFillDiv'),
    document.getElementById('h2CylFillDiv'),
    document.getElementById('n2CylFillDiv'),
  ]
  paths.forEach((path, i) => {
    var obj = {value: 0}
    getData({path, element: obj}, () => {
      // console.log('path')
      // console.log(path)
      // console.log('obj')
      // console.log(obj)
      elements[i].innerHTML = Math.round(obj.value.value) + ' ' + obj.value.units

      // resize div
      var maxPressure = 100 // psig
      var maxHeight = 100 // %
      var height = Math.abs(obj.value.value) / maxPressure * maxHeight
      elementFills[i].style.height = height.toString() + '%'

      if (obj.value.value < 40) {
        // make fill red
        elementFills[i].style.background = 'red'
        elementFills[i].style.borderColor = 'red'
      } else {
        elementFills[i].style.background = 'white'
        elementFills[i].style.borderColor = 'white'
      }
    })
  })
}

function updateTemperatures() {
  var paths = [
    '/api/Controllers/0/Process Value 2',
    '/api/Controllers/0/Process Value 1',
    '/api/Controllers/0/Process Value 0',
    '/api/Controllers/0/Process Value 3',
  ]
  var elements = [
    document.getElementById('gcOvenTempP'),
    document.getElementById('oxCatTempP'),
    document.getElementById('redCatTempP'),
    document.getElementById('valveBoxTempP'),
  ]
  paths.forEach((path, i) => {
    var obj = {value: 0}
    getData({path, element: obj}, () => {
      // console.log('path')
      // console.log(path)
      // console.log('obj')
      // console.log(obj)
      elements[i].innerHTML = obj.value.value + ' ' + obj.value.units

      // do something to indicate out-of-bounds behavior
      if (path === '/api/Controllers/0/Process Value 0') {
        // bounds of behavior for GC OVEN
        var lowerBound = 250
        var upperBound = 450
        if (obj.value.value < lowerBound || obj.value.value > upperBound) {
          // make red
        }
      }
    })
  })
}

function updateFlows() {
  var paths = [
    '/api/MFCs/A/Mass Flow',
    '/api/MFCs/B/Mass Flow',
    '/api/MFCs/C/Mass Flow',
    '/api/MFCs/D/Mass Flow',
  ]
  var elements = [
    document.getElementById('mfcAFlowP'),
    document.getElementById('mfcBFlowP'),
    document.getElementById('mfcCFlowP'),
    document.getElementById('mfcDFlowP'),
  ]
  paths.forEach((path, i) => {
    var obj = {value: 0}
    getData({path, element: obj}, () => {
      // console.log('path')
      // console.log(path)
      // console.log('obj')
      // console.log(obj)
      elements[i].innerHTML = obj.value.value + ' ' + obj.value.units
    })
  })
}

function updateLHS() {
  updateMode()
  updateTubes()
  updateStatus()
  updateTimeRemaining()
}

function updateRHS() {
  updatePressures()
  updateTemperatures()
  updateFlows()
}

function update() {
  updateLHS()
  updateRHS()
}

setInterval(() => {
  update()
}, 1000)
