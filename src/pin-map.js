// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = {
  HeaderNumber: [1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40],
  Name: ['3.3 VDC Power',
    '5.0 VDC POWER',
    'SPI3 MOSI/SDA3 (SPI, I2C)',
    '5.0 VDC POWER',
    'SP3 SCLK/SCL3 (SPI, I2C)',
    'GND',
    'SPI4 CE0 N/SDA3 (I2C)',
    'TXD1/SPI5 MOSI (UART, SPI)',
    'GND',
    'RXD1/SPI5 SCLK (UART, SPI)',
    'GPIO 17',
    'SPI6 CEO N',
    'SPI6 CE1 N (SPI)',
    'GND',
    'SDA6 (I2C)',
    'SCL6 (I2C)',
    '3.3 VDC Power',
    'SPI3 CE1 N (SPI)',
    'SDA5 (I2C)',
    'GND',
    'RXD4/SCL4 (UART, I2C)',
    'SPI4 CE1 N (SPI)',
    'SCL5 (I2C)',
    'SDA4/TXD4 (I2C, UART)',
    'GND',
    'SDCL4/SPI4 SCLK (I2C, SPI)',
    'SPI3 CE0 N/TXD2/SDA6 (SPI, UART, I2C)',
    'SPI3 MISO/SCL6/RXD2 (SPI, I2C, UART)',
    'SPI4 MISO/RXD3/SCL3 (SPI, UART, I2C)',
    'GND',
    'SPI4 MOSI/SDA4 (SPI, I2C)',
    'SDA5/SPI5 CEO N/TXD5 (I2C, SPI, UART)',
    'SPI5 MISO/RXD5/SCL5 (SPI, UART, I2C)',
    'GND',
    'SPI6 MISO (SPI)',
    'SPI1 CE2 N (SPI)',
    'SPI5 CE1 N (SIP)',
    'SPI6 MOSI (SPI)',
    'GND',
    'SPI6 SCLK (SPI)'],
  GPIOnumber: ['N/A',
    'N/A',
    '2',
    'N/A',
    '3',
    'N/A',
    '4',
    '14',
    'N/A',
    '15',
    '17',
    '18',
    '27',
    'N/A',
    '22',
    '23',
    'N/A',
    '24',
    '10',
    'N/A',
    '9',
    '25',
    '11',
    '8',
    'N/A',
    '7',
    '0',
    '1',
    '5',
    'N/A',
    '6',
    '12',
    '13',
    'N/A',
    '19',
    '16',
    '26',
    '20',
    'N/A',
    '21'],
  getIndexFromGPIO: function (gpioNum) {
    var strGPIOnum = gpioNum.toString()
    for (var i = 0; i < this.GPIOnumber.length; i++) {
      if (strGPIOnum === this.GPIOnumber[i]) {
        // console.log('i '+i+' gpioNum '+strGPIOnum+' this.gpioNumber['+i+'] '+this.GPIOnumber[i]);
        return i
      }
    }
  },

}
