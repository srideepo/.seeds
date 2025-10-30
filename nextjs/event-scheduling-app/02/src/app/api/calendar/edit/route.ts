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

export async function POST(req: NextRequest) {
  const { selectedCalendarDate, timetable, message, email } = await req.json();

  if (!timetable || !availableSlots.includes(timetable)) {
    return NextResponse.json({ message: "No correct time slot selected" }, { status: 400 });
  }

  const calendar = await initGoogleCalendar();
  const cetDateTime = parse(`${selectedCalendarDate} ${timetable}`, 'MM/dd/yyyy HH:mm', new Date());
  const utcDate = fromZonedTime(cetDateTime, 'America/New_York');
  const startDateTime = new Date(utcDate.toUTCString());
  const endDateTime = add(startDateTime, { minutes: 20 });

  const event = {
    summary: `Call with ${email}`,
    description: message || undefined,
    start: {
      dateTime: formatISO(startDateTime),
      timeZone: "UTC",
    },
    end: {
      dateTime: formatISO(endDateTime),
      timeZone: "UTC",
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [{ method: "email", minutes: 30 }],
    },
  };

  const meeting = await calendar.events.patch({
    "calendarId":calendarId,
    "eventId":event_id,
    "requestBody": event
  });

  const statusMessage = meeting.status === 200
    ? "Meeting has been added to my calendar"
    : "Failed to insert event";

  return NextResponse.json({ message: statusMessage });
}
