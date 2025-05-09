import Link from 'next/link';

export default function PasswordResetConfirmation() {
  return (
    <div className="max-w-md mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Check Your Email</h2>
      <p className="mb-6">
                If an account exists with the email you provided, we&#39;ve sent instructions to reset your password.
      </p>
      <p className="mb-4">
                Remember to check your spam folder if you don&#39;t see the email in your inbox.
      </p>
      <Link
        href="/login"
        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
                Return to Login
      </Link>
    </div>
  );
}