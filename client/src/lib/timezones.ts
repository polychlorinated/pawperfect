// List of common timezones
export const timezones = [
  'America/New_York',      // Eastern Time
  'America/Chicago',       // Central Time
  'America/Denver',        // Mountain Time
  'America/Los_Angeles',   // Pacific Time
  'America/Anchorage',     // Alaska Time
  'America/Honolulu',      // Hawaii Time
  'America/Phoenix',       // Arizona
  'Europe/London',         // London
  'Europe/Paris',          // Central European Time
  'Asia/Tokyo',            // Japan
  'Australia/Sydney',      // Sydney
];

// Map timezones to their display names
export const timezoneLabels: Record<string, string> = {
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Anchorage': 'Alaska Time',
  'America/Honolulu': 'Hawaii Time',
  'America/Phoenix': 'Arizona',
  'Europe/London': 'London',
  'Europe/Paris': 'Central European Time',
  'Asia/Tokyo': 'Japan',
  'Australia/Sydney': 'Sydney',
};

// Helper function to format dates with timezone awareness
export function formatDateWithTimezone(
  date: Date, 
  timezone = 'America/Chicago', 
  format: 'iso' | 'display' | 'MMM d, yyyy' | 'MMMM d, yyyy' | 'MMM d, yyyy h:mm a' = 'iso'
): string {
  try {
    // Convert date to the target timezone
    const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    if (format === 'iso') {
      // Format as YYYY-MM-DD regardless of locale
      const year = dateInTz.getFullYear();
      // getMonth() is zero-based, so we add 1 and ensure 2 digits
      const month = String(dateInTz.getMonth() + 1).padStart(2, '0');
      const day = String(dateInTz.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } else if (format === 'display' || format === 'MMM d, yyyy') {
      // Format for display: "May 8, 2023"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[dateInTz.getMonth()];
      const day = dateInTz.getDate();
      const year = dateInTz.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } else if (format === 'MMMM d, yyyy') {
      // Format for display with full month name: "May 8, 2023"
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                      'August', 'September', 'October', 'November', 'December'];
      const month = months[dateInTz.getMonth()];
      const day = dateInTz.getDate();
      const year = dateInTz.getFullYear();
      
      return `${month} ${day}, ${year}`;
    } else if (format === 'MMM d, yyyy h:mm a') {
      // Format for display with time: "May 8, 2023 3:30 PM"
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[dateInTz.getMonth()];
      const day = dateInTz.getDate();
      const year = dateInTz.getFullYear();
      
      // Format the time
      let hours = dateInTz.getHours();
      const minutes = String(dateInTz.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
      
      return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
    }
    
    // Default to ISO format if an unknown format is provided
    return `${dateInTz.getFullYear()}-${String(dateInTz.getMonth() + 1).padStart(2, '0')}-${String(dateInTz.getDate()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    // Fallback to ISO date string without timezone
    return date.toISOString().split('T')[0];
  }
}

// Convert a date from one timezone to UTC
export function convertToUTC(date: Date, timezone = 'America/Chicago'): Date {
  // Get the date parts in the specified timezone
  const options = { timeZone: timezone, hour12: false };
  const dateString = date.toLocaleString('en-US', options);
  
  // Parse the date string and create a new UTC date
  return new Date(dateString);
}

// Get a timezone's display name
export function getTimezoneLabel(timezoneValue: string): string {
  return timezoneLabels[timezoneValue] || timezoneValue;
}