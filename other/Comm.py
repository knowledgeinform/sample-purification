'''
Created on Feb 28, 2017

@author: kaltejm1
'''

import serial
import io
from time import sleep

class Comm:
    
    def __init__(self, portName="COM1"):
        self.h = serial.Serial()
        self.h.baudrate = 9600
        self.h.port = portName 
        self.h.timeout = 1.0
        self.h.stopbits = serial.STOPBITS_ONE
        self.h.parity = serial.PARITY_NONE
        
        self.r = io.TextIOWrapper(io.BufferedRWPair(self.h, self.h))
        
        
    def Connect(self):
        self.h.open()
        return self.h.isOpen()
    
    def Disconnect(self):
        self.h.close()
        
    def Desorb(self, tubeNumber):
        """Desorb a single tube"""
        self.r.write(u"DESORB,D,{0}\r".format(tubeNumber))
        self.r.flush()
        
        reply = self.r.readline()
        parts = reply.split(",")
        return parts[-1] == "ACK"
    
    def ReadLine(self):
        return self.r.readline()
    
    def ReadTubeInfo(self, tubeNumber):
        """Get metadata for a given tube. The GASP plans to support this eventually."""
        self.r.write(u"DESORB,I,{0}\r".format(tubeNumber))
        self.r.flush()
        
        reply = self.r.readline()
        parts =  reply.split(",")
        
        if (parts[-1]=="ACK"):
            reply = self.r.readline()
            parts =  reply.split(",")
        
        return parts[3:]
    
    def ConditionTube(self, tubeStart, tubeStop):
        """ Condidtion a series of tubes beginning at tubeStart and ending at tubeStop"""
        self.r.write(u"DESORB,C,{0},{1}\r".format(tubeStart, tubeStop))
        self.r.flush()
        
        reply = self.r.readline()
        parts = reply.split(",")
        return parts[-1] == "ACK"