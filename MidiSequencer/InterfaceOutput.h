//
//  InterfaceOutput.h
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#ifndef ____InterfaceOutput__
#define ____InterfaceOutput__

#include "RtMidi.h"
#include "Mapper.h"
#include "Sequencer.h"

class Sequencer;

class InterfaceOutput
{
public:
	InterfaceOutput(unsigned int, unsigned int);
	~InterfaceOutput();
	
	inline void setWorkLayer(unsigned int l) {workLayer = l;};
	inline void setCurrLayer(unsigned int c) {currLayer = c;};
	inline void registerSequencer(Sequencer * s) { this->sequencer = s; };
	inline void registerMap(Mapper * m) { this->map = m; };
	inline std::string getPortName(void) { return midiOut->RtMidi::getPortName(); };
	void setStep(unsigned int);
	void blinkTrack(unsigned int, bool);
	void blinkStep(unsigned int, bool);
	void update(void);
	void reset(void);
	void potMode(bool);
	
private:
	unsigned int workLayer, currLayer, port, workCh, litTracks[12];
	RtMidiOut * midiOut;
	Mapper * map;
	Sequencer * sequencer;
	std::vector<unsigned char> messageOn, messageOff;
	
	void blankSteps(void);
	//Probably not needed
	//void updateTrack(void);
	//void updateStep(void);
};

#endif /* defined(____InterfaceOutput__) */
