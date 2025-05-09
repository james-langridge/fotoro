'use client';
import { useState, useEffect } from 'react';
import { createClient} from '@/auth/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if the user has a recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If there's no session, the user might have followed the link but the session is invalid
        setError('Invalid or expired password reset link. Please request a new one.');
      }
    };

    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setMessage('Your password has been updated successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (error && !password && !confirmPassword) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/auth/forgot-password')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
                    Request New Reset Link
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>

      {message && (
        <div className="p-4 bg-green-100 text-green-800 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block mb-1">New Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block mb-1">Confirm Password:</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}