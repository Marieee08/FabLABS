'use client';


import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import ProgressBar from '@/components/msme-forms/progress-bar';
import Navbar from '@/components/custom/navbar';
import ProcessInformation from '@/components/student-forms/utilization-info';
import ReviewSubmit from '@/components/student-forms/review-submit';
import { toast } from "@/components/ui/use-toast"


const MAX_DATES = 5;


const timeToMinutes = (timeString: string | null): number => {
 if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return -1;
  const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
 if (!match) return -1;
  let [_, hours, minutes, period] = match;
 let hour = parseInt(hours);
  // Convert to 24-hour format
 if (period === 'PM' && hour !== 12) hour += 12;
 if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + parseInt(minutes);
};


interface FormData {
 days: {
   date: Date;
   startTime: string | null;
   endTime: string | null;
 }[];
 syncTimes: boolean; 
 unifiedStartTime: string | null; 
 unifiedEndTime: string | null;


 // UtilizationInfo fields
 ProductsManufactured: string;
 BulkofCommodity: string;
 Equipment: string;
 Tools: string;
 ToolsQty: number;

 ControlNo?: number;
 LvlSec: string;
 NoofStudents: number;
 Subject: string;
 Teacher: string;
 Topic: string;
 SchoolYear: number;
 
 // Needed Materials array
 NeededMaterials: {
   Item: string;
   ItemQty: number;
   Description: string;
 }[];
}

interface Material {
  Item: string;
  ItemQty: number;
  Description: string;
}

// Props interface for EVCInformation component
interface EVCInformationProps {
  formData: FormData;
  updateFormData: (field: keyof FormData, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}


type UpdateFormData = (field: keyof FormData, value: FormData[keyof FormData] | number) => void;


export default function Schedule() {
 const [step, setStep] = React.useState(1);
 const [formData, setFormData] = React.useState<FormData>({
   days: [],
   syncTimes: false, // Initialize sync state
   unifiedStartTime: null, // Initialize unified start time
   unifiedEndTime: null,


   // Initialize ProcessInfo fields
   ProductsManufactured: '',
   BulkofCommodity: '',
   Equipment: '',
   Tools: '',
   ToolsQty: 0,

   LvlSec: '',
   NoofStudents: 0,
   Subject: '',
   Teacher: '',
   Topic: '',
   SchoolYear: new Date().getFullYear(),
   NeededMaterials: []
 });
 
 interface BlockedDate {
  id: string;
  date: string;
}

interface CalendarDate extends Date {}

const [blockedDates, setBlockedDates] = useState<CalendarDate[]>([]);

 const fetchBlockedDates = async () => {
  try {
    const response = await fetch('/api/blocked-dates');
    const data = await response.json();
    const dates = data.map((item: BlockedDate) => {
      // Create date at noon to avoid timezone issues
      const date = new Date(item.date);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    });
    setBlockedDates(dates);
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch blocked dates",
      variant: "destructive",
    });
  }
};

useEffect(() => {
  fetchBlockedDates();
}, []);

const isDateBlocked = (date: Date) => {
  return blockedDates.some(blockedDate => 
    date.getFullYear() === blockedDate.getFullYear() &&
    date.getMonth() === blockedDate.getMonth() &&
    date.getDate() === blockedDate.getDate()
  );
};

 const updateFormData: UpdateFormData = (field, value) => {
   setFormData(prevData => ({ ...prevData, [field]: value }));
 };
  const nextStep = () => setStep(prevStep => prevStep + 1);
 const prevStep = () => setStep(prevStep => prevStep - 1);

 function EVCInformation({ formData, updateFormData, nextStep, prevStep }: EVCInformationProps) {
  const [materials, setMaterials] = useState<Material[]>(formData.NeededMaterials || []);

  const addMaterial = () => {
    setMaterials([...materials, { Item: '', ItemQty: 0, Description: '' }]);
    updateFormData('NeededMaterials', [...materials, { Item: '', ItemQty: 0, Description: '' }]);
  };

  const updateMaterial = (index: number, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map((material, i) => {
      if (i === index) {
        return { ...material, [field]: value };
      }
      return material;
    });
    setMaterials(updatedMaterials);
    updateFormData('NeededMaterials', updatedMaterials);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Grade Level/Section</label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={formData.LvlSec}
              onChange={(e) => updateFormData('LvlSec', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of Students</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={formData.NoofStudents}
              onChange={(e) => updateFormData('NoofStudents', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={formData.Subject}
              onChange={(e) => updateFormData('Subject', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={formData.Teacher}
              onChange={(e) => updateFormData('Teacher', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <input
              type="text"
              className="w-full border rounded-md p-2"
              value={formData.Topic}
              onChange={(e) => updateFormData('Topic', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">School Year</label>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              value={formData.SchoolYear}
              onChange={(e) => updateFormData('SchoolYear', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Equipment and Materials</h3>
          {materials.map((material, index) => (
            <div key={index} className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Item"
                className="border rounded-md p-2"
                value={material.Item}
                onChange={(e) => updateMaterial(index, 'Item', e.target.value)}
              />
              <input
                type="number"
                placeholder="Quantity"
                className="border rounded-md p-2"
                value={material.ItemQty}
                onChange={(e) => updateMaterial(index, 'ItemQty', parseInt(e.target.value))}
              />
              <input
                type="text"
                placeholder="Description"
                className="border rounded-md p-2"
                value={material.Description}
                onChange={(e) => updateMaterial(index, 'Description', e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addMaterial}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Material
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Previous
        </button>
        <button
          onClick={nextStep}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Next
        </button>
      </div>
    </div>
  );
}

const renderStep = () => {
  switch(step) {
    case 1:
      return <DateTimeSelection formData={formData} setFormData={setFormData} nextStep={nextStep} isDateBlocked={isDateBlocked} />;
    case 2:
      return <ProcessInformation formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
    case 3:
      return <EVCInformation formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
    case 4:
      return <ReviewSubmit formData={formData} prevStep={prevStep} updateFormData={updateFormData} nextStep={nextStep} />;
    default:
      return <DateTimeSelection formData={formData} setFormData={setFormData} nextStep={nextStep} isDateBlocked={isDateBlocked} />;
  }
};


return (
  <>
    <Navbar />
    <div className="container mx-auto p-4 mt-16">
      <h1 className="text-2xl font-bold mb-4">Schedule a Service</h1>
      <ProgressBar currentStep={step} totalSteps={4} />
      {renderStep()}
    </div>
  </>
);
}


interface DateTimeSelectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  nextStep: () => void;
  isDateBlocked: (date: Date) => boolean;  // Add this line
}


function formatTime(hour: string, minute: string): string {
 const [hourNum, period] = hour.split(' ');
 const paddedHour = hourNum.padStart(2, '0');
 return `${paddedHour}:${minute} ${period}`;
}


function DateTimeSelection({ formData, setFormData, nextStep, isDateBlocked }: DateTimeSelectionProps) {
  const [syncTimes, setSyncTimes] = useState(false);
  const [unifiedStartTime, setUnifiedStartTime] = useState<string | null>(null);
  const [unifiedEndTime, setUnifiedEndTime] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const isRegularDisabled = (date: Date) => {
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);
    today.setHours(0, 0, 0, 0);
    oneMonthLater.setHours(0, 0, 0, 0);

    if (date < today || date > oneMonthLater || date.getDay() === 0 || date.getDay() === 6) {
      return true;
    }

    const dateString = date.toDateString();
    const isAlreadySelected = formData.days.some(day => new Date(day.date).toDateString() === dateString);
    return !isAlreadySelected && formData.days.length >= MAX_DATES;
  };
  
 const validateTimes = () => {
   const newErrors: string[] = [];


   if (formData.days.length === 0) {
     newErrors.push("Please select at least one date");
     return newErrors;
   }


   for (const day of formData.days) {
     const date = new Date(day.date).toDateString();
      // Ensure both start and end times exist
     if (
       day.startTime &&
       day.endTime &&
       day.startTime !== '--:-- AM' &&
       day.endTime !== '--:-- PM'
     ) {
       const startMinutes = timeToMinutes(day.startTime);
       const endMinutes = timeToMinutes(day.endTime);
        // Ensure end time is after start time
       if (endMinutes <= startMinutes) {
         newErrors.push(`End time must be after start time for ${date}`);
       }
     } else {
       return false;
     }
   }
   return newErrors;
 };


 const handleNext = () => {
   const validationErrors = validateTimes();
   setErrors(validationErrors);
  
   if (validationErrors.length === 0) {
     nextStep();
   }
 };


 const addNewDay = (date: Date) => {
   const clickedDateString = date.toDateString();
   const existingDayIndex = formData.days.findIndex(
     day => new Date(day.date).toDateString() === clickedDateString
   );
    setFormData((prevData) => {
     // If date already exists, remove it
     if (existingDayIndex >= 0) {
       const updatedDays = [...prevData.days];
       updatedDays.splice(existingDayIndex, 1);
       return {
         ...prevData,
         days: updatedDays,
       };
     }
      // Add date only if under MAX_DATES limit
     if (prevData.days.length < MAX_DATES) {
       // When sync is enabled, use the unified times for new dates
       const newDay = {
         date,
         startTime: prevData.syncTimes ? prevData.unifiedStartTime : null,
         endTime: prevData.syncTimes ? prevData.unifiedEndTime : null
       };


       return {
         ...prevData,
         days: [...prevData.days, newDay],
       };
     }
      return prevData;
   });
 };


 const updateDayTime = (index: number, time: string, field: 'startTime' | 'endTime') => {
   const updatedDays = [...formData.days];
   updatedDays[index][field] = time;
   setFormData({ ...formData, days: updatedDays });
 };


 const handleSelect = (date: Date | undefined) => {
   if (!date) return;
   addNewDay(date);
 };


 // Function to update all times
 const updateAllTimes = (time: string, field: 'startTime' | 'endTime') => {
   setFormData(prevData => ({
     ...prevData,
     days: prevData.days.map(day => ({
       ...day,
       [field]: time
     }))
   }));
 };


 // Handle unified time changes
 const handleUnifiedTimeChange = (time: string, field: 'startTime' | 'endTime') => {
   setFormData(prevData => {
     // Update all days with the new time when sync is enabled
     const updatedDays = prevData.days.map(day => ({
       ...day,
       [field]: time
     }));
    
     return {
       ...prevData,
       [field === 'startTime' ? 'unifiedStartTime' : 'unifiedEndTime']: time,
       days: updatedDays
     };
   });
 };


 // Handle individual time changes
 const handleIndividualTimeChange = (time: string, field: 'startTime' | 'endTime', index: number) => {
   setFormData(prevData => {
     const updatedDays = [...prevData.days];
    
     if (prevData.syncTimes) {
       // If sync is enabled, update all days
       updatedDays.forEach(day => {
         day[field] = time;
       });
      
       return {
         ...prevData,
         [field === 'startTime' ? 'unifiedStartTime' : 'unifiedEndTime']: time,
         days: updatedDays
       };
     } else {
       // If sync is disabled, update only the selected day
       updatedDays[index][field] = time;
       return {
         ...prevData,
         days: updatedDays
       };
     }
   });
 };


 // Handle sync toggle
 const handleSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
   const newSyncState = e.target.checked;
  
   setFormData(prevData => {
     let newStartTime = prevData.unifiedStartTime;
     let newEndTime = prevData.unifiedEndTime;
    
     if (newSyncState && prevData.days.length > 0) {
       // If unified times aren't set, use the first day's times or default to null
       if (!newStartTime || !newEndTime) {
         const firstDay = prevData.days[0];
         newStartTime = firstDay.startTime;
         newEndTime = firstDay.endTime;
       }
      
       // Apply these times to all existing dates
       const updatedDays = prevData.days.map(day => ({
         ...day,
         startTime: newStartTime,
         endTime: newEndTime
       }));
      
       return {
         ...prevData,
         syncTimes: newSyncState,
         unifiedStartTime: newStartTime,
         unifiedEndTime: newEndTime,
         days: updatedDays
       };
     }
    
     return {
       ...prevData,
       syncTimes: newSyncState,
       unifiedStartTime: newStartTime,
       unifiedEndTime: newEndTime
     };
   });
 };


 const isDateDisabled = (date: Date) => {
   const today = new Date();
   const oneMonthLater = new Date();
   oneMonthLater.setMonth(today.getMonth() + 1);
   today.setHours(0, 0, 0, 0);
   oneMonthLater.setHours(0, 0, 0, 0);


   if (date < today || date > oneMonthLater || date.getDay() === 0 || date.getDay() === 6) {
     return true;
   }


   const dateString = date.toDateString();
   const isAlreadySelected = formData.days.some(day => new Date(day.date).toDateString() === dateString);
  
   return !isAlreadySelected && formData.days.length >= MAX_DATES;
 };


 const selectedDates = formData.days.map(day => new Date(day.date));
 const sortedDays = [...formData.days].sort((a, b) =>
   new Date(a.date).getTime() - new Date(b.date).getTime()
 );


 return (
   <div className="max-w-6xl mx-auto">
     <h2 className="text-xl font-semibold mb-4 mt-8">Select Dates and Times</h2>
     <div className="grid grid-cols-2 gap-6 mt-6">
       <div className="items-start w-full h-full">
       {errors.length > 0 && (
       <div>
           {errors.map((error, index) => (
             <p key={index} className="ml-2 text-red-500">{error}</p>
           ))}
       </div>
     )}
         <Calendar
           mode="multiple"
           selected={formData.days.map(day => new Date(day.date))}
           onSelect={(_, selectedDay) => {
             if (selectedDay) {
               addNewDay(selectedDay);
             }
           }}
           disabled={(date) => isDateDisabled(date) || isDateBlocked(date)}
           className="w-full h-full"
         />
       </div>
       <div className="mt-4 space-y-4">
         {/* Sync times checkbox */}
         {formData.days.length >= 2 && (
           <div className="flex items-center mb-4">
             <input
               type="checkbox"
               id="syncTimes"
               checked={formData.syncTimes}
               onChange={handleSyncToggle}
               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
             />
             <label htmlFor="syncTimes" className="ml-2 block text-sm text-gray-900">
               Use same time for all dates
             </label>
           </div>
         )}


         {/* Unified time selection */}
         {formData.syncTimes && formData.days.length >= 2 && (
           <div className="border border-blue-200 p-4 rounded-lg mb-4">
             <h3 className="text-lg font-semibold mb-2">Set Time for All Dates</h3>
             <div className="grid grid-cols-2 gap-4">
               <TimePicker
                 required
                 label="Start Time"
                 value={formData.unifiedStartTime}
                 onChange={(time) => handleUnifiedTimeChange(time, 'startTime')}
               />
               <TimePicker
                 required
                 label="End Time"
                 value={formData.unifiedEndTime}
                 onChange={(time) => handleUnifiedTimeChange(time, 'endTime')}
                 startTime={formData.unifiedStartTime}
                 isEndTime={true}
               />
             </div>
           </div>
         )}
        
         {/* Selected dates */}
         {[...formData.days].sort((a, b) =>
           new Date(a.date).getTime() - new Date(b.date).getTime()
         ).map((day, index) => (
           <div key={new Date(day.date).toISOString()} className="border p-4 rounded-lg">
             <h3 className="text-lg font-semibold">
               {new Date(day.date).toDateString()}
             </h3>
             {!formData.syncTimes ? (
               <div className="grid grid-cols-2 gap-4 mt-2">
                 <TimePicker
                   required
                   label="Start Time"
                   value={day.startTime}
                   onChange={(time) => handleIndividualTimeChange(time, 'startTime', index)}
                 />
                 <TimePicker
                   required
                   label="End Time"
                   value={day.endTime}
                   onChange={(time) => handleIndividualTimeChange(time, 'endTime', index)}
                   startTime={day.startTime}
                   isEndTime={true}
                 />
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-4 mt-2">
                 <div>
                   <p className="text-sm font-medium">Start Time</p>
                   <p className="mt-1">{day.startTime || 'No time selected'}</p>
                 </div>
                 <div>
                   <p className="text-sm font-medium">End Time</p>
                   <p className="mt-1">{day.endTime || 'No time selected'}</p>
                 </div>
               </div>
             )}
           </div>
         ))}
       </div>
     </div>
     <div className="mt-4 flex justify-end">
     <button
       onClick={handleNext}
       className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
     >
       Next
     </button>
     </div>
   </div>
 );
}


function TimePicker({
  label,
  value,
  onChange,
  startTime,
  isEndTime = false,
  required = true
 }: {
  label: string;
  value: string | null;
  onChange: (time: string) => void;
  startTime?: string | null;
  isEndTime?: boolean;
  required?: boolean;
 }) {
  const isFirstSelection = React.useRef(true);
  const [showError, setShowError] = React.useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
 

  // Listen for validation attempts from parent
  React.useEffect(() => {
   const handleNextClick = () => {
     setHasAttemptedSubmit(true);
   };


   document.addEventListener('click', (e) => {
     if ((e.target as HTMLElement).textContent?.includes('Next')) {
       handleNextClick();
     }
   });


   return () => {
     document.removeEventListener('click', handleNextClick);
   };
 }, []);


 const validateTimeOrder = React.useCallback((currentTime: string) => {
   if (!isEndTime || !startTime) return false;


   const startMinutes = timeToMinutes(startTime);
   const endMinutes = timeToMinutes(currentTime);
  
   if (startMinutes === -1 || endMinutes === -1) return false;
   return endMinutes <= startMinutes;
 }, [isEndTime, startTime]);


 const parseTime = (timeString: string | null): { hour: string; minute: string } => {
   if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') {
     return { hour: '--', minute: '--' };
   }
  
   const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
   if (match) {
     const [_, hours, minutes, period] = match;
     const hour = `${hours.padStart(2, '0')} ${period}`;
     return { hour, minute: minutes };
   }
   return { hour: '--', minute: '--' };
 };


 const [localHour, setLocalHour] = React.useState<string>(() => parseTime(value).hour);
 const [localMinute, setLocalMinute] = React.useState<string>(() => parseTime(value).minute);
 const [isInvalid, setIsInvalid] = React.useState(false);


 // Listen for parent validation triggers
 React.useEffect(() => {
   if (hasAttemptedSubmit) {
     setShowError(required && (localHour === '--' || localMinute === '--'));
   }
 }, [hasAttemptedSubmit, required, localHour, localMinute]);


 const formatTime = (hour: string, minute: string): string => {
   if (hour === '--' || minute === '--') {
     return '--:-- AM';
   }
   return `${hour.split(' ')[0]}:${minute} ${hour.split(' ')[1]}`;
 };


 // Convert time string to minutes since midnight for comparison
 const timeToMinutes = (timeString: string | null): number => {
   if (!timeString || timeString === '--:-- AM' || timeString === '--:-- PM') return -1;
  
   const match = timeString.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
   if (!match) return -1;
  
   let [_, hours, minutes, period] = match;
   let hour = parseInt(hours);
  
   // Convert to 24-hour format
   if (period === 'PM' && hour !== 12) hour += 12;
   if (period === 'AM' && hour === 12) hour = 0;
  
   return hour * 60 + parseInt(minutes);
 };


 // Validate times whenever either time changes
 const validateTimes = React.useCallback((currentTime: string) => {
   if (!isEndTime || !startTime) return false;


   const startMinutes = timeToMinutes(startTime);
   const endMinutes = timeToMinutes(currentTime);
  
   if (startMinutes === -1 || endMinutes === -1) return false;
   return endMinutes <= startMinutes;
 }, [isEndTime, startTime]);



 const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newHour = e.target.value;
  setLocalHour(newHour);
 
  if (newHour !== '--') {
    // Automatically set minutes to '00' when hour is selected
    setLocalMinute('00');
    const formattedTime = formatTime(newHour, '00');
    setIsInvalid(validateTimes(formattedTime));
    onChange(formattedTime);
    if (hasAttemptedSubmit) {
      setShowError(false);
    }
  } else {
    setIsInvalid(false);
    onChange('--:-- AM');
    if (hasAttemptedSubmit) {
      setShowError(true);
    }
  }
 
  isFirstSelection.current = false;
};


const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newMinute = e.target.value;
  setLocalMinute(newMinute);
 
  if (localHour !== '--' && newMinute !== '--') {
    const formattedTime = formatTime(localHour, newMinute);
    setIsInvalid(validateTimes(formattedTime));
    onChange(formattedTime);
    if (hasAttemptedSubmit) {
      setShowError(false);
    }
  } else if (newMinute === '--') {
    setIsInvalid(false);
    onChange('--:-- AM');
    if (hasAttemptedSubmit) {
      setShowError(true);
    }
  }
 
  isFirstSelection.current = false;
};


 // Sync with parent value changes
 React.useEffect(() => {
   if (!isFirstSelection.current) {
     const parsed = parseTime(value);
     setLocalHour(parsed.hour);
     setLocalMinute(parsed.minute);
   }
 }, [value]);


 // Validate on startTime changes
 React.useEffect(() => {
   if (value && startTime && isEndTime) {
     setIsInvalid(validateTimeOrder(value));
   }
 }, [startTime, value, isEndTime, validateTimeOrder]);


 const hours = [
   '--',
   '08 AM', '09 AM', '10 AM', '11 AM', '12 PM',
   '01 PM', '02 PM', '03 PM', '04 PM'
 ];


 const minutes = ['--', '00', '15', '30', '45'];


 const selectClassName = `border rounded-md p-2 w-auto ${
   isInvalid ? 'border-red-500' :
   showError ? 'border-red-500' :
   'border-gray-300'
 }`;


 return (
   <div>
     <label className="block text-sm font-medium mb-1">
       {label}
       {required && <span className="text-red-500 ml-1">*</span>}
     </label>


     <div className="flex space-x-2">
       <select
         className={selectClassName}
         value={localHour}
         onChange={handleHourChange}
         required={required}
       >
         {hours.map(hourValue => (
           <option key={hourValue} value={hourValue}>{hourValue}</option>
         ))}
       </select>


       <select
         className={selectClassName}
         value={localMinute}
         onChange={handleMinuteChange}
         required={required}
       >
         {minutes.map(minuteValue => (
           <option key={minuteValue} value={minuteValue}>{minuteValue}</option>
         ))}
       </select>
     </div>


     <div className="mt-1">
       {isInvalid && (
         <span className="text-red-500 text-sm block">
           End time must be after start time
         </span>
       )}
       {showError && (
         <span className="text-red-500 text-sm block">
           This field is required
         </span>
       )}
     </div>
   </div>
 );
}


interface ReviewSubmitProps {
 formData: FormData;
 prevStep: () => void;
}