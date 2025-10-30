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

"use server";

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from "next/cache";
import { google } from "googleapis";
import { calendar_v3 as googleCalendar } from "@googleapis/calendar";
import { add, format, parse, formatISO, isBefore,  isAfter } from "date-fns";
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const calendarId = process.env.GOOGLE_CALENDAR_ID!;
const availableSlots = ["08:00", "08:20", "08:40", "09:00", "09:20", "09:40"];

const initGoogleCalendar = async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return google.calendar({ version: "v3", auth });
};

const buildDateSlots = (date: Date) => {
  return availableSlots.map(slot => {
    const [hours, minutes] = slot.split(':').map(Number);
    const cetDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    return fromZonedTime(cetDateTime, 'America/New_York');
  });
};

export async function POST(req: NextRequest) {
  const { date } = await req.json();
  //const date = "20251031";
  console.log('>>', date);
  const calendar = await initGoogleCalendar();
  const dayDate = parse(date, 'yyyyMMdd', new Date());

  const response = await calendar.events.list({
    calendarId,
    timeMin: dayDate.toISOString(),
    timeMax: add(dayDate, { days: 1 }).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];
  const walkin_event = events.filter(e => e.summary?.endsWith('[walkin]'));
  console.log('>>>', walkin_event);

  const dateSlots = buildDateSlots(dayDate);

  const available = dateSlots.filter(slot => {
    const slotEnd = add(slot, { minutes: 20 });
    return !events.some(event => {
      const eventStart = new Date(event.start?.dateTime || '');
      const eventEnd = new Date(event.end?.dateTime || '');
      return isBefore(slot, eventEnd) && isAfter(slotEnd, eventStart);
    });
  });

  const formattedSlots = available.map(slot =>
    format(toZonedTime(slot, 'America/New_York'), 'HH:mm')
  );

  return NextResponse.json({ slots: formattedSlots });
}