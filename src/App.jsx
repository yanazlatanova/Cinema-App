import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Projections from "./pages/Projections"


export default function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Projections />}></Route>
        </Routes>
      </Router>
  )
}