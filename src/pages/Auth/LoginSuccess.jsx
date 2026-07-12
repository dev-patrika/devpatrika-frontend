import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const err = searchParams.get('error');

      if (err) {
        setError(err);
        toast.error(`Login failed: ${err}`);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (token) {
        // Save token to Zustand & localStorage
        setToken(token);

        try {
          // Fetch user profile immediately
          const res = await api.get('/auth/me');
          setUser(res.data);
          
          toast.success('Successfully logged in!');
          // Redirect to home or intended page
          navigate('/');
        } catch (fetchError) {
          console.error('Failed to fetch user profile after login:', fetchError);
          setError('Failed to fetch user profile');
          setToken(null);
          setTimeout(() => navigate('/'), 3000);
        }
      } else {
        setError('No token provided');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser]);

  return (
    <div className="w-full h-[calc(100vh-5rem)] flex flex-col items-center justify-center text-center">
      {error ? (
        <div className="text-rose-500 font-medium bg-rose-500/10 py-3 px-6 rounded-xl border border-rose-500/20">
          {error}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <h2 className="text-xl font-medium text-zinc-100">Completing Sign In...</h2>
          <p className="text-zinc-400">Please wait while we set up your session.</p>
        </div>
      )}
    </div>
  );
};

export default LoginSuccess;
