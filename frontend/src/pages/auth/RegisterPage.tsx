import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, ArrowRight, AlertCircle, ShoppingCart, Truck } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeInUp } from '@/utils/animations';

const schema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  companyDomain: z.string().min(3, 'Domain required').regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain (e.g. acme.com)'),
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

type FormData = z.infer<typeof schema>;
type CompanyType = 'BUYER' | 'SUPPLIER';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [companyType, setCompanyType] = useState<CompanyType>('BUYER');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const result = await authApi.register({ ...data, companyType });
      setAuth(result.user, result.company, result.accessToken, result.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-2xl mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1 text-sm">Start finding vendors with AI in minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Buyer / Supplier toggle */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I am a...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCompanyType('BUYER')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  companyType === 'BUYER'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  companyType === 'BUYER' ? 'bg-brand-500' : 'bg-gray-100'
                }`}>
                  <ShoppingCart className={`w-5 h-5 ${companyType === 'BUYER' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${companyType === 'BUYER' ? 'text-brand-700' : 'text-gray-700'}`}>
                    Buyer
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">I procure products or services</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCompanyType('SUPPLIER')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  companyType === 'SUPPLIER'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  companyType === 'SUPPLIER' ? 'bg-brand-500' : 'bg-gray-100'
                }`}>
                  <Truck className={`w-5 h-5 ${companyType === 'SUPPLIER' ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="text-center">
                  <div className={`text-sm font-semibold ${companyType === 'SUPPLIER' ? 'text-brand-700' : 'text-gray-700'}`}>
                    Supplier
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">I supply products or services</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input
                  label="Company name"
                  placeholder="Acme Corporation"
                  error={errors.companyName?.message}
                  {...register('companyName')}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Company domain"
                  placeholder="acme.com"
                  error={errors.companyDomain?.message}
                  {...register('companyDomain')}
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <Input
                label="Your name"
                placeholder="Jane Smith"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            <Input
              label="Work email"
              type="email"
              placeholder="jane@acme.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="w-full"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
