import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Definición de componentes con estilo
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const DaysOfWeek = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 15px;
  width: 100%;
  text-align: center;
  font-size: 18px;
  color: #333;
`;

const WeekDays = styled.span`
  font-weight: bold;
  font-size: 16px;
  color: #666;
`;

const DayContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  margin: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Event = styled.div`
  background-color: #e6f2ff;
  margin-top: 5px;
  padding: 5px;
  border-radius: 5px;
  border: 1px solid #bee5eb;
`;

const MonthDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 15px;
  width: 100%;
`;

const YearMonths = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 15px;
  width: 100%;
`;

const MonthButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #0056b3;
  }
`;

const MyCustomCalendar = ({ events }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [year, setYear] = useState(selectedDate.getFullYear());
    const [month, setMonth] = useState(selectedDate.getMonth());

    useEffect(() => {
        // Lógica para actualizar eventos basada en selectedDate
    }, [selectedDate]);

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const monthsOfYear = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        name: new Date(year, i).toLocaleString('default', { month: 'long' }),
    }));

    return (
        <CalendarContainer>
            <YearMonths>
                {monthsOfYear.map(({ month, name }, index) => (
                    <MonthButton onClick={() => setMonth(month)} key={index}>
                        {name}
                    </MonthButton>
                ))}
            </YearMonths>
            <DaysOfWeek>
                {daysOfWeek.map((day, index) => (
                    <WeekDays key={index}>{day}</WeekDays>
                ))}
            </DaysOfWeek>
            <MonthDays>
                {getFirstDayOfMonth(new Date(year, month)).getDate() <= 1 ? (
                    <div style={{ gridColumn: 'span 1' }}></div>
                ) : null}
                {[...Array(getDaysInMonth(new Date(year, month))).keys()].map((day) => (
                    <DayContainer key={day}>
                        <span>{day + 1}</span>
                        {events[day + 1]?.map((event, eventIndex) => (
                            <Event key={eventIndex}>{event.name}</Event>
                        ))}
                    </DayContainer>
                ))}
            </MonthDays>
        </CalendarContainer>
    );
};

export default MyCustomCalendar;
