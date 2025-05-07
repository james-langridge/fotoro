import { requestPasswordReset } from './actions';

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>
      <p className="mb-4">Enter your email address and we&#39;ll send you a link to reset your password.</p>

      <form className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-1">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          formAction={requestPasswordReset}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
                    Send Reset Link
        </button>
      </form>
    </div>
  );
}