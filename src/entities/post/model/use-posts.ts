import { reportSource } from '../../../shared/diagnostics/source-status';
import { useEffect, useState } from 'react';
import { Post } from './types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/posts.json')
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить каталог постов');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setPosts(data);
          setIsLoading(false);
          reportSource('posts', true, `постов: ${Array.isArray(data) ? data.length : '?'}`);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Ошибка загрузки данных');
          reportSource('posts', false, err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { posts, isLoading, error };
}
