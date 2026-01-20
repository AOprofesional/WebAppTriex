
export type Status = 'approved' | 'pending' | 'rejected' | 'in_course';

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  status: Status;
  icon: string;
  instructions?: string[];
  meetingPoint?: {
    name: string;
    mapUrl: string;
  };
}

export interface DayItinerary {
  day: number;
  activities: Activity[];
}

export interface Document {
  id: string;
  name: string;
  description: string;
  status: Status;
  type: 'voucher' | 'personal';
  icon: string;
}

export interface User {
  name: string;
  memberSince: string;
  tripsCompleted: number;
  upcomingTrips: number;
  points: number;
}
