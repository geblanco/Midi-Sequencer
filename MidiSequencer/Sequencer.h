//
//  Sequencer.h
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#ifndef ____Sequencer__
#define ____Sequencer__

#include "RtMidi.h"
#include "Mapper.h"
#include "InterfaceOutput.h"

class InterfaceOutput;

class Sequencer
{
public:
	Sequencer(unsigned int, unsigned int, unsigned int, unsigned int);
	~Sequencer();

	void step();
	void start();
	
	inline void registerMap(Mapper * m) { this->map = m; };
	inline void registerOutput(InterfaceOutput * io) { this->dispOut = io; };

	inline unsigned int getCurrTrack(void) { return this->currTrack; };
	inline unsigned int getPrevTrack(void) { return this->prevTrack; };
	inline unsigned int getStep(unsigned int s) { return this->sequence[currTrack][s]; };
	inline unsigned int getNumTracks(void) { return this->numTracks; };
	inline unsigned int getNumSteps(void) { return this->numSteps; };
	
	inline void setStep(unsigned int s) { this->sequence[currTrack][s] = 1 - this->sequence[currTrack][s]; };
	inline void setCurrTrack(unsigned int t) { this->prevTrack = this->currTrack; this->currTrack = t; };
	inline void setNumTracks(unsigned int t) { this->numTracks = t; };
	inline void setNumSteps(unsigned int s) { this->numSteps = s; };
	
	inline std::string getPortName(void) { return midiOut->RtMidi::getPortName(); };
	
	void setPot(unsigned int, bool);
	void dump(void);

private:
	unsigned int numTracks, numSteps, port, currStep, prevStep, currTrack, prevTrack, vel, outputChannel;
	unsigned int sequence[12][16];
	unsigned int pots[12][7];
	RtMidiOut * midiOut;
	Mapper * map;
	InterfaceOutput * dispOut;
	std::vector<unsigned char> message, potMsg;
};

#endif /* defined(____Sequencer__) */