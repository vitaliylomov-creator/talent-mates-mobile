import { Redirect } from 'expo-router';

// Stub — wired in D2 alongside sign-in.
export default function SignUp() {
  return <Redirect href="/(auth)/sign-in" />;
}
