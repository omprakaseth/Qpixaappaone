export interface Post {
  id: string;
  title: string;
  imageUrl: string;
  creator: {
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
}

const creators = [
  { name: 'Qpixa', username: '@qpixa', avatar: '', initials: 'QP', isVerified: true },
  { name: 'NeonArtist', username: '@neonartist', avatar: '', initials: 'NA' },
  { name: 'AnimeVault', username: '@animevault', avatar: '', initials: 'AV' },
  { name: 'SpeedDemon', username: '@speeddemon', avatar: '', initials: 'SD' },
  { name: 'DragonLore', username: '@dragonlore', avatar: '', initials: 'DL' },
  { name: 'PixelDream', username: '@pixeldream', avatar: '', initials: 'PD' },
  { name: 'CosmicArt', username: '@cosmicart', avatar: '', initials: 'CA' },
  { name: 'NatureLens', username: '@naturelens', avatar: '', initials: 'NL' },
  { name: 'PortraitPro', username: '@portraitpro', avatar: '', initials: 'PP' },
];

const categories = ['Trending', 'Portrait', 'Anime', 'Cars', 'Fantasy', 'Nature'];
const styles = ['Cinematic', 'Photorealistic', 'Digital Art', 'Oil Painting', 'Watercolor', 'Pixel Art'];

const titles = [
  'Cyberpunk City Rain', 'Cherry Blossom Dream', 'Midnight Racer', 'Aurora Dragon',
  'Enchanted Forest', 'Neon Samurai', 'Ocean Depths', 'Crystal Palace',
  'Desert Nomad', 'Starship Bridge', 'Mountain Spirit', 'Urban Jungle',
  'Phantom Rider', 'Cosmic Garden', 'Winter Wolf', 'Golden Temple',
  'Storm Chaser', 'Pixel Paradise', 'Shadow Dancer', 'Solar Eclipse',
];

const prompts = [
  'A cyberpunk city street at night in the rain, neon signs reflecting on wet pavement, cinematic lighting, ultra detailed',
  'Beautiful anime girl with white hair surrounded by cherry blossoms, soft pastel colors, dreamy atmosphere',
  'Sleek sports car racing through city at midnight, red tail lights streaking, rain on asphalt, photorealistic',
  'Majestic dragon silhouette against aurora borealis over mountain peaks, fantasy art, dramatic lighting',
  'Ancient enchanted forest with glowing mushrooms and fairy lights, mystical atmosphere, digital painting',
  'Cyberpunk samurai warrior with neon katana, rain-soaked alley, volumetric lighting, highly detailed',
  'Deep ocean underwater scene with bioluminescent creatures, god rays penetrating water surface',
  'Crystal palace floating in the clouds, iridescent reflections, fantasy architecture, ethereal light',
];

const imageUrls = [
  'https://images.unsplash.com/photo-1555448248-2571daf6344b?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function generatePosts(count: number, offset = 0): Post[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = (offset + i) % titles.length;
    const creator = creators[idx % creators.length];
    const views = randomInt(5000, 80000);
    return {
      id: `post-${offset + i}`,
      title: titles[idx],
      imageUrl: imageUrls[(offset + i) % imageUrls.length],
      creator,
      prompt: prompts[idx % prompts.length],
      tags: ['ai', 'digital', categories[idx % categories.length].toLowerCase()],
      category: categories[idx % categories.length],
      style: styles[idx % styles.length],
      aspectRatio: '1:1',
      views,
      likes: randomInt(1000, 10000),
      saves: randomInt(200, 5000),
      comments: randomInt(50, 2000),
      createdAt: new Date(Date.now() - randomInt(0, 30) * 86400000).toISOString(),
      isLiked: false,
      isSaved: false,
    };
  });
}

export { formatCount };

export function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}