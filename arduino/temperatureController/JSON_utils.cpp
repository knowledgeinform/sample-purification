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


//Header library defining functions for serializing data in JSON format on an Arduino
//Note - assumes tx on serial line defined by "Serial"

#include "JSON_utils.h"

void JSONstart()
{
  Serial.print(F("{"));
}

void JSONend(bool child)
{
  //child = whether or not this is a child element
  if (child) {
    Serial.println(F("},"));
  } else {
    // parent
    Serial.println(F("}"));
  }
}

void JSONstartArray()
{
  Serial.print(F("["));
}

void JSONendArray(bool child)
{
  //child = whether or not this is a child element
  if (child) {
    Serial.println(F("],"));
  } else {
    // parent
    Serial.println(F("]"));
  }
}

void JSONkey(char * key)
{
  Serial.print(F("\""));
  Serial.print(key);
  Serial.print(F("\":"));
}

void JSONitem(char * key, float * value)
{
  JSONkey(key);
  Serial.print(*value);
  Serial.print(F(","));
}

void JSONitem(char * key, double * value)
{
  JSONkey(key);
  Serial.print(*value);
  Serial.print(F(","));
}

void JSONitem(char * key, int * value)
{
  JSONkey(key);
  Serial.print(*value);
  Serial.print(F(","));
}

void JSONitem(char * key, size_t * value)
{
  JSONkey(key);
  Serial.print(*value);
  Serial.print(F(","));
}

void JSONitem(char * key, unsigned long * value)
{
  JSONkey(key);
  Serial.print(*value);
  Serial.print(F(","));
}

void JSONitem(char * key, char * value)
{
  JSONkey(key);
  Serial.print(F("\""));
  Serial.print(value);
  Serial.print(F("\","));
}

void JSONitem(char * key, String * value)
{
  JSONkey(key);
  Serial.print(F("\""));
  Serial.print(value->c_str());
  Serial.print(F("\","));
}

void JSONitem(char * key, bool * value)
{
  JSONkey(key);
  if (*value) {
    Serial.print(F("true"));
  } else {
    Serial.print(F("false"));
  }

  Serial.print(F(","));
}

void JSONlastItem(char * key, float * value)
{
  JSONkey(key);
  Serial.print(*value);
}

void JSONlastItem(char * key, double * value)
{
  JSONkey(key);
  Serial.print(*value);
}

void JSONlastItem(char * key, int * value)
{
  JSONkey(key);
  Serial.print(*value);
}

void JSONlastItem(char * key, size_t * value)
{
  JSONkey(key);
  Serial.print(*value);
}

void JSONlastItem(char * key, unsigned long * value)
{
  JSONkey(key);
  Serial.print(*value);
}

void JSONlastItem(char * key, char * value)
{
  JSONkey(key);
  Serial.print(F("\""));
  Serial.print(value);
  Serial.print(F("\""));
}

void JSONlastItem(char * key, String * value)
{
  JSONkey(key);
  Serial.print(F("\""));
  Serial.print(value->c_str());
  Serial.print(F("\""));
}

void JSONlastItem(char * key, bool * value)
{
  JSONkey(key);
  if (*value) {
    Serial.print(F("true"));
  } else {
    Serial.print(F("false"));
  }

}
