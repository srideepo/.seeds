"use server";

import { type NextRequest, NextResponse } from 'next/server'
import { listEvents, listEventById } from '@/services/event';
import { add, format, parse, formatISO, isBefore,  isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export async function POST(req: NextRequest) {
  
  const { date, id } = await req.json();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const duration = 7;

  let events;
  if (id) {
    events = await listEventById(calendarId, id, date);
  } else {
    events = await listEvents(calendarId, date, duration);
  }

  return NextResponse.json(
      { events },
      { status: 200 }
  )
}
