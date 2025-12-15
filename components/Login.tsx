import React, { useState } from 'react';
import { Button } from './Button';
import { backend } from '../services/backend';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lazy initialization to get domain immediately
  const [currentDomain] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname || window.location.host || 'localhost';
    }
    return '';
  });

  const handleError = (err: any) => {
    console.error("Auth Error:", err);
    
    if (err.code === 'auth/unauthorized-domain') {
      setError(`Domain Unauthorized: The current domain is not whitelisted in Firebase.`);
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError(null);
    } else if (err.message && err.message.includes('unauthorized-domain')) {
       setError(`Domain Unauthorized: Add "${currentDomain}" to Firebase Console.`);
    } else {
      setError(err.message || 'Authentication failed');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await backend.signUpWithEmail(email, password, name);
      } else {
        await backend.signInWithEmail(email, password);
      }
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await backend.signInWithGoogle();
    } catch (err: any) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SyncFocus</h1>
          <p className="text-gray-400">Collaborative Pomodoro Timer for Teams</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm break-words">
            <p className="font-bold mb-1">Error:</p>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
              <input
                type="text"
                required
                className="w-full bg-gray-800 border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-gray-800 border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-gray-800 border-gray-700 rounded-lg text-white focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-800"></div>
          <span className="px-4 text-xs text-gray-500 uppercase">Or continue with</span>
          <div className="flex-1 border-t border-gray-800"></div>
        </div>

        <Button 
          variant="secondary" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
          </svg>
          Google
        </Button>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* Domain Helper */}
        <div className="mt-8 pt-4 border-t border-gray-800">
           <p className="text-gray-500 text-xs mb-2 text-center">
             Detected Domain (Add to Firebase Console &gt; Auth &gt; Settings):
           </p>
           <input 
             type="text" 
             readOnly 
             value={currentDomain}
             className="w-full bg-gray-950 border border-indigo-500/30 rounded px-3 py-2 text-xs text-indigo-300 font-mono text-center focus:outline-none focus:border-indigo-500 select-all"
             onClick={(e) => e.currentTarget.select()}
           />
        </div>
      </div>
    </div>
  );
};