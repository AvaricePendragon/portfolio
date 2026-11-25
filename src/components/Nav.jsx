import { NavLink } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="nav" aria-label="Primary navigation">
      <NavLink to="/" end><span>01</span>About</NavLink>
      <NavLink to="/projects"><span>02</span>Projects</NavLink>
      <NavLink to="/writing"><span>03</span>Writing</NavLink>
      <NavLink to="/cabinet"><span>04</span>Cabinet</NavLink>
    </nav>
  )
}
