"use server";

import { type NextRequest, NextResponse } from 'next/server'
import { listEvent, createEvent, getEventByName, getEventById, appendEventInfo } from '@/services/event';
import { add, format, parse, formatISO, isBefore,  isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export async function POST(req: NextRequest) {

  const calendarId = process.env.GOOGLE_CALENDAR_ID;  
  const { date, id, guest } = await req.json();
  const eventNamePattern = new RegExp('\\[walkin\]$', 'i');
  const duration = 1;

  //const event = await getEventByName(calendarId, eventNamePattern, eventDate);
  //const event = await getEventById(calendarId, id, date);
  const event = await appendEventInfo(calendarId, id, date, guest);
  //const event = await getEventByName(calendarId, eventNamePattern, eventDate, duration);
  if (event.length > 0 && event[0].id) {    
    console.log('>>>id=', event[0].id);
  }else{
    console.log('>>> no events fetched');
  }
  const eventId = event.length > 0 ? event[0].id : undefined;
  const body = "new value";

  //const event = await appendEventInfo(calendarId, eventId, body);

  return NextResponse.json(
      { event },
      { status: 200 }
  )
}