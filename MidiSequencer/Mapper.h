//
//  Mapper.h
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#ifndef ____Mapper__
#define ____Mapper__

#include <stdio.h>

//Temporary: Better catch it from config file
const unsigned int TRACKS[] = {48, 49, 50, 51, 44, 45, 46, 47, 40, 41, 42, 43 };
const unsigned int STEPS[]    =  { 36, 37, 38, 39, 32, 33, 34, 35, 28, 29, 30, 31, 24, 25, 26, 27 };
const unsigned int STEP_OUT_NOTES[] = { 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59 };

class Mapper
{
public:
	Mapper(unsigned int);
	
	//Input: Track number from sequencer
	//Output: Midi number to A&H
	int trackOut(unsigned int);
	//Input: Step number from sequencer
	//Output: Midi number to A&H
	int stepOut(unsigned int);
	void setLayer(unsigned int);
	//Input: Midi msg from A&H
	//Output: Track number, -1 otherwise 
	int isTrack(unsigned int);
	//Input: Midi msg from A&H
	//Output: Step number, -1 otherwise 
	int isStep(unsigned int);
	//Input: Track number
	//Output: Note number for that track sequence
	inline unsigned int getTrackStepOut(unsigned int s) { return this->stepOutNotes[s]; };
	//Led indicating led mode state 
	inline unsigned int getPotModeLed(void) { return this->potModeLed; };
private:
	unsigned int layer, potModeLed;
	unsigned int tracks[12];
	unsigned int steps[16];
	unsigned int stepOutNotes[12];
	void calculate(void);
};
#endif /* defined(____Mapper__) */
