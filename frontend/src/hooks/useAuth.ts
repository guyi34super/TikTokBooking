import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, login, logout, register, LoginRequest, User } from '../services/api';

export const useAuth = () => {
  const queryClient = useQueryClient();

  // Get current user
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return null;

      try {
        return await getCurrentUser();
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return null;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isUserLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
};
