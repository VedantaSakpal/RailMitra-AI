import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Train, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');

  const passwordRules = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
  ];

  const mutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword: _, ...payload } = data;
      const response = await api.post('/auth/register', payload);
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.data.token);
      setUser(data.data.user);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to create account');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setErrorMsg('');
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 -left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Train className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">RailMitra AI</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Join Thousands<br />
            of Smart<br />
            <span className="text-purple-200">Commuters</span>
          </h1>
          <p className="text-purple-100 text-lg max-w-md">
            Get AI journey planning, live tracking, crowd predictions, and smart alerts for free.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            'Free journey planning & train search',
            'Real-time crowd & delay predictions',
            'Digital tickets & monthly passes',
            'AI assistant in Hindi, Marathi & English',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-purple-100 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Train className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold">RailMitra AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">Create account</h2>
            <p className="text-muted-foreground mt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  {...register('firstName')}
                  type="text"
                  placeholder="Rahul"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  {...register('lastName')}
                  type="text"
                  placeholder="Sharma"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-12 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicators */}
              {password && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {passwordRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs ${rule.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {rule.label}
                    </span>
                  ))}
                </div>
              )}
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="w-full px-4 py-3 pr-12 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 px-6 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Creating account...
                </>
              ) : (
                'Create free account'
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
              {' '}and{' '}
              <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
