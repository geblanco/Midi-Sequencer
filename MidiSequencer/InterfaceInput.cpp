//
//  InterfaceInput.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//

#include "InterfaceInput.h"

using namespace std;

InterfaceInput::InterfaceInput(unsigned int p, unsigned int l)
{
	this->port = p;
	this->workLayer = l;
	this->ownChannel = -1;
	this->potMode = false;
	
	try {
	    midiInput = new RtMidiIn();
	}
	catch ( RtMidiError &error ) {
	    error.printMessage();
	    exit( EXIT_FAILURE );
	}
	
	midiInput->openPort(port);
	midiInput->setCallback(&InterfaceInput::staticCallback, (void*)this);
	
	cout<<endl<<"InterfaceInput class, port open: "<<midiInput->getPortName();
}

void InterfaceInput::staticCallback(double deltatime, std::vector<unsigned char> * message, void * userData)
{
	//cout<<"\nStatic InterfaceInput callback";
	//Avoid extra callbacks by blocking note off events and pots
	//143 is the maximum value of a note off, corresponding to ch 16
	if (160 > message->at(0))
	{
		if ( 0 > ( 143 - (int)message->at(0) ) )
			reinterpret_cast<InterfaceInput*>(userData)->msgCallback(deltatime, message);
	}//Else pot
	else
	{//Filter only encoders
		/**
		 *	Pots - {0, 1, 2, 3};, 20
		 *	Offset, Resolution	- {21}; Better on special mode or by UI
		 */
		unsigned int enc = (int)message->at(1);
		if ( 4 > enc || 20 == enc )
			reinterpret_cast<InterfaceInput*>(userData)->potCallback(deltatime, message);
		else if ( 21 == enc )
			reinterpret_cast<InterfaceInput*>(userData)->clockSetCallback(deltatime, message);
	}
}

void InterfaceInput::msgCallback(double deltatime, std::vector< unsigned char > *message)
{
	//cout<<"\nDinamic InterfaceInput callback\n";
	unsigned int i = (int)message->at(1);
	unsigned int opt;
	
	//As we receive a msg, catch channel and set it up
	if (  -1 == this->ownChannel || 16 < this->ownChannel)
	{
		int n = (143 - i) * (-1);
		this->ownChannel = n;
	}
	
	//int nBytes = (int)message->size();
	//cout<<endl;
	//for (int i = 0; i < nBytes; i++ )
	//	cout << "Byte " << i << " = " << (int)message->at(i) << ", ";
	//cout<<endl<<"Working layer: "<<workLayer<<" Current Layer: "<<currLayer<<endl;
	for (int o = 0; o < 3; o++)
	{
		if ( i == LAYER_CHANGE[o] )
		{
			currLayer = o;
			output->setCurrLayer(o);
			//cout<<endl<<"Layer change, current layer: "<<currLayer<<endl;
			//Set sequencer out display component layer
		}
	}
	if (currLayer == workLayer)
	{
		/**
		 *	Parse command:
		 *		- Drum change
		 *		- Step change
		 *		- Pot change
		 */
		//Note on/off
		if ( -1 < (159 - (int)message->at(0)) )
		{
			if ( (opt = map->isTrack(i)) != -1)
			{
				//cout<<"\nTrack select!\n";
				//Is a track
				/**
				 *	Algorithm:
				 *		- Refresh sequencer current track
				 *		- Make interface output display steps from current Track
				 */
				sequencer->setCurrTrack(opt);
				output->update();
				//sequencer->dump();
			}
			else if ( (opt = map->isStep(i)) != -1)
			{//Is a step
				//cout<<"\nStep select! "<<opt<<"\n";
				sequencer->setStep(opt);
				output->setStep(opt);
				//sequencer->dump();
			}
			else if ( message->at(1) == POT_CMD )
			{
				this->potMode = !this->potMode;
				this->output->potMode(this->potMode);
			}
		}
		//else //Is a pot
			//cout<<"InterfaceInput, pot detected";
		//Transmit data to sequencer
	}
	//else
	//{
		//block message, not leading anything to pass, included note offs, avoiding bad blinks
	//}
}

void InterfaceInput::potCallback(double deltatime, std::vector<unsigned char> *message)
{
	if (this->potMode)
		this->sequencer->setPot( (int)message->at(1) == 20 ? 4 : (int)message->at(1), ( (int)message->at(2) == 1 ? true : false) );
}

void InterfaceInput::clockSetCallback(double deltatime, std::vector<unsigned char> * message)
{
	if (this->potMode)
	{
		//if (20 == message->at(1) )
			this->clk->setOffset( message->at(2) == 1 ? true : false);
		//else
			//this->clk->setResolution( message->at(2) == 1 ? true : false);
	}
}

InterfaceInput::~InterfaceInput()
{
	midiInput->RtMidiIn::closePort();
	delete midiInput;
}