import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function NewMoviePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/shared', { replace: true });
  }, [navigate]);
  return null;
}
