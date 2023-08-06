// import neccessary hooks form React
import { useEffect } from 'react';
import { useStates } from '../utilities/states';

// import our Movie component
import ProjectionsTimetable from "../components/ProjectionsTimetable";

export default function Projections() {

  // State variable that stores the movies infromation
  // const [movies, setMovies] = useState([]) 

  const s = useStates('main', {
    movies: [],
    screenings: []
  });

  // Run only on a hard reload when all applications start
  useEffect(() => {
    (async () => {
      s.movies = await (await (fetch('/api/movies'))).json();
      s.screenings = await (await (fetch('/api/screenings'))).json();
    })();
  }, []);

  function getSortedProjections() {
    // Get screenings sorted by date, hour and minutes
    const sortedProjections = {};

    s.screenings.forEach(screening => {
      const date = screening.time.slice(0, 10)
      const hour = screening.time.slice(11, 13)
      const minutes = screening.time.slice(14, 16);

      // console.log(date, hour, minutes);
      // const movie = s.movies.find(movie => movie.id === screening.movieId)

      if (!sortedProjections[date]) {
        sortedProjections[date] = {};
      }

      if (!sortedProjections[date][hour]) {
        sortedProjections[date][hour] = []
      }

      if (!sortedProjections[date][hour][minutes]) {
        sortedProjections[date][hour][minutes] = []
      }

      sortedProjections[date][hour][minutes].push(screening)

    });

    return sortedProjections;
  }


  //console.log(getSortedProjections());

  return (
    <>
      <div className="container">
        {Object.keys(getSortedProjections()).map((date, i) => {
          return (<ProjectionsTimetable projections={getSortedProjections()} date={date} />)
        })}

      </div>
    </>
  )
}