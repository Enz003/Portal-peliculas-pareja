export const endpoints = {
  users: '/users',
  me: '/me',
  movies: '/movies',
  movie: (id: string) => `/movies/${id}`,
  moviePerUser: (movieId: string, userId: string) => `/movies/${movieId}/users/${userId}`,
} as const;
