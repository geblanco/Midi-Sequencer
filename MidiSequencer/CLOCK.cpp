//
//  CLOCK.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//

#include "CLOCK.h"
#include <iostream>

using namespace std;

CLOCK::CLOCK(unsigned int p)
{
	this->port = p;
	this->resolution = 24;
	try {
	    midiInput = new RtMidiIn();
	}
	catch ( RtMidiError &error ) {
	    error.printMessage();
	    exit( EXIT_FAILURE );
	}

	midiInput->openPort(port);
	midiInput->setCallback( & CLOCK::staticCallback, (void*)this);
	midiInput->ignoreTypes(true, false, true);
	
	count = beatcount = 0;
	
	cout<<endl<<"CLOCK class, port open: "<<midiInput->getPortName();
}

void CLOCK::staticCallback(double deltatime, std::vector<unsigned char> * message, void * userData)
{
	reinterpret_cast<CLOCK*>(userData)->clockStep(deltatime, message);
}

void CLOCK::clockStep(double deltatime, std::vector< unsigned char > *message)
{
	if ( !sequencer )
	{
		cout<<endl<<"No sequencer registered"<<endl;
		unsigned int nBytes = message->size();
		for ( unsigned int i=0; i<nBytes; i++ )
			cout << "Byte " << i << " = " << (int)message->at(i) << ", ";
		if ( nBytes > 0 )
			cout << "stamp = " << deltatime << endl;
	}
	else
	{
		//midiInput->getMessage(message);
		unsigned char i = message->at(0);
		//onRun
		if (i == 248)
		{
			++count;
			if (!(count%resolution))
			{
				beatcount = (( beatcount + 1 ) % 16);
				cout<<endl<<"beatcount: "<<beatcount<<endl;
				count = 0;
				sequencer->step();
				dispOut->blinkStep(beatcount, true);
			}
		}
		//Start!
		else if (i == 250)
		{
			beatcount = 0;
			sequencer->start();
		}
		//Stop!
		else if (i == 252)
		{
			beatcount = 0;
		}
	}
}

void CLOCK::setOffset(bool dir)
{
	if ( dir) //Clockwise
		this->count = (++this->count) % this->resolution;
	else
	{
		if (this->count)
			--this->count;
		else
			this->count = this->resolution -1;
	}
}

CLOCK::~CLOCK()
{
	midiInput->RtMidiIn::closePort();
	delete midiInput;
}