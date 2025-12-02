export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}