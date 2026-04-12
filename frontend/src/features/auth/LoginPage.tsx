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
import { loginSchema } from '@/schemas/auth';
import { CheckSquare } from 'lucide-react';

type FormData = import('zod').infer<typeof loginSchema>;

const LoginPage = () => {
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      const res = await AuthAPI.login(data);
      login(res.token, res.user);
    } catch {
      setServerError('Invalid email/username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-1 pb-4">
          <div className="flex justify-center mb-2">
            <CheckSquare className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">TaskFlow</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Controller
              control={control}
              name="emailOrUsername"
              render={({ field }) => (
                <InputContainer title="Email or Username" error={errors.emailOrUsername?.message}>
                  <Input
                    {...field}
                    id="emailOrUsername"
                    type="text"
                    placeholder="you@example.com or username"
                    autoComplete="username"
                  />
                </InputContainer>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <InputContainer title="Password" error={errors.password?.message}>
                  <Input {...field} id="password" type="password" autoComplete="current-password" />
                </InputContainer>
              )}
            />

            {serverError && <p className="text-sm text-destructive text-center">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="underline text-foreground">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
