/**
	Created by Yurii Salimov, February, 2018.
	Released into the public domain.

	Modified by JMK, 4.20.20, to reduce the delay times from 1ms to 100us
*/
#include "MAX6675_Thermocouple.h"

MAX6675_Thermocouple::MAX6675_Thermocouple(
	const int SCK_pin,
	const int CS_pin,
	const int SO_pin
) {
	pinMode(this->SCK_pin = SCK_pin, OUTPUT);
	pinMode(this->CS_pin = CS_pin, OUTPUT);
	pinMode(this->SO_pin = SO_pin, INPUT);
	digitalWrite(this->CS_pin, HIGH);
	this->lastReadTime = 0;
	this->lastValue = 0;
}

double MAX6675_Thermocouple::readCelsius() {

	if (millis() - this->lastReadTime >= 220) {
		digitalWrite(this->CS_pin, LOW);
		this->lastReadTime = millis();
		delayMicroseconds(10);
		int value = spiread();
		value <<= 8;
		value |= spiread();
		digitalWrite(this->CS_pin, HIGH);
		if (value & 0x4) {
			return NAN;
		}
		value >>= 3;
		this->lastValue = ((double) value * 0.25);
	}
	return this->lastValue;
}

/**
	Returns a temperature in Kelvin.
	Reads the temperature in Celsius,
	converts in Kelvin and return it.

	@return temperature in degree Kelvin
*/
double MAX6675_Thermocouple::readKelvin() {
	return celsiusToKelvins(readCelsius());
}

/**
	Returns a temperature in Fahrenheit.
	Reads a temperature in Celsius,
	converts in Fahrenheit and return it.

	@return temperature in degree Fahrenheit
*/
double MAX6675_Thermocouple::readFahrenheit() {
	return celsiusToFahrenheit(readCelsius());
}

byte MAX6675_Thermocouple::spiread() {
	byte value = 0;
	for (int i = 7; i >= 0; --i) {
		digitalWrite(this->SCK_pin, LOW);
		delayMicroseconds(10);
		if (digitalRead(this->SO_pin)) {
			value |= (1 << i);
		}
		digitalWrite(this->SCK_pin, HIGH);
		delayMicroseconds(10);
	}
	return value;
}

inline double MAX6675_Thermocouple::celsiusToKelvins(const double celsius) {
	return (celsius + 273.15);
}

inline double MAX6675_Thermocouple::celsiusToFahrenheit(const double celsius) {
	return (celsius * 1.8 + 32.0);
}
