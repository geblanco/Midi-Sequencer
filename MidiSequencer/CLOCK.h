//
//  CLOCK.h
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//

#ifndef ____CLOCK__
#define ____CLOCK__

#include "RtMidi.h"
#include "Sequencer.h"
#include "InterfaceOutput.h"

class CLOCK
{
public:
	CLOCK(unsigned int);
	~CLOCK();

	inline void registerSequencer(Sequencer * s) {this->sequencer = s;};
	inline void registerOutput(InterfaceOutput * io) {this->dispOut = io;};
	//Horrible hack but works
	static void staticCallback  (double, std::vector< unsigned char > *, void *);
	void clockStep (double, std::vector< unsigned char > *);
	inline int getBeatcount(void) { return this->beatcount; };
	inline int getResolution(void) { return this->resolution; };
	
	inline void setPort(unsigned int p) { this->port = p; };
	inline void setResolution(bool o) { this->resolution = o == true ? this->resolution + 1 : this->resolution - 1; };
	void setOffset(bool);
	
private:
	RtMidiIn * midiInput;
	Sequencer * sequencer;
	InterfaceOutput * dispOut;
	unsigned int port;
	int count, beatcount, resolution;
};

#endif /* defined(____CLOCK__) */