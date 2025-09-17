import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('admin@acme.test');
  const [password, setPassword] = useState('password');
  const [organizationName, setOrganizationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignup) {
        await signup(email, password, organizationName);
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
      } else {
        await login(email, password);
        toast({
          title: 'Success',
          description: 'Logged in successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : isSignup ? 'Signup failed' : 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    // Clear form when switching modes
    if (!isSignup) {
      setEmail('');
      setPassword('');
      setOrganizationName('');
    } else {
      setEmail('admin@acme.test');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">NotesHub</h1>
              <p className="text-muted-foreground mt-2">
                {isSignup ? 'Create your account' : 'Sign in to your account'}
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignup && (
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter your organization name"
                    required={isSignup}
                    disabled={isLoading}
                    data-testid="input-organization"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? "Create a password (min 6 characters)" : "Enter your password"}
                  required
                  disabled={isLoading}
                  data-testid="input-password"
                  minLength={isSignup ? 6 : undefined}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid={isSignup ? "button-signup" : "button-login"}
              >
                {isLoading 
                  ? (isSignup ? 'Creating Account...' : 'Signing In...') 
                  : (isSignup ? 'Create Account' : 'Sign In')
                }
              </Button>
            </form>
            
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-primary hover:underline"
                data-testid="toggle-auth-mode"
              >
                {isSignup 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium text-foreground mb-2">Test Accounts:</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Admin: admin@acme.test / password</div>
                <div>Member: user@acme.test / password</div>
                <div>Admin: admin@globex.test / password</div>
                <div>Member: user@globex.test / password</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
