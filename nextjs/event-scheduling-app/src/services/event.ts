import { initGoogleCalendar } from "@/lib/google";
import { parse, formatISO, add } from "date-fns";

export const listEvent = async (
  roomId: string,
  startDate?: string | undefined,
  duration = 7
) => {
  const googleClient = await initGoogleCalendar();

  let timeMin = formatISO(new Date());
  if (startDate) {
    timeMin = parse(startDate, "yyyy-MM-dd", new Date()).toISOString();
  }

  const response = await googleClient?.events.list({
    calendarId: roomId,
    eventTypes: ["default"],
    timeMin: timeMin,
    timeMax: add(timeMin, { days: duration }).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response?.data?.items || [];
  return events;
};

export const createEvent = async (
  roomId: string,
  title: string,
  description: string,
  date: string,
  timeFrom: string,
  timeTo: string,
  guests: string[]
) => {
  const googleClient = await initGoogleCalendar();
  const startTime = parse(
    `${date} ${timeFrom}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  );
  const endTime = parse(`${date} ${timeTo}`, "yyyy-MM-dd HH:mm", new Date());

  console.log(guests);

  const event = {
    summary: title,
    description: description,
    start: {
      dateTime: formatISO(startTime),
      timeZone: "UTC",
    },
    end: {
      dateTime: formatISO(endTime),
      timeZone: "UTC",
    },
    //Service accounts cannot invite attendees without Domain-Wide Delegation of Authority.
    //attendees: guests.map(guest => ({ email: guest })),
    //sendUpdates: 'all',
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      // you can add this if you want to override the calendar reminder.
      useDefault: false,
      overrides: [
        {
          method: "email",
          minutes: 30,
        },
      ],
    },
  };

  const meeting = await googleClient?.events.insert({
    calendarId: roomId,
    //conferenceDataVersion: 1,
    requestBody: event,
  });

  let message = "";
  if (meeting?.data) {
    if (meeting.status === 200) {
      message = "Meeting has been added to the calendar";
    } else {
      console.log("Failed to insert event");
      message = "Failed to insert event";
    }
  } else {
    console.log("Failed to insert event: Calendar not initialized");
    message = "Failed to insert event: Calendar not initialized";
  }

  return { message: message };
};

export const deleteEvent = async (roomId: string, eventId: string) => {
  const googleClient = await initGoogleCalendar();

  const response = await googleClient?.events.delete({
    calendarId: roomId,
    eventId: eventId,
  });

  console.log(response);
  return response;
};
