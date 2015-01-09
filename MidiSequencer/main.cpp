//
//  main.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//
#include <iostream>
#include <cstdlib>
#include <signal.h>
#include <fstream>
#include <unistd.h>

#include "RtMidi.h"
#include "Sequencer.h"
#include "InterfaceInput.h"
#include "InterfaceOutput.h"
#include "CLOCK.h"
#include "Mapper.h"

using namespace std;

int selectDevices(int * aI, int * aO, int * s, int * c);
int selectLayer(void);
int selectOutChannel(void);
int selectAnHChannel(void);

bool done, preDone;
static void finish(int ignore);

int main (int argc, char * argv[])
{
	InterfaceOutput * out;
	InterfaceInput * in;
	Sequencer * seq;
	CLOCK * clk;
	Mapper * map;
	
	int data[] = { -1, -1, -1, -1, -1, -1, -1 }, nT = 12, nS = 16;
	bool args = false, config = false;
	char p, cwd[1024], cFile[1024];
	fstream confFile;
	
	if (getcwd(cwd, sizeof(cwd)) != NULL)
	{
		strcat(cwd, "/");
		strcpy(cFile, cwd);
		strcat(cFile, "config.txt");
		confFile.open(cFile, fstream::in);
		if ( confFile.is_open() )
		{
			cout<<"\nConfig file found, parsing...";
			for ( int i = 0; i < sizeof(data)/sizeof(int); i++ )
			{
				confFile >> data[i];
				cout<<"\nParsed data: "<<data[i];
			}
			config = true;
			confFile.close();
		}
	}
	if ( !config )
	{
		//------------------SETUP-----------------------
		if (8 == argc)
		{
			for ( int i = 1; i < argc; i++)
				data[i] = atoi(argv[i]);
			args = true;
		}
		if (!args)
		{
			if ( (selectDevices(data, &data[1], &data[2], &data[3])) )
			{
				cout<<", closing...\nPress key-Enter ...";
				cin.get( p );
				return -1;
			}
			data[4] = selectLayer();
			data[5] = selectOutChannel();
			data[6] = selectAnHChannel();
		}
		//------------------------------------------------
	}
	in  = new InterfaceInput(data[0], data[4]);				//Port layer
	out = new InterfaceOutput(data[1], data[6]);			//Port outChannel
	seq = new Sequencer(data[2], data[5], nT, nS);					//Port seqOutChannel
	clk = new CLOCK(data[3]);								//Port
	map = new Mapper(data[4]);								//Layer
	
	seq->registerMap(map);
	out->registerMap(map);
	in->registerMap(map);
	
	clk->registerSequencer(seq);
	out->registerSequencer(seq);
	in->registerSequencer(seq);
	
	seq->registerOutput(out);
	clk->registerOutput(out);
	in->registerOutput(out);
	
	in->registerClock(clk);
	
	out->reset();
	clk->setOffset(12);
	
	done = preDone = false;
	(void) signal(SIGINT, finish);
	cout<<"\nWorking...\nQuit with Ctrl-C (twice)\n";
	while (!done);
	
	strcat(cwd, "autoConfig.txt");
	confFile.open(cwd, fstream::out | fstream::trunc);
	if ( !(confFile.is_open()) )
	{
		cout<<"Could not create config file";
	}
	data[6] = in->hasOwnChannel();
	for ( int i = 0; i < sizeof(data)/sizeof(int); i++)
		confFile << data[i]<<endl;
	confFile.close();
	delete out;
	delete in;
	delete seq;
	delete clk;
	delete map;
	
	return 0;
}

int selectDevices(int * aI, int * aO, int * s, int * c)
{
	RtMidiIn  *midiin = 0;
	RtMidiOut *midiout = 0;
	string portName;
	unsigned int nPorts;
	
	//===================== INPUT PORTS =====================
	try {
		midiin = new RtMidiIn();
	}
	catch ( RtMidiError &error ) {
		error.printMessage();
		exit( EXIT_FAILURE );
	}
	// Check inputs.
	nPorts = midiin->getPortCount();
	if (nPorts == 0)
	{
		cout<<"No midi input ports available";
		delete midiin;
		delete midiout;
		return 3;
	}
	cout << "\nThere are " << nPorts << " MIDI input sources available.\n";
	for ( unsigned int i=0; i<nPorts; i++ ) {
		try {
			portName = midiin->getPortName(i);
		}
		catch ( RtMidiError &error ) {
			error.printMessage();
			delete midiin;
			return 1;
		}
		cout << "  Input Port #" << i+1 << ": " << portName << '\n';
	}
	do
	{
		cout<<endl<<"\nInput port selection"<<endl;
		cout<<endl<<"Select a port for A&H Input"<<endl;
		do
		{
			cout<<"Option:\t";
			cin>>(*aI);
			--*aI;
		}while( -1 == (*aI) );
		cout<<endl<<"Selected port: "<<(*aI + 1)<<endl;
		cout<<endl<<"Select a port for Clock Input (Traktor Virtual Output recommended)"<<endl;
		do
		{
			cout<<"Option:\t";
			cin>>(*c);
			--*c;
		}while( -1 == (*c) );
		cout<<endl<<"Selected port: "<<(*c + 1)<<endl;
		if ( (*c) == (*aI) )
			cout<<endl<<"\nMUST BE DIFFERENT PORTS";
	}while( (*c) == (*aI) );
	//========================================================
	
	//===================== OUTPUT PORTS =====================
	try {
		midiout = new RtMidiOut();
	}
	catch ( RtMidiError &error ) {
		error.printMessage();
		exit( EXIT_FAILURE );
	}
	// Check outputs.
	nPorts = midiout->getPortCount();
	if (nPorts == 0)
	{
		cout<<"No midi output ports available";
		delete midiin;
		delete midiout;
		return 3;
	}
	cout << "\nThere are " << nPorts << " MIDI output ports available.\n";
	for ( unsigned int i=0; i<nPorts; i++ ) {
		try {
			portName = midiout->getPortName(i);
		}
		catch (RtMidiError &error) {
			error.printMessage();
			delete midiout;
			return 2;
		}
		cout << "  Output Port #" << i+1 << ": " << portName << '\n';
	}
	do
	{
		cout<<endl<<"\nOutput port selection"<<endl;
		cout<<endl<<"Select a port for A&H Output"<<endl;
		do
		{
			cout<<"Option:\t";
			cin>>(*aO);
			--*aO;
		}while( -1 == (*aO) );
		cout<<endl<<"Selected port: "<<(*aO + 1)<<endl;
		
		cout<<endl<<"Select a port for Sequencer Output"<<endl;
		do
		{
			cout<<"Option:\t";
			cin>>(*s);
			--*s;
		}while( -1 == (*s) );
		cout<<endl<<"Selected port: "<<(*s + 1)<<endl;
		if ( (*aO) == (*s) )
			cout<<endl<<"\nMUST BE DIFFERENT PORTS";
	}while( (*aO) == (*s) );
	//========================================================
	delete midiin;
	delete midiout;
	
	return 0;
}

int selectLayer(void)
{
	int l = -1;
	cout<<"\n\nSelect working layer from A&H:";
	cout<<endl<<"# 0 - Red";
	cout<<endl<<"# 1 - Amber";
	cout<<endl<<"# 2 - Green";
	do {
		cout<<"\nSelect: ";
		cin>>l;
	}while ( 2 < l || 0 > l);
	cout<<"\nUsing ";
	if (l == 0) cout<<"'Red' layer\n";
	else if (l == 1) cout<<"'Amber' layer\n";
	else cout<<"'Green' layer\n";
	return l;
}

int selectOutChannel(void)
{
	int ch = -1;
	cout<<"\n\nSelect midi channel for Sequencer output (1-16):";
	do {
		cout<<"\nSelect: ";
		cin>>ch;
	}while ( 16 < ch || 1 > ch);
	cout<<"\nUsing channel: "<<ch<<endl;
	return ch;
}

int selectAnHChannel(void)
{
	int ch = -1;
	cout<<"\n\nSelect working midi channel from A&H output (1-16):";
	do {
		cout<<"\nSelect: ";
		cin>>ch;
	}while ( 16 < ch || 1 > ch);
	cout<<"\nUsing channel: "<<ch<<endl;
	return ch;
}

static void finish(int ignore)
{
	if (preDone)
		done = true;
	preDone = true;
}





