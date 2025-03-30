
import React from 'react';
import ModuleContainer from './ModuleContainer';
import { useAlarms } from './alarms/useAlarms';
import AlarmList from './alarms/AlarmList';
import AddAlarmForm from './alarms/AddAlarmForm';
import { formatRecurringPattern, getWeekdayName, getMonthName } from './alarms/alarmUtils';

interface AlarmsModuleProps {
  title?: string;
  onRemove?: () => void;
  onTitleChange?: (title: string) => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  isDragging?: boolean;
}

const AlarmsModule: React.FC<AlarmsModuleProps> = ({ 
  title = "Alarms",
  onRemove, 
  onTitleChange,
  onMinimize,
  isMinimized = false,
  isDragging = false
}) => {
  const {
    alarms,
    loading,
    newAlarmTitle,
    setNewAlarmTitle,
    newAlarmTime,
    setNewAlarmTime,
    newAlarmDate,
    setNewAlarmDate,
    isRecurring,
    setIsRecurring,
    recurringType,
    setRecurringType,
    recurringInterval,
    setRecurringInterval,
    recurringDays,
    recurringMonths,
    recurringDayOfMonth,
    setRecurringDayOfMonth,
    recurringEndDate,
    setRecurringEndDate,
    isAddAlarmOpen,
    setIsAddAlarmOpen,
    addAlarm,
    toggleAlarm,
    deleteAlarm,
    toggleRecurringDay,
    toggleRecurringMonth
  } = useAlarms();

  if (isMinimized) {
    return (
      <ModuleContainer 
        title={title} 
        onRemove={onRemove}
        onTitleChange={onTitleChange}
        onMinimize={onMinimize}
        isMinimized={isMinimized}
        isDragging={isDragging}
      >
        <div className="flex justify-center items-center py-2">
          <span className="text-sm opacity-70">{alarms.length} alarm{alarms.length !== 1 ? 's' : ''}</span>
        </div>
      </ModuleContainer>
    );
  }

  return (
    <ModuleContainer 
      title={title} 
      onRemove={onRemove}
      onTitleChange={onTitleChange}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
      isDragging={isDragging}
    >
      <AlarmList 
        alarms={alarms}
        loading={loading}
        onToggleAlarm={toggleAlarm}
        onDeleteAlarm={deleteAlarm}
        formatRecurringPattern={formatRecurringPattern}
      />

      <AddAlarmForm 
        isOpen={isAddAlarmOpen}
        setIsOpen={setIsAddAlarmOpen}
        newAlarmTitle={newAlarmTitle}
        setNewAlarmTitle={setNewAlarmTitle}
        newAlarmTime={newAlarmTime}
        setNewAlarmTime={setNewAlarmTime}
        newAlarmDate={newAlarmDate}
        setNewAlarmDate={setNewAlarmDate}
        isRecurring={isRecurring}
        setIsRecurring={setIsRecurring}
        recurringType={recurringType}
        setRecurringType={setRecurringType}
        recurringInterval={recurringInterval}
        setRecurringInterval={setRecurringInterval}
        recurringDays={recurringDays}
        toggleRecurringDay={toggleRecurringDay}
        recurringMonths={recurringMonths}
        toggleRecurringMonth={toggleRecurringMonth}
        recurringDayOfMonth={recurringDayOfMonth}
        setRecurringDayOfMonth={setRecurringDayOfMonth}
        recurringEndDate={recurringEndDate}
        setRecurringEndDate={setRecurringEndDate}
        addAlarm={addAlarm}
        getWeekdayName={getWeekdayName}
        getMonthName={getMonthName}
      />
    </ModuleContainer>
  );
};

export default AlarmsModule;
