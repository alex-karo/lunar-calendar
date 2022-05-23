import React, { useEffect, useState } from 'react';
import './App.css';
import FullCalendar from '@fullcalendar/react'
import timeGridWeek from '@fullcalendar/timegrid'
import addDays from 'date-fns/addDays';
import { createTimeOfInterest } from 'astronomy-bundle/time';
import { createSun } from 'astronomy-bundle/sun';
import { createMoon } from 'astronomy-bundle/moon';
import { EventSourceInput } from '@fullcalendar/common';
import subDays from 'date-fns/subDays';

type Day = {
  start: Date;
  end: Date;
  count: number;
};

type ActromomicEvent = { sunRise?: Date, sunSet?: Date, moonRise?: Date, moonSet?: Date };

type Phase = { Date: string, Phase: 0 | 1 | 2 | 3 };

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
  0: "🌑 Новолуние", // New Moon
  1: "🌓 Первая четверть", // First Quarter
  2: "🌕 Полнолуние", // Full Moon
  3: "🌗 Третья четверть", // Last Quarter
};

type Location = {
  lat: number;
  lon: number;
}

const spb = {
  lon: 30.3388,
  lat: 59.9446,
};

async function getAstronomicEvents(location: Location): Promise<ActromomicEvent[]> {
  const start = subDays(Date.now(), 30);
  const promises = Array(400)
    .fill(null)
    .map((_, i): Date => addDays(start, i))
    .map(async (date) => {
      const toi = createTimeOfInterest.fromDate(date);
      const sun = createSun(toi);
      const moon = createMoon(toi);
      const [
        sunRise,
        sunSet,
        moonRise,
        moonSet,
      ] = await Promise.allSettled([
        sun.getRise(location),
        sun.getSet(location),
        moon.getRise(location),
        moon.getSet(location),
      ]);
      return {
        // @ts-ignore
        sunRise: sunRise.value?.getDate(),
        // @ts-ignore
        sunSet: sunSet.value?.getDate(),
        // @ts-ignore
        moonRise: moonRise.value?.getDate(),
        // @ts-ignore
        moonSet: moonSet.value?.getDate(),
      };
    });
  return  Promise.all(promises);
}

async function getMoonPhases(year: number): Promise<Phase[]> {
  const res = await fetch(
    `https://raw.githubusercontent.com/CraigChamberlain/moon-data/master/api/moon-phase-data/${year}/index.json`,
  );
  return await res.json();
}

function App() {
  const [location, setLocation] = useState<Location>(spb);
  const [days, setDays] = useState<Day[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [astronomicData, setAstronomicData] = useState<ActromomicEvent[]>([]);
  useEffect(() => {
    (async () => {
      const data = await getMoonPhases(new Date().getFullYear());
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
          count: phaseCount * 7 + i + 1,
        })));
      }
      setDays(days);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const events = await getAstronomicEvents(location);
      setAstronomicData(events);
    })();
  }, [location]);
  
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(({coords}) => {
      const {latitude, longitude} = coords;
      setLocation({lat: latitude, lon: longitude});
    }, (e) => console.warn(e), {});
  }, []);

  const dayEvents: EventSourceInput[] = days.map(({ start, end, count }) => ({
    start,
    end,
    title: `День ${count} (${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')})`,
    display: 'background',
    backgroundColor: colors[(count - 1) % 7],
  }));

  const phaseEvents = phases.map(({ Date, Phase }) => ({
    start: Date,
    end: Date,
    title: MOON_PHASES[Phase],
  }));

  const astronomicEvents = astronomicData.flatMap(({moonRise, moonSet, sunRise, sunSet}) => [
    { start: sunRise, end: sunRise, title: '☀️ ⬆️', backgroundColor: 'yellow', textColor: 'black' },
    { start: sunSet, end: sunSet, title: '☀️ ⬇️', backgroundColor: 'yellow', textColor: 'black' },
    { start: moonRise, end: moonRise, title: '🌙 ⬆️', backgroundColor: 'darkgrey' },
    { start: moonSet, end: moonSet, title: '🌙 ⬇️', backgroundColor: 'darkgrey' },
  ])
    .filter(ev => ev);

  return (
    <div className="App">
      <FullCalendar
        plugins={[timeGridWeek]}
        initialView="timeGridWeek"
        // @ts-ignore
        events={[
          ...dayEvents,
          ...phaseEvents,
          ...astronomicEvents,
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
