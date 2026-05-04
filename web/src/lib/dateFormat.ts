/**
 * Centralized date formatting utilities using dayjs.
 *
 * This module provides the canonical date/time formatting functions for the entire frontend.
 * All date formatting MUST go through these utilities. Direct dayjs().format() calls in
 * components are prohibited.
 *
 * Import and use:
 * - formatDate(value) — format as display date (MM/DD/YYYY)
 * - formatTime(value) — format as time only (h:mm A)
 * - formatDateTime(value) — format as date and time (MM/DD/YYYY h:mm A)
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

// Common format constants
export const DISPLAY_DATE_FORMAT = "MM/DD/YYYY";
export const DISPLAY_TIME_FORMAT = "h:mm A";
export const DISPLAY_DATETIME_FORMAT = "MM/DD/YYYY h:mm A";
export const DISPLAY_FULL_FORMAT = "ddd, MMM D @ h:mm A";
export const ISO_FORMAT = "YYYY-MM-DDTHH:mm:ss.SSSZ";

type DateValue = string | number | Date | dayjs.Dayjs | null | undefined;

/**
 * Format a date value as a display-friendly date string (MM/DD/YYYY).
 * Returns a fallback message if the value is invalid.
 */
export function formatStaticDate(
  value: DateValue,
  fallback: string = "Invalid date",
): string {
  return formatDate(value, DISPLAY_DATE_FORMAT, fallback);
}

/**
 * Format a date value as a meeting-friendly display date string (MM/DD/YYYY).
 * Alias for formatDate() — use this when formatting meeting dates in components.
 */
export function formatStaticFullDateTime(
  value: DateValue,
  fallback: string = "Invalid date",
): string {
  return formatDate(value, DISPLAY_FULL_FORMAT, fallback);
}

/**
 * Format a date value as a time string (h:mm A).
 * Returns a fallback message if the value is invalid.
 */
export function formatStaticTime(
  value: DateValue,
  fallback: string = "Invalid time",
): string {
  return formatDate(value, DISPLAY_TIME_FORMAT, fallback);
}

/**
 * Format a date value as a date and time string (MM/DD/YYYY h:mm A).
 * Returns a fallback message if the value is invalid.
 */
export function formatStaticDateTime(
  value: DateValue,
  fallback: string = "Invalid date/time",
): string {
  return formatDate(value, DISPLAY_DATETIME_FORMAT, fallback);
}

/**
 * Format a date value as an ISO date/time string (YYYY-MM-DDTHH:mm:ss.SSSZ).
 * Returns a fallback message if the value is invalid.
 */
export function formatStaticIsoDateTime(
  value: DateValue,
  fallback: string = "Invalid date/time",
): string {
  return formatDate(value, ISO_FORMAT, fallback);
}

/**
 * Format a date value as a meeting-friendly display date string (MM/DD/YYYY).
 * Alias for formatDate() — use this when formatting meeting dates in components.
 */
export function formatDate(
  value: DateValue,
  format: string = DISPLAY_DATE_FORMAT,
  fallback: string = "Invalid date",
): string {
  if (!value) return fallback;

  const date = dayjs(value);

  if (!date.isValid()) {
    return fallback;
  }

  return date.format(format);
}

formatDate.date = formatStaticDate;
formatDate.time = formatStaticTime;
formatDate.dateTime = formatStaticDateTime;
formatDate.isoDateTime = formatStaticIsoDateTime;
formatDate.full = formatStaticFullDateTime;

/**
 * Get a dayjs instance from a value, with validation.
 * Returns null if the value is invalid.
 *
 * @param value — Date, ISO string, Unix timestamp, or string parseable by dayjs
 * @returns dayjs instance or null if invalid
 */
export function parseDateStrict(value: DateValue): dayjs.Dayjs | null {
  if (!value) return null;

  const date = dayjs(value);

  if (!date.isValid()) {
    return null;
  }

  return date;
}

/**
 * Check if a date value is valid and parseable.
 *
 * @param value — Date, ISO string, Unix timestamp, or string parseable by dayjs
 * @returns true if the value is a valid date, false otherwise
 */
export function isValidDate(value: DateValue): boolean {
  if (!value) return false;
  return dayjs(value).isValid();
}

/**
 * Format the day of month for the date bookend (large day number).
 * Example: 5, 23, 31
 *
 * @param value — Date to format
 * @returns Day of month as a string, or "?" if invalid
 */
export function formatBookendDay(value: DateValue): string {
  if (!value) return "?";
  const date = dayjs(value);
  if (!date.isValid()) return "?";
  return date.format("D");
}

/**
 * Format the month and ordinal day for the date bookend (middle line).
 * Example: "MAY 3rd", "JAN 1st"
 *
 * @param value — Date to format
 * @returns Month and ordinal day as a string, or empty if invalid
 */
export function formatBookendMonthDay(value: DateValue): string {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.format("MMM Do").toUpperCase();
}

/**
 * Format the year for the date bookend (bottom line).
 * Example: "2026"
 *
 * @param value — Date to format
 * @returns 4-digit year as a string, or "" if invalid
 */
export function formatBookendYear(value: DateValue): string {
  if (!value) return "";
  const date = dayjs(value);
  if (!date.isValid()) return "";
  return date.format("YYYY");
}
