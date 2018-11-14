//
//  Mapper.cpp
//  MidiSequencer
//
//  Created by Guillermo on 09/01/15.
//  Copyright (c) 2015 Guillermo. All rights reserved.
//


#include "Mapper.h"
#include <iostream>
	

Mapper::Mapper(unsigned int l)
{
	this->layer = l;
	this->potModeLed = 19;
	memcpy(this->tracks, TRACKS, sizeof(TRACKS));
	memcpy(this->steps, STEPS, sizeof(STEPS));
	memcpy(this->stepOutNotes, STEP_OUT_NOTES, sizeof(STEP_OUT_NOTES));
	//Used for notes out from the sequencer, each one is from each track
	this->calculate();
}

void Mapper::setLayer(unsigned int l)
{
	this->layer = l;
	this->calculate();
}

int Mapper::trackOut(unsigned int t)
{
	if (t < sizeof(tracks)/sizeof(unsigned int))
		return tracks[t];
	return -1;
}

int Mapper::stepOut(unsigned int s)
{
	if (s < sizeof(steps)/sizeof(unsigned int))
		return steps[s];
	return -1;
}

int Mapper::isTrack(unsigned int t)
{
	int track;
	for (track = ( sizeof(tracks)/sizeof(unsigned int) ) - 1; 0 <= track && tracks[track] != t; track--);
	return track;
}

int Mapper::isStep(unsigned int s)
{
	int step;
	for (step = ( sizeof(steps)/sizeof(unsigned int) ) - 1; 0 <= step && steps[step] != s; step--);
	return step;
}

//Helper private method, scales steps and tracks array to match given layer of A&H
void Mapper::calculate()
{
	for (int i = 0; i < sizeof(tracks)/sizeof(unsigned int); i++)
		tracks[i] = tracks[i] + (36 * layer);
	for (int i = 0; i < sizeof(steps)/sizeof(unsigned int); i++)
		steps[i] = steps[i] + (36 * layer);
	for (int i = 0; i < sizeof(stepOutNotes)/sizeof(unsigned int); i++)
		stepOutNotes[i] = stepOutNotes[i] + (36 * layer);
}
