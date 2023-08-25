// import neccessary hooks form React
import { useEffect } from 'react';
import { useStates } from '../utilities/states';

// import our Movie component
import ProjectionsTimetable from "../components/ProjectionsTimetable";
import Header from "../components/Header";

export default function Projections() {

  // State variable that stores the movies infromation
  // const [movies, setMovies] = useState([]) 

  const s = useStates('main', {
    movies: [],
    screenings: [],
    categories: [],
    selectedCategory: ''
  });

  // Run only on a hard reload when all applications start
  useEffect(() => {
    (async () => {
      s.movies = await (await (fetch('/api/movies'))).json();
      s.screenings = await (await (fetch('/api/screenings'))).json();
      s.categories = await (await (fetch('/api/categories'))).json();
    })();
  }, []);

  const handleSelectChange = (event) => {
    s.selectedCategory = event.target.value;
  };

  function getSortedProjections() {
    // Get screenings sorted by date, hour and minutes
    const sortedProjections = {};

    s.screenings.forEach(screening => {
      const date = screening.time.slice(0, 10)
      const hour = screening.time.slice(11, 13)
      const minutes = screening.time.slice(14, 16);
      const movie = s.movies.find(m => m.id === screening.movieId)

      // Skip the movies that are not from the selected category
      if (s.selectedCategory && movie && !movie.description.categories.includes(s.selectedCategory)) {
        return;
      }

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

  return (
    <>
    <Header/>

      <div className='container'>

        <div className='category-selector-container'>
          <select className='category-selector' value={s.selectedCategory} onChange={handleSelectChange}>
            <option value="">All categories</option>
            {s.categories.map((category) => (
              <option key={category.id} value={category.title}>
                {category.title}
              </option>
            ))}
          </select>

        </div>


        {s.selectedCategory && (
          <div className='category-title'>
            <h3>{s.selectedCategory}</h3>
          </div>
        )}

        <div className="container">
          {Object.keys(getSortedProjections()).map((date, i) => {
            return (<ProjectionsTimetable projections={getSortedProjections()} date={date} />)
          })}

        </div>


      </div>
    </>
  )
}