// import neccessary hooks form React
import { useEffect } from 'react';
import { useStates } from '../utilities/states';

import Movie from "../components/Movie";

export default function ProjectionsTimetable({ projections, date }) {

    const s = useStates('main');

    function getDayOfWeek(dateString) {
        const date = new Date(dateString);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = daysOfWeek[date.getDay()];
        return dayOfWeek;
    }

    function formatDate(inputDate) {
        const parts = inputDate.split('-');
        if (parts.length !== 3) {
            throw new Error('Invalid date format. Expected "YYYY-MM-DD".');
        }

        const year = parts[0];
        const month = parts[1];
        const day = parts[2];

        return `${day}/${month}/${year}`;
    }

    return (

        <div className='movies-by-date'>
            <h3 className='movies-week-day-title'>{getDayOfWeek(date)} </h3>
            <h4 className='movies-date-title'>{formatDate(date)} </h4>
            {Object.keys(projections[date]).map(hour => (
                <div key={hour} >

                    {Object.keys(projections[date][hour]).map(minutes => (
                        <div className='movies-by-hours' key={`${hour}-${minutes}`}>
                            <h4>{hour} : {minutes}</h4>

                            <div className='movies'>
                                {projections[date][hour][minutes].map(projection => (
                                    <Movie key={projection.id} projection={projection} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>

    )
}
