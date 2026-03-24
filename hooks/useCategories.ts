'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Category {
  id: string;
  name: string;
  slug: string; // URL-friendly identifier (e.g., "kitchen-accessories")
  description: string;
  image: string;
  createdAt: Date;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'categories'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          slug: doc.data().slug || '', // URL-friendly slug
          description: doc.data().description,
          image: doc.data().image,
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        setCategories(categoriesData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching categories:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { categories, loading, error };
}
