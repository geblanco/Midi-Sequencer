//
//  Sequencer.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#include "Sequencer.h"
#include "RtMidi.h"
#include <iostream>

using namespace std;

Sequencer::Sequencer(unsigned int p, unsigned int ch, unsigned int nT = 12, unsigned int nS = 16)
{
	this->port = p;
	this->numTracks = nT;
	this->numSteps = nS;
	this->currStep = 0;
	this->currTrack = 0;
	this->vel = 100;
	this->outputChannel = ch;
	memset(this->sequence, 0, sizeof(sequence));
	memset(this->pots, -1, sizeof(pots));
	this->message.push_back( (144 + ch) );
	this->message.push_back(-1);
	this->message.push_back(this->vel);
	
	this->potMsg.push_back( (175 + ch) );
	this->potMsg.push_back( 0 );
	this->potMsg.push_back( 0);
	
	this->dispOut = nullptr;
	
	try {
		midiOut = new RtMidiOut();
	}
	catch (RtMidiError &error) {
		error.printMessage();
		exit( EXIT_FAILURE );
	}

	midiOut->openPort(port);
	cout<<endl<<"Sequencer class, port open: "<<midiOut->getPortName();

}

Sequencer::~Sequencer()
{
	midiOut->RtMidiOut::closePort();
	delete midiOut;
}

void Sequencer::step(void)
{	
	for (int i = 0; i < 12; i++)
	{
		this->dispOut->blinkTrack(i, false);
		if (this->sequence[i][currStep])
		{
			this->dispOut->blinkTrack(i, true);
			this->message[1] = this->map->getTrackStepOut(i);
			midiOut->sendMessage(&this->message);
		}
	}
	this->currStep = (++currStep)%16;
}

void Sequencer::start(void)
{
	this->prevStep = this->currStep;
	this->currStep = 0;
	this->step();
}

void Sequencer::setPot(unsigned int p, bool dir)
{
	//Set the pot
	if (dir)	//Clockwise, augment
	{
		if ( 127 > this->pots[currTrack][p] )
			this->pots[currTrack][p]++;
		else
			this->pots[currTrack][p] = 127;
	}
	else
	{
		if ( 0 < this->pots[currTrack][p] )
			this->pots[currTrack][p]--;
		else
			this->pots[currTrack][p] = 0;
	}
	//Send the message
	this->potMsg[1] = ( 7 * currTrack ) + p;
	this->potMsg[2] = this->pots[currTrack][p];
	this->midiOut->sendMessage(&this->potMsg);
}

void Sequencer::dump(void)
{
	fflush(stdout);
	cout<<endl;
	for (int i = 0; i < 12; ++i)
	{
		cout<<endl;
		for (int k = 0; k < 36; ++k)
			cout<<"-";
		cout<<endl;
		cout<<i<<" | ";
		for (int j = 0; j < 16; ++j)
		{
			cout<<sequence[i][j]<<" ";
		}
	}
	cout<<endl;
	for (int k = 0; k < 36; ++k)
		cout<<"-";
}