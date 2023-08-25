# Cinema Website

## Overview

This is a website of a small cinema that lists all screenings with an optional genre filtering functionality.

## Technologies
- **React**
- **Vite**
- **React Router**
- **React Bootstrap**

## Getting Started

To run the program, follow these steps:

1. **Clone this repository** to your local machine.
2. **Go to the project directory.**
3. **Install Dependencies**: `npm install`
4. **Start the Development Server**: `npm run dev`
5. **Access the App**: Open your web browser and navigate to the provided local host link.

## React Components

- **App**:
    - Sets up the React Routes.
- **Projections**:
    - Sorts the projections by date, hour and minutes.
    - Creates the main page that lists all sorted projections.
    - Implements a genre filtering select option.
    - Displays the title of the selected genre.
    - Sets up the necessary global variables.
- **Header**
    - Displays the header of the app.
- **Projections Timetable**:
    - Creates a container with movies from a particular date along with a weekday title.
- **Movie**:
    - Creates a card that displays the movie image, title, genre, and movie length.

## Task Requirements

- View a list of movie screenings sorted by the date they are shown.
- Each screening should display:
  - Date and time of the screening.
  - Title of the movie.
  - Movie poster.
  - Length of the movie in hours and minutes.
- Screenings should be organized under separate headlines, with each headline displaying the date and weekday.
- Filter the list of screenings by category.
- Divide things into several different components.

## Future Features

- Tickets booking system
