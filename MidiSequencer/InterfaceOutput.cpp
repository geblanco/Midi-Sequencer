//
//  InterfaceOutput.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#include "InterfaceOutput.h"

using namespace std;

InterfaceOutput::InterfaceOutput(unsigned int p, unsigned int ch = -1)
{
	this->port = p;
	this->workCh = ch;
	memset(this->litTracks, 0, sizeof(litTracks)/sizeof(unsigned int));
	//Note on msg
	this->messageOn.push_back( (143 + ch) );
	this->messageOn.push_back(-1);
	this->messageOn.push_back(127);
	//Note off msg
	this->messageOff.push_back( (127 + ch) );
	this->messageOff.push_back(-1);
	//Have to check if this is needed, or with note on vel = 0 is enough
	this->messageOff.push_back(0);
	
	try {
		midiOut = new RtMidiOut();
	} catch (RtMidiError &error) {
		error.printMessage();
		exit( EXIT_FAILURE );
	}
	midiOut->openPort(port);
	cout<<endl<<"InterfaceOutput class, port open: "<<midiOut->getPortName();
	//cout<<"Selected port: "<<midiOut->getPortName();
	//Blank all controller
}

InterfaceOutput::~InterfaceOutput()
{
	midiOut->closePort();
	delete midiOut;
}

void InterfaceOutput::setStep(unsigned int s)
{
	unsigned int stepNote = this->map->stepOut(s);

	//Just in case...
	this->messageOn[0] = 143 + this->workCh;
	this->messageOff[0] = 127 + this->workCh;
	
	if (this->sequencer->getStep(s))
	{
		this->messageOn[1] = stepNote;
		this->midiOut->sendMessage(&this->messageOn);
	}
	else
	{
		this->messageOff[1] = stepNote;
		this->midiOut->sendMessage(&this->messageOff);
	}
}

void InterfaceOutput::update(void)
{
	unsigned int trk;

	//Just in case...
	this->messageOn[0] = 143 + this->workCh;
	this->messageOff[0] = 127 + this->workCh;
	
	//Paint current track led
	trk = sequencer->getCurrTrack();
	//cout<<"\nTrack step out: "<<this->map->trackOut(trk);
	this->messageOn[1] = this->map->trackOut(trk);
	this->midiOut->sendMessage(&this->messageOn);
	
	//If its a different track, blank steps and prevTrack led and paint new track's steps
	if ( trk != sequencer->getPrevTrack() )
	{
		//cout<<"\nIt is different from previous track";
		this->messageOff[1] = this->map->trackOut(this->sequencer->getPrevTrack());
		this->midiOut->sendMessage(&this->messageOff);
		this->blankSteps();
		
		for (unsigned int i = 0; i < 16; i++)
		{
			if (sequencer->getStep(i))
			{
				this->messageOn[1] = this->map->stepOut(i);
				this->midiOut->sendMessage(&this->messageOn);
			}
		}
	}
	//else
	//	cout<<"\nIt is same as previous track";
}

void InterfaceOutput::blinkTrack(unsigned int t, bool l)
{
	if (l)
	{
		this->litTracks[t] = 1;
		this->messageOn[1] = this->map->trackOut(t);
		this->midiOut->sendMessage(&this->messageOn);
	}
	else
	{
		if (this->litTracks[t] && t != this->sequencer->getCurrTrack())
		{
			this->messageOff[1] = this->map->trackOut(t);
			this->midiOut->sendMessage(&this->messageOff);
			this->litTracks[t] = 0;
		}
	}
}

void InterfaceOutput::blinkStep(unsigned int s, bool l)
{
	if (l)
	{
		unsigned int prevStep = s;
		prevStep = prevStep == 0 ? 15 : prevStep-1;
		if (!this->sequencer->getStep(prevStep))
		{
			this->messageOff[1] = this->map->stepOut(prevStep);
			this->midiOut->sendMessage(&this->messageOff);
		}
		this->messageOn[1] = this->map->stepOut(s);
		this->midiOut->sendMessage(&this->messageOn);
	}
}

void InterfaceOutput::reset(void)
{
	for ( int i = 0; i < this->sequencer->getNumTracks(); i++)
	{
		this->messageOff[1] = this->map->trackOut(i);
		this->midiOut->sendMessage(&this->messageOff);
		for ( int j = 0; j < this->sequencer->getNumSteps(); j++)
		{
			this->messageOff[1] = this->map->stepOut(j);
			this->midiOut->sendMessage(&this->messageOff);
		}
	}
}

void InterfaceOutput::potMode(bool onOff)
{
	unsigned int lPot = this->map->getPotModeLed();
	if (!onOff)
	{
		this->messageOff[1] = lPot;
		this->midiOut->sendMessage(&this->messageOff);
	}
	else
	{
		this->messageOn[1] = lPot;
		this->midiOut->sendMessage(&this->messageOn);
	}
}

//Private helper methods
void InterfaceOutput::blankSteps(void)
{
	//Just in case...
	this->messageOn[0] = 143 + this->workCh;
	this->messageOff[0] = 127 + this->workCh;
	
	for (unsigned int i = 0; i < 16; i++)
	{
		this->messageOff[1] = this->map->stepOut(i);
		this->midiOut->sendMessage(&this->messageOff);
	}
}