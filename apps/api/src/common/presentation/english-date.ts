/** English date presentation with Latin digits and no locale-dependent runtime formatting. */
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function parts(value: Date) {
  return {
    month: MONTHS[value.getMonth()],
    day: value.getDate(),
    year: value.getFullYear(),
    hour: value.getHours(),
    minute: value.getMinutes(),
  };
}

export function formatMonthDay(value: Date): string {
  const date = parts(value);
  return `${date.month} ${date.day}`;
}

export function formatMonth(value: Date): string {
  return parts(value).month;
}

export function formatMonthDayYear(value: Date): string {
  const date = parts(value);
  return `${date.month} ${date.day}, ${date.year}`;
}

export function formatMonthDayTime(value: Date): string {
  const date = parts(value);
  const hour = date.hour % 12 || 12;
  const minute = String(date.minute).padStart(2, "0");
  const meridiem = date.hour >= 12 ? "PM" : "AM";
  return `${date.month} ${date.day}, ${hour}:${minute} ${meridiem}`;
}
