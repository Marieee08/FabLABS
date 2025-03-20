"use client";

import React from 'react';
import CalendarPage from '@/components/custom/CalendarPage';

export default function AdminCalendarPage() {
  return <CalendarPage isAdmin={true} />;
}