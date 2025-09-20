import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SUPPLIER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full p-8 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', boxShadow: `0 0 15px var(--shadow-color)` }}>
        <h2 className="text-3xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>Create Your Genesis Reloop Account</h2>
        {error && <p className="mb-4 text-center text-red-300 bg-red-500 bg-opacity-10 border border-red-500/30 p-3 rounded-md">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="name"
            label="Your Name or Business Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="e.g., The Golden Spoon"
          />
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <div>
            <label htmlFor="role" className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              I am a...
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 block w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 sm:text-sm"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)', 
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--primary)'
              } as React.CSSProperties}
            >
              <option value={UserRole.SUPPLIER}>Supplier (Restaurant, Commercial Kitchen)</option>
              <option value={UserRole.DRIVER}>Driver (Licensed Waste Carrier)</option>
              <option value={UserRole.BUYER}>Buyer (Biofuel Plant)</option>
            </select>
          </div>
          <div>
            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--primary-accent)' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;