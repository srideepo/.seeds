"use server";

import { type NextRequest, NextResponse } from 'next/server'
import { listEvent } from '@/services/event';
import { add, format, parse, formatISO, isBefore,  isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export async function POST(req: NextRequest) {
  
  const { date } = await req.json();
  const dayDate = date;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const duration = 7;

  const rooms = await listEvent(calendarId, dayDate, duration);

  return NextResponse.json(
      { rooms },
      { status: 200 }
  )
}
