//
//  InterfaceInput.h
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//

#ifndef ____InterfaceInput__
#define ____InterfaceInput__

#include "RtMidi.h"
#include "InterfaceOutput.h"
#include "Sequencer.h"
#include "Mapper.h"
#include "CLOCK.h"

//Temporary: Better catch it from config file
const unsigned char LAYER_CHANGE[3] = {20, 12, 16};
const unsigned char POT_CMD = 19;

class InterfaceInput
{
public:
	InterfaceInput(unsigned int, unsigned int);
	~InterfaceInput();
	
	static void staticCallback(double, std::vector< unsigned char > *, void *);
	void msgCallback(double, std::vector< unsigned char > *);
	void potCallback(double, std::vector< unsigned char > *);
	void clockSetCallback(double, std::vector< unsigned char > *);
	
	inline void registerOutput(InterfaceOutput * io) { this->output = io; this->output->setWorkLayer(this->workLayer); };
	inline void registerSequencer(Sequencer * seq)	 { this->sequencer = seq; };
	inline void registerMap(Mapper * m) { this->map = m; };
	inline void registerClock(CLOCK * m) { this->clk = m; };
	
	inline unsigned int hasOwnChannel(void) { return ownChannel; };
	inline std::string getPortName(void) { return midiInput->RtMidi::getPortName(); };

private:
	RtMidiIn * midiInput;
	InterfaceOutput * output;
	Sequencer * sequencer;
	Mapper * map;
	CLOCK * clk;
	unsigned int workLayer, currLayer, port, ownChannel;
	bool potMode;
};

#endif /* defined(____InterfaceInput__) */