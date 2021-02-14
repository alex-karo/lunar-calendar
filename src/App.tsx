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

const MOON_PHASES = {
  0: "🌑 New Moon",
  1: "🌓 First Quarter",
  2: "🌕 Full Moon",
  3: "🌗 Last Quarter",
};

async function getMoonPhases(year: number): Promise<Array<{ Date: string, Phase: 0 | 1 | 2 | 3 }>> {
  const res = await fetch(
    `https://raw.githubusercontent.com/CraigChamberlain/moon-data/master/api/moon-phase-data/${year}/index.json`,
  );
  return await res.json();
}

function App() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [phases, setPhases] = useState<Array<{ Date: string, Phase: 0 | 1 | 2 | 3 }> | null>(null);
  useEffect(() => {
    (async () => {
      const data = await getMoonPhases(2021);
      setPhases(data);
      const days: Day[] = [];
      for (let i = 0; i < data.length - 1; i += 1) {
        const phaseCount = data[i].Phase;
        const prevPhaseDate = new Date(data[i].Date).getTime();
        const nextPhaseDate = new Date(data[i + 1].Date).getTime();
        const dayDuration = Math.floor((nextPhaseDate - prevPhaseDate) / 7);
        days.push(...Array(7).fill(null).map((_, i) => ({
          start: new Date(prevPhaseDate + dayDuration * i),
          end: new Date(prevPhaseDate + dayDuration * (i + 1)),
          count: phaseCount * 7 + i + 1 ,
        })));
      }
      setDays(days);
    })();
  }, [])

  if (days === null || phases === null) {
    return null;
  }

  const dayEvents = days.map(({start, end, count}) => ({
    start,
    end,
    title: `Day ${count}`,
    display: 'background',
    backgroundColor: colors[(count - 1) % 7],
    textColor: 'black',
  }));

  const phaseEvents = phases.map(({Date, Phase}) => ({
    start: Date,
    end: Date,
    title: MOON_PHASES[Phase],
  }));

  return (
    <div className="App">
      <FullCalendar
        plugins={[ timeGridWeek ]}
        initialView="timeGridWeek"
        events={[
          ...dayEvents,
          ...phaseEvents,
        ]}
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
