export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    initials: string;
    isVerified?: boolean;
  };
  prompt: string;
  tags: string[];
  category: string;
  style: string;
  aspectRatio: string;
  views: number;
  likes: number;
  saves: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
  isSaved: boolean;
  isShort: boolean;
  isMock?: boolean;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  credits: number;
  is_banned: boolean;
  is_verified: boolean;
  subscription_plan: string;
  role?: string;
  created_at: string;
  cover_url: string | null;
}

export interface UploadingPost {
  id: string;
  title: string;
  prompt: string;
  tags: string;
  type: 'post' | 'short';
  file: File | null;
  previewUrl: string | null;
  progress: number;
  status: 'uploading' | 'error' | 'success';
  error?: string;
}
