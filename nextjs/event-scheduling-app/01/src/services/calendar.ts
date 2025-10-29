import { initGoogleCalendar } from '@/lib/google';

export const createCalendar = async (
    calName: string
): Promise<string | null | undefined> => {

    const googleClient = await initGoogleCalendar();

    const calendar = {
        summary: calName,
    }

    // review https://developers.google.com/calendar/api/v3/reference/calendars#resource for other available options
    const response = await googleClient?.calendars.insert({
        requestBody: calendar
    })
    
    return response?.data.id
};
