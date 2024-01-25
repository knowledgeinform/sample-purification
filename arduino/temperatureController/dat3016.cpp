///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#include "dat3016.h"
#include "ModbusMaster.h"

ModbusMaster node;

int datInputRegisters[] = {15, 16, 17, 18};
size_t datInputRegistersLength = 4;

float readInput_reg(int reg) {
  float input;
  int engrUnits;
  uint8_t j, result;
  uint16_t data[2];

  input = 0;
  result = node.readHoldingRegisters(reg - 1, 1);

  // do something with data if read is successful
  if (result == node.ku8MBSuccess) {
    // Serial.println("Success");
    engrUnits = node.getResponseBuffer(0);
    // Serial.println(engrUnits,HEX);
    // Serial.println(engrUnits);
    input = (float) engrUnits;
    return input/10;
  } else {
    // Serial.println("Result");
    // Serial.println(result, HEX);
    return DAT_3016_FAIL_RETURN;
  }
}

float dat3016_readInput(int i) {
  if (i < datInputRegistersLength) {
    return readInput_reg(datInputRegisters[i]);
  } else {
    return DAT_3016_FAIL_RETURN;
  }
}

int dat3016_changeInputType(uint16_t hex) {
  uint8_t j, result;
  result = node.writeSingleRegister(11 - 1, hex); // input type is register 40011

  // do something with data if read is successful
  if (result == node.ku8MBSuccess) {
    return DAT_3016_SUCCESS;
  } else {
    return DAT_3016_FAIL_RETURN;
  }
}

void dat3016_initialize(HardwareSerial * Serial1, int baud) {
  // use Serial (port 1); initialize Modbus communication baud rate
  Serial1->setTimeout(3); // this is about 9xchar time, which is far more than the 3.5xchar time modbus-rtu specifies for timeout at 38.4 Kbps
  Serial1->begin(baud);

  // communicate with Modbus slave ID 2 over Serial (port 0)
  node.begin(1, *Serial1);
}
