import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const NAV: NavItem[] = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/today', icon: '☀️', label: 'Today' },
  { to: '/learn', icon: '📚', label: 'Learn' },
  { to: '/review', icon: '🔁', label: 'Review' },
  { to: '/progress', icon: '📈', label: 'Progress' },
  { to: '/library', icon: '💡', label: 'Library' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export function Sidebar(): React.JSX.Element {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        Leer <span>Nederlands</span>
      </div>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            'navlink' + (isActive ? ' is-active' : '')
          }
        >
          <span className="navlink__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="navlink__label">{item.label}</span>
        </NavLink>
      ))}
      <div className="sidebar__spacer" />
      <div className="sidebar__foot">Dutch B2 · local-first</div>
    </nav>
  );
}
