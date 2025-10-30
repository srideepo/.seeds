"use server";

import { type NextRequest, NextResponse } from 'next/server'
import { createEvent } from '@/services/event';
import { add, format, parse, formatISO, isBefore,  isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export async function POST(req: NextRequest) {

  const calendarId = process.env.GOOGLE_CALENDAR_ID;  
  const { date, title, description, timeFrom, timeTo, guests } = await req.json();
  const dayDate = date;

  const event = await createEvent(calendarId, 'title', description, dayDate, timeFrom, timeTo, guests);

  return NextResponse.json(
      { event },
      { status: 200 }
  )
}