'use client';
import { useState, useEffect, Suspense, FormEvent } from 'react';
import { createClient} from '@/auth/supabase/client';
import { useRouter } from 'next/navigation';
import { AuthError } from '@supabase/supabase-js';

// Loading fallback component
function LoadingSetup() {
  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Loading...</h2>
      <p>Please wait while we prepare your account setup...</p>
    </div>
  );
}

// The actual setup form component
function SetupForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(true);

  // Get URL parameters safely without useSearchParams
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') || 'invite';

      // Only proceed with validation if we have the token
      if (token_hash) {
        validateInvite(token_hash, type);
      } else {
        setError('Invalid invite link - missing token');
        setValidating(false);
      }
    }
  }, []);

  const validateInvite = async (token_hash: string, type: string): Promise<void> => {
    try {
      // Verify the token from the invite link
      // Use the correct type for the specific OTP verification
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'invite', // Fixed type that matches EmailOtpType
      });

      if (verifyError) throw verifyError;

      // If successful, we now have a session with the user's email
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const user = data.user;

      if (user && user.email) {
        setEmail(user.email);
      } else {
        throw new Error('Could not retrieve user information');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired invite link';
      setError(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setLoading(true);

      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      // Redirect to account page after successful password setup
      router.push('/');

    } catch (err) {
      const errorMessage = err instanceof AuthError ? err.message : 'Failed to set password';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Validating Invitation</h2>
        <p>Please wait while we validate your invitation...</p>
      </div>
    );
  }

  if (error && !password && !confirmPassword) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Invalid Invitation</h2>
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
        <p className="mb-4">
                    The invitation link may have expired or is invalid. Please contact your administrator
                    for a new invitation.
        </p>
        <button
          onClick={() => router.push('/auth/login')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
                    Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Complete Your Account Setup</h2>

      {email && (
        <p className="mb-4">
                    Welcome! Please set a password for your account: <strong>{email}</strong>
        </p>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block mb-1">Password:</label>
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
          {loading ? 'Setting up account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}

// Main page component with Suspense boundary
export default function AccountSetupPage() {
  return (
    <Suspense fallback={<LoadingSetup />}>
      <SetupForm />
    </Suspense>
  );
}