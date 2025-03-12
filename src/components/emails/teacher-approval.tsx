import React from 'react';

interface TeacherApprovalEmailProps {
  studentName: string;
  lvlSec: string;
  subject: string;
  topic: string;
  noOfStudents: number;
  dates: string[];
  approvalUrl: string;
  declineUrl: string;
  teacherName: string;
}

export const TeacherApprovalEmail: React.FC<TeacherApprovalEmailProps> = ({
  studentName,
  lvlSec,
  subject,
  topic,
  noOfStudents,
  dates,
  approvalUrl,
  declineUrl,
  teacherName,
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6', color: '#333', margin: 0, padding: 0 }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
        <div style={{ backgroundColor: '#143370', color: 'white', padding: '20px', textAlign: 'center', borderRadius: '5px 5px 0 0' }}>
          <h1>FabLab Reservation Approval</h1>
        </div>
        
        <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
          <p>Dear Professor {teacherName},</p>
          
          <p>A student has requested your approval for a FabLab reservation. Please review the details below:</p>
          
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', border: '1px solid #eee', marginBottom: '20px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Student:</div>
              <div style={{ width: '60%' }}>{studentName}</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Class/Section:</div>
              <div style={{ width: '60%' }}>{lvlSec}</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Subject:</div>
              <div style={{ width: '60%' }}>{subject}</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Topic:</div>
              <div style={{ width: '60%' }}>{topic}</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Number of Students:</div>
              <div style={{ width: '60%' }}>{noOfStudents}</div>
            </div>
            <div style={{ display: 'flex', padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold', width: '40%' }}>Date(s):</div>
              <div style={{ width: '60%' }}>
                {dates.map((date, index) => (
                  <div key={index}>{date}</div>
                ))}
              </div>
            </div>
          </div>
          
          <p>Please confirm that you approve this lab reservation:</p>
          
          <div style={{ textAlign: 'center', margin: '30px 0' }}>
            <a href={approvalUrl} style={{ display: 'inline-block', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', padding: '12px 30px', borderRadius: '5px', fontWeight: 'bold', marginRight: '10px' }}>
              Approve Request
            </a>
            <a href={declineUrl} style={{ display: 'inline-block', backgroundColor: '#ef4444', color: 'white', textDecoration: 'none', padding: '12px 30px', borderRadius: '5px', fontWeight: 'bold' }}>
              Decline
            </a>
          </div>
          
          <p>If you have any questions, please contact the FabLab administrator.</p>
        </div>
        
        <div style={{ backgroundColor: '#f1f5f9', padding: '15px', textAlign: 'center', fontSize: '12px', color: '#666', borderRadius: '0 0 5px 5px', border: '1px solid #ddd', borderTop: 'none' }}>
          <p>This is an automated message from the FabLab Reservation System. Please do not reply to this email.</p>
          <p>&copy; 2025 FabLab. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};