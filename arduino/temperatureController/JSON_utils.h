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


#ifndef JSON_UTILS_H
#define JSON_UTILS_H

#include <Arduino.h>

//Header library defining functions for serializing data in JSON format on an Arduino
//Note - assumes tx on serial line defined by "Serial"

void JSONstart();
void JSONend(bool child);

void JSONstartArray();
void JSONendArray(bool child);

void JSONkey(char * key);

void JSONitem(char * key, float * value);
void JSONitem(char * key, double * value);
void JSONitem(char * key, int * value);
void JSONitem(char * key, size_t * value);
void JSONitem(char * key, unsigned long * value);
void JSONitem(char * key, char * value);
void JSONitem(char * key, String * value);
void JSONitem(char * key, bool * value);

void JSONlastItem(char * key, float * value);
void JSONlastItem(char * key, double * value);
void JSONlastItem(char * key, int * value);
void JSONlastItem(char * key, size_t * value);
void JSONlastItem(char * key, unsigned long * value);
void JSONlastItem(char * key, char * value);
void JSONlastItem(char * key, String * value);
void JSONlastItem(char * key, bool * value);

#endif //JSON_UTILS_H
