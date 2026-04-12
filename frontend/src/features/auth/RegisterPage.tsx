import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { AuthAPI } from '@/api/routes/AuthAPI';
import InputContainer from '@/components/ui/InputContainer';
import { useAuth } from '@/context/AuthContext';
import { registerSchema } from '@/schemas/auth';
import { CheckSquare } from 'lucide-react';

type FormData = import('zod').infer<typeof registerSchema>;

const RegisterPage = () => {
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await AuthAPI.register(data);
      login(res.token, res.user);
    } catch {
      setServerError('Registration failed. Email or Username may already be in use.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <CheckSquare className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Get started with TaskFlow</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <InputContainer title="Name" error={errors.name?.message}>
                  <Input {...field} id="name" placeholder="Jane Doe" autoComplete="name" />
                </InputContainer>
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <InputContainer title="Username" error={errors.username?.message}>
                  <Input {...field} id="username" placeholder="janedoe" autoComplete="username" />
                </InputContainer>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <InputContainer title="Email" error={errors.email?.message}>
                  <Input
                    {...field}
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </InputContainer>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <InputContainer title="Password" error={errors.password?.message}>
                  <Input {...field} id="reg-password" type="password" autoComplete="new-password" />
                </InputContainer>
              )}
            />

            {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="underline text-foreground">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
