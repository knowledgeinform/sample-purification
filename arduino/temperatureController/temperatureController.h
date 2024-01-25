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


#ifndef TEMP_CONTROLLER_H
#define TEMP_CONTROLLER_H

#include "PID_v1.h"

// size of double, all variables saved to flash are saved with the same block-size
// to simplify the coding. It would be slightly more memory efficient to have
// different sized blocks per variable type, but with all the memory the Due has,
// this is the easiest route. The sizeof(double) == 8, which is the largest type
// used.
#define NUM_BYTES_PER_BLOCK 8

// these defines are generated from an excel sheet that calculates the offsets
#define TEMP_CTRL_P_OFFSET  4
#define TEMP_CTRL_I_OFFSET  36
#define TEMP_CTRL_D_OFFSET  68
#define TEMP_CTRL_RLOW_OFFSET  100
#define TEMP_CTRL_RHIGH_OFFSET  132
#define TEMP_CTRL_DIR_OFFSET  164
#define TEMP_CTRL_TRAP_LT_OFFSET  196
#define TEMP_CTRL_TRAP_ST_OFFSET  212

/**
Pin definitions
*/

// output pins
#define controllerOutput0 53
#define controllerOutput1 51
#define controllerOutput2 49
#define controllerOutput3 47

#define LTRAP_PIN 45
#define STRAP_PIN 43

typedef struct PID_tag
{
  String  ID;
  double  p;
  double  i;
  double  d;
  double  rlow;
  double  rhigh;
  unsigned long windowStartTime;
  int     DIR;
  PID*    pid;
  void    Serialize(PID_tag *, char **, int, bool);
  void    assign(PID_tag *, char **, int, char *);
} PID_params;

typedef struct Safety_tag
{
  String      ID;
  bool        EN;
  float       FSP;
  float       ULAL;
  float       LLAL;
  void        Serialize(Safety_tag *, char **, int, bool);
  void        assign(Safety_tag *, char **, int, char *);
} Safety;

typedef struct LoopVars_tag
{
  String  ID;
  String  pvUnits;
  double  pv;
  double  sp;
  double  co;
  void    Serialize(LoopVars_tag *, char **, int, bool);
  void    assign(LoopVars_tag *, char **, int, char *);
} LoopVars;

typedef struct Loop_tag
{
  String      ID;
  String      status;
  PID_params  pid;
  LoopVars    loopVars;
  Safety      safety;
  void        Serialize(Loop_tag *, char **, int, bool);
  void        assign(Loop_tag *, char **, int, char *);
} Loop;

typedef struct Trap_tag
{
  unsigned long longT;
  unsigned long shortT;
  bool          lFire;
  bool          sFire;
  unsigned long lStart;
  unsigned long sStart;
  bool          lLock;
  bool          sLock;
  int           pin;
  void          Serialize(Trap_tag *, char **, int, bool);
  void          assign(Trap_tag *, char **, int, char *);
} Trap;

typedef struct Controller_tag
{
  String  ID;
  String  status;
  int     address;
  size_t  numLoops;
  Loop*   loops;
  size_t  settableLoopNum;
  size_t  numTraps;
  Trap*   traps;
  size_t  settableTrapNum;
  void    Serialize(Controller_tag *, char **, int, bool);
  void    assign(Controller_tag *, char **, int, char *);
} Controller;

typedef struct ControllerManager_tag
{
  size_t        tcs;
  Controller*   c;
  int*          outputs;
} ControllerManager;

#endif // TEMP_CONTROLLER_H
