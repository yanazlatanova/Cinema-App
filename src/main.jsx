import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './css/index.css'
import './css/movie.css'
import './css/projection.css'
import './css/categorySelector.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import './css/header.css'; // Import the CSS file for styling

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)