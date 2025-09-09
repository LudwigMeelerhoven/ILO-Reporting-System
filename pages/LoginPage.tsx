
import React, { useState } from 'react';
import Button from '../components/Button';
import { ILOLogo, ILO_BLUE } from '../constants';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // For testing, any username/password is valid
    if (username && password) {
      onLoginSuccess();
    } else {
      setError('Please enter both username and password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0055A4] to-[#003366] p-4">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ILOLogo className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold text-center" style={{ color: ILO_BLUE }}>
            Reporting System
          </h1>
          <p className="text-gray-600 mt-1 text-center">Government Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:border-[#0055A4] sm:text-sm"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0055A4] focus:border-[#0055A4] sm:text-sm"
              placeholder="Enter your password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth>
            Log In
          </Button>
        </form>
      </div>
      <footer className="mt-8 text-center text-sm text-white">
        <p>&copy; 2025 International Labour Organization. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
