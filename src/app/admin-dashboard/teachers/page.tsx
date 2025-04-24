// 4. Create the page: src/app/admin-dashboard/teacher-emails/page.tsx
"use client";

import TeacherEmailManager from '@/components/admin-functions/teacher-email-manager';

export default function TeacherEmailsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Teacher Email Management</h1>
      <TeacherEmailManager />
    </div>
  );
}