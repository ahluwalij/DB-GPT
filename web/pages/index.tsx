import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Playground = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page since we removed the Explore tab
    router.replace('/chat');
  }, [router]);

  return null; // Return null since we're redirecting
};

export default Playground;
