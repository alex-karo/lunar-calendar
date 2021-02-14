import React, { useEffect, useState } from 'react';
import './App.css';
import FullCalendar from '@fullcalendar/react'
import timeGridWeek from '@fullcalendar/timegrid'

type Day = {
  start: Date;
  end: Date;
  count: number;
};

const colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'skyblue',
  'blue',
  'darkmagenta',
];

function getDayName(count: number): string {
  if (count === 1) {
    return ' (New Moon)';
  }
  if (count === 15) {
    return ' (Full Moon)';
  }
  return '';
}

function App() {
  const [dates, setDates] = useState<Day[] | null>(null);
  useEffect(() => {
    (async () => {
      const res = await fetch('https://raw.githubusercontent.com/CraigChamberlain/moon-data/master/api/new-moon-data/2021/index.json');
      const data = await res.json();
      const days: Day[] = [];
      for (let i = 0; i < data.length - 1; i += 1) {
        const prevMoon = new Date(data[i]).getTime();
        const nextMoon = new Date(data[i + 1]).getTime();
        const dayDuration = Math.floor((nextMoon - prevMoon) / 28);
        days.push(...Array(28).fill(null).map((_, i) => ({
          start: new Date(prevMoon + dayDuration * i),
          end: new Date(prevMoon + dayDuration * (i + 1)),
          count: i + 1,
        })));
      }
      setDates(days);
    })();
  }, [])

  if (dates === null) {
    return null;
  }

  return (
    <div className="App">
      <FullCalendar
        plugins={[ timeGridWeek ]}
        initialView="timeGridWeek"
        events={dates.map(({start, end, count}) => ({
          start,
          end,
          title: `Day ${count}${getDayName(count)}`,
          display: 'background',
          backgroundColor: colors[(count - 1) % 7],
          textColor: 'black',
        }))}
        slotDuration={{ hours: 1 }}
        allDaySlot={false}
        height={'auto'}
        firstDay={1}
        locale={'ru'}
        nowIndicator={true}
      />
    </div>
  );
}

export default App;
