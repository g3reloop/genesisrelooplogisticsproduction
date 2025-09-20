import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import { UserRole } from '../../types';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/');
        setDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderDropdown = () => (
        <div 
            ref={dropdownRef}
            className="relative"
            aria-label="User menu"
        >
            <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
            >
                <span>{user?.name}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {dropdownOpen && (
                <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 border" 
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border-color)' }}
                    role="menu"
                    aria-orientation="vertical"
                >
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-[var(--card-bg)]" role="menuitem" onClick={() => setDropdownOpen(false)}>Profile</Link>
                    {user?.role === UserRole.DRIVER && <Link to="/earnings" className="block px-4 py-2 text-sm hover:bg-[var(--card-bg)]" role="menuitem" onClick={() => setDropdownOpen(false)}>Earnings</Link>}
                    {user?.role === UserRole.SUPPLIER && <Link to="/history" className="block px-4 py-2 text-sm hover:bg-[var(--card-bg)]" role="menuitem" onClick={() => setDropdownOpen(false)}>History & Rebates</Link>}
                    <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-[var(--card-bg)]" role="menuitem" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    <div className="border-t my-1" style={{ borderColor: 'var(--border-color)' }}></div>
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-[var(--card-bg)]" role="menuitem">Logout</button>
                </div>
            )}
        </div>
    );

    return (
        <header 
            className="sticky top-0 z-50 border-b" 
            style={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--border-color)', 
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
            }}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 text-xl font-bold" style={{ color: 'var(--primary)' }}>
                        <svg className="w-8 h-8" viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M42.3,21.7C38,17.4,32.1,15,26,15c-4.6,0-8.9,1.5-12.6,4.2c-2,1.5-3.1,3.9-2.7,6.3c0.4,2.4,2.4,4.3,4.8,4.7 c2.4,0.4,4.8-0.7,6.3-2.7C23.2,26.1,24.5,25,26,25c2.8,0,5,2.2,5,5s-2.2,5-5,5c-1.5,0-2.8-0.7-3.7-1.8c-1.5-2-3.9-3.1-6.3-2.7 c-2.4,0.4-4.3,2.4-4.7,4.8c-0.4,2.4,0.7,4.8,2.7,6.3C21.7,42.3,21.7,42.3,21.7,42.3C17.4,38,15,32.1,15,26c0-4.6,1.5-8.9,4.2-12.6 c1.5-2,3.9-3.1,6.3-2.7c2.4,0.4,4.3,2.4,4.7,4.8c0.4,2.4-0.7,4.8-2.7,6.3C26.1,23.2,25,24.5,25,26c0,2.8,2.2,5,5,5s5-2.2,5-5 c0-1.5-0.7-2.8-1.8-3.7c-2-1.5-3.1-3.9-2.7-6.3c0.4-2.4,2.4-4.3,4.8-4.7c2.4-0.4,4.8,0.7,6.3,2.7C42.3,21.7,42.3,21.7,42.3,21.7z M26,39c4.6,0,8.9-1.5,12.6-4.2c2-1.5,3.1-3.9,2.7-6.3c-0.4-2.4-2.4-4.3-4.8-4.7c-2.4-0.4-4.8,0.7-6.3,2.7 C28.8,27.9,27.5,29,26,29c-2.8,0-5-2.2-5-5s2.2-5,5-5c1.5,0,2.8,0.7,3.7,1.8c1.5,2,3.9,3.1,6.3,2.7c2.4-0.4,4.3-2.4,4.7-4.8 c0.4-2.4-0.7-4.8-2.7-6.3C38,6.6,32.1,4,26,4C11.6,4,4,11.6,4,26c0,14.4,7.6,22,22,22c6.1,0,12-2.6,16.3-6.8 C42.3,41.2,41.2,40.1,42.3,21.7C42.3,21.7,21.7,42.3,21.7,42.3c3.7,2.7,8,4.2,12.6,4.2c6.1,0,12-2.6,16.3-6.8 C54.4,38,52,32.1,52,26c0-6.1-2.6-12-6.8-16.3C41.2,5.6,40.1,6.6,42.3,21.7L42.3,21.7z"/>
                        </svg>
                        <span>Genesis Reloop</span>
                    </Link>

                    <nav className="flex items-center space-x-2">
                        {user ? (
                           renderDropdown()
                        ) : (
                            <>
                                <Button to="/login" variant="secondary" size="sm">Login</Button>
                                <Button to="/signup" size="sm">Sign Up</Button>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;