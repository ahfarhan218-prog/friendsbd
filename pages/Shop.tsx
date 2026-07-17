import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerToast } from '../components/NotificationToast';
import { apTransactionService } from '../services/apTransactionService';
import { mongoService, API_BASE, getAuthHeaders } from '../services/mongoService';

interface ShopItem {
  name: string;
  price: number;
  icon: string;
  desc: string;
  category: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Items', icon: '📦' },
  { id: 'frames', label: 'Avatar Frames', icon: '🖼️' },
  { id: 'badges', label: 'Badges', icon: '🎖️' },
  { id: 'flairs', label: 'Flairs', icon: '✨' },
  { id: 'themes', label: 'Profile Themes', icon: '🎨' },
  { id: 'gifts', label: 'Gifts', icon: '🎁' },
  { id: 'emotes', label: 'Emotes & Stickers', icon: '😎' },
  { id: 'powerups', label: 'Power-ups', icon: '⚡' },
  { id: 'chat', label: 'Chat Items', icon: '💬' },
  { id: 'game', label: 'Game Items', icon: '🎮' },
  { id: 'special', label: 'Special', icon: '💎' },
];

const ALL_ITEMS: ShopItem[] = [
  { name: 'Fire Frame', price: 500, icon: '🔥', desc: 'Blazing red-orange avatar border', category: 'frames' },
  { name: 'Ice Frame', price: 500, icon: '❄️', desc: 'Frozen blue crystal border', category: 'frames' },
  { name: 'Gold Frame', price: 800, icon: '🪙', desc: 'Luxurious golden border', category: 'frames' },
  { name: 'Neon Frame', price: 600, icon: '💡', desc: 'Glowing neon green border', category: 'frames' },
  { name: 'Royal Frame', price: 1000, icon: '👑', desc: 'Purple & gold royal border', category: 'frames' },
  { name: 'Rainbow Frame', price: 1200, icon: '🌈', desc: 'Colorful rainbow gradient border', category: 'frames' },
  { name: 'Dark Frame', price: 400, icon: '🌑', desc: 'Sleek obsidian black border', category: 'frames' },
  { name: 'Heart Frame', price: 600, icon: '❤️', desc: 'Pink heart-shaped border', category: 'frames' },
  { name: 'Star Frame', price: 700, icon: '⭐', desc: 'Twinkling star-studded border', category: 'frames' },
  { name: 'Skull Frame', price: 900, icon: '💀', desc: 'Edgy skull pattern border', category: 'frames' },
  { name: 'Cyber Frame', price: 1100, icon: '🤖', desc: 'Futuristic cyberpunk border', category: 'frames' },
  { name: 'Nature Frame', price: 500, icon: '🌿', desc: 'Leafy green nature border', category: 'frames' },
  { name: 'Ocean Frame', price: 600, icon: '🌊', desc: 'Deep blue oceanic border', category: 'frames' },
  { name: 'Sunset Frame', price: 700, icon: '🌅', desc: 'Warm sunset gradient border', category: 'frames' },
  { name: 'Galaxy Frame', price: 1500, icon: '🌌', desc: 'Cosmic galaxy sparkling border', category: 'frames' },
  { name: 'Diamond Badge', price: 1200, icon: '💎', desc: 'Shiny diamond achievement badge', category: 'badges' },
  { name: 'Warrior Badge', price: 800, icon: '⚔️', desc: 'Brave warrior emblem', category: 'badges' },
  { name: 'Wizard Badge', price: 800, icon: '🧙', desc: 'Mystical wizard badge', category: 'badges' },
  { name: 'Phoenix Badge', price: 1500, icon: '🦅', desc: 'Risen from ashes phoenix badge', category: 'badges' },
  { name: 'Lion Badge', price: 1000, icon: '🦁', desc: 'Courageous lion crest', category: 'badges' },
  { name: 'Dragon Badge', price: 2000, icon: '🐉', desc: 'Legendary dragon emblem', category: 'badges' },
  { name: 'Heart Badge', price: 400, icon: '💖', desc: 'Loving heart badge', category: 'badges' },
  { name: 'Star Badge', price: 500, icon: '🌟', desc: 'Shining star achievement', category: 'badges' },
  { name: 'Crown Badge', price: 1800, icon: '👑', desc: 'Royal crown of excellence', category: 'badges' },
  { name: 'Shield Badge', price: 700, icon: '🛡️', desc: 'Protective shield emblem', category: 'badges' },
  { name: 'Flame Badge', price: 600, icon: '🔥', desc: 'Burning flame of passion', category: 'badges' },
  { name: 'Moon Badge', price: 900, icon: '🌙', desc: 'Mysterious crescent moon', category: 'badges' },
  { name: 'Snowflake Badge', price: 500, icon: '❄️', desc: 'Unique snowflake design', category: 'badges' },
  { name: 'Thunder Badge', price: 1100, icon: '⚡', desc: 'Electric thunderbolt badge', category: 'badges' },
  { name: 'Infinity Badge', price: 2500, icon: '♾️', desc: 'Eternal infinity symbol', category: 'badges' },
  { name: 'Superstar Flair', price: 800, icon: '⭐', desc: 'Glamorous superstar flair', category: 'flairs' },
  { name: 'Angel Flair', price: 1000, icon: '👼', desc: 'Heavenly angel wings flair', category: 'flairs' },
  { name: 'Devil Flair', price: 1000, icon: '😈', desc: 'Mischievous devil flair', category: 'flairs' },
  { name: 'Ninja Flair', price: 700, icon: '🥷', desc: 'Stealthy ninja flair', category: 'flairs' },
  { name: 'Pirate Flair', price: 700, icon: '🏴‍☠️', desc: 'Swashbuckling pirate flair', category: 'flairs' },
  { name: 'Alien Flair', price: 900, icon: '👽', desc: 'Extraterrestrial alien flair', category: 'flairs' },
  { name: 'Robot Flair', price: 800, icon: '🤖', desc: 'High-tech robot flair', category: 'flairs' },
  { name: 'Ghost Flair', price: 600, icon: '👻', desc: 'Spooky ghost flair', category: 'flairs' },
  { name: 'Unicorn Flair', price: 1200, icon: '🦄', desc: 'Magical unicorn flair', category: 'flairs' },
  { name: 'Zombie Flair', price: 600, icon: '🧟', desc: 'Undead zombie flair', category: 'flairs' },
  { name: 'Clown Flair', price: 500, icon: '🤡', desc: 'Funny clown flair', category: 'flairs' },
  { name: 'Vampire Flair', price: 900, icon: '🧛', desc: 'Elegant vampire flair', category: 'flairs' },
  { name: 'Mermaid Flair', price: 1100, icon: '🧜', desc: 'Enchanting mermaid flair', category: 'flairs' },
  { name: 'Fairy Flair', price: 1000, icon: '🧚', desc: 'Delicate fairy flair', category: 'flairs' },
  { name: 'Demon Flair', price: 1500, icon: '👺', desc: 'Fearsome demon flair', category: 'flairs' },
  { name: 'Ocean Theme', price: 800, icon: '🌊', desc: 'Deep blue ocean background', category: 'themes' },
  { name: 'Sunset Theme', price: 800, icon: '🌅', desc: 'Warm sunset profile', category: 'themes' },
  { name: 'Night Sky Theme', price: 1000, icon: '🌃', desc: 'Starry night background', category: 'themes' },
  { name: 'Forest Theme', price: 700, icon: '🌲', desc: 'Lush green forest', category: 'themes' },
  { name: 'Cyberpunk Theme', price: 1200, icon: '🌆', desc: 'Neon cityscape background', category: 'themes' },
  { name: 'Space Theme', price: 1500, icon: '🚀', desc: 'Outer space cosmic theme', category: 'themes' },
  { name: 'Underwater Theme', price: 900, icon: '🐠', desc: 'Coral reef underwater', category: 'themes' },
  { name: 'Lava Theme', price: 1000, icon: '🌋', desc: 'Volcanic lava glow theme', category: 'themes' },
  { name: 'Snow Theme', price: 700, icon: '⛄', desc: 'Winter wonderland theme', category: 'themes' },
  { name: 'Cherry Blossom Theme', price: 900, icon: '🌸', desc: 'Pink cherry blossom theme', category: 'themes' },
  { name: 'Retro Theme', price: 600, icon: '📼', desc: 'Vintage retro wave', category: 'themes' },
  { name: 'Minimal Theme', price: 400, icon: '◻️', desc: 'Clean minimalist design', category: 'themes' },
  { name: 'Abstract Theme', price: 800, icon: '🎨', desc: 'Colorful abstract art', category: 'themes' },
  { name: 'Steampunk Theme', price: 1100, icon: '⚙️', desc: 'Victorian steampunk style', category: 'themes' },
  { name: 'Magic Theme', price: 1300, icon: '🔮', desc: 'Enchanted wizard theme', category: 'themes' },
  { name: 'Red Rose', price: 150, icon: '🌹', desc: 'Classic red rose gift', category: 'gifts' },
  { name: 'Chocolate Box', price: 200, icon: '🍫', desc: 'Deluxe chocolate assortment', category: 'gifts' },
  { name: 'Teddy Bear', price: 300, icon: '🧸', desc: 'Cuddly teddy bear gift', category: 'gifts' },
  { name: 'Birthday Cake', price: 400, icon: '🎂', desc: 'Celebratory birthday cake', category: 'gifts' },
  { name: 'Party Popper', price: 100, icon: '🎉', desc: 'Fun party popper gift', category: 'gifts' },
  { name: 'Gem Ring', price: 800, icon: '💍', desc: 'Sparkling gemstone ring', category: 'gifts' },
  { name: 'Perfume Bottle', price: 600, icon: '🧴', desc: 'Elegant perfume gift', category: 'gifts' },
  { name: 'Watch', price: 900, icon: '⌚', desc: 'Stylish wristwatch', category: 'gifts' },
  { name: 'Headphones', price: 700, icon: '🎧', desc: 'Premium headphones', category: 'gifts' },
  { name: 'Camera', price: 1200, icon: '📷', desc: 'High-quality camera', category: 'gifts' },
  { name: 'Game Controller', price: 500, icon: '🎮', desc: 'Gaming controller gift', category: 'gifts' },
  { name: 'Book Set', price: 350, icon: '📚', desc: 'Collection of books', category: 'gifts' },
  { name: 'Sunglasses', price: 250, icon: '🕶️', desc: 'Cool sunglasses gift', category: 'gifts' },
  { name: 'Cupcake Set', price: 180, icon: '🧁', desc: 'Assorted cupcakes', category: 'gifts' },
  { name: 'Balloon Bouquet', price: 200, icon: '🎈', desc: 'Colorful balloon bunch', category: 'gifts' },
  { name: 'Laughing Emote', price: 200, icon: '😂', desc: 'Rolling on floor laughing', category: 'emotes' },
  { name: 'Heart Eyes Emote', price: 200, icon: '😍', desc: 'Heart-eyed admiration emote', category: 'emotes' },
  { name: 'Cool Emote', price: 200, icon: '😎', desc: 'Cool sunglasses emote', category: 'emotes' },
  { name: 'Crying Emote', price: 150, icon: '😢', desc: 'Tearful crying emote', category: 'emotes' },
  { name: 'Angry Emote', price: 150, icon: '😡', desc: 'Furious angry emote', category: 'emotes' },
  { name: 'Shy Emote', price: 200, icon: '😊', desc: 'Blushing shy emote', category: 'emotes' },
  { name: 'Cat Sticker', price: 300, icon: '🐱', desc: 'Cute cat sticker pack', category: 'emotes' },
  { name: 'Dog Sticker', price: 300, icon: '🐶', desc: 'Playful dog sticker pack', category: 'emotes' },
  { name: 'Panda Sticker', price: 300, icon: '🐼', desc: 'Adorable panda stickers', category: 'emotes' },
  { name: 'Fox Sticker', price: 300, icon: '🦊', desc: 'Clever fox sticker pack', category: 'emotes' },
  { name: 'Alien Sticker', price: 350, icon: '👾', desc: 'Retro alien sticker pack', category: 'emotes' },
  { name: 'Ghost Sticker', price: 250, icon: '👻', desc: 'Cute ghost sticker pack', category: 'emotes' },
  { name: 'Skull Sticker', price: 250, icon: '💀', desc: 'Skull & crossbones sticker', category: 'emotes' },
  { name: 'Rainbow Emote', price: 400, icon: '🌈', desc: 'Pride rainbow emote', category: 'emotes' },
  { name: 'Star Sticker', price: 200, icon: '⭐', desc: 'Glittering star stickers', category: 'emotes' },
  { name: 'XP Boost x2', price: 500, icon: '📈', desc: 'Double XP for 1 hour', category: 'powerups' },
  { name: 'Coin Magnet', price: 400, icon: '🧲', desc: 'Attract coins automatically', category: 'powerups' },
  { name: 'Speed Boost', price: 300, icon: '💨', desc: 'Move faster for 30 min', category: 'powerups' },
  { name: 'Shield', price: 600, icon: '🛡️', desc: 'Protect from one penalty', category: 'powerups' },
  { name: 'Extra Life', price: 800, icon: '❤️', desc: 'One extra life in games', category: 'powerups' },
  { name: 'Time Freeze', price: 700, icon: '⏸️', desc: 'Pause timer for 10 sec', category: 'powerups' },
  { name: 'Double Coins', price: 900, icon: '🪙', desc: 'Double coin earnings', category: 'powerups' },
  { name: 'Lucky Clover', price: 350, icon: '🍀', desc: 'Increase luck by 25%', category: 'powerups' },
  { name: 'Night Vision', price: 400, icon: '👁️', desc: 'See in the dark for 1h', category: 'powerups' },
  { name: 'Invisibility', price: 1000, icon: '🫥', desc: 'Become invisible for 5 min', category: 'powerups' },
  { name: 'Super Jump', price: 300, icon: '🦘', desc: 'Jump higher for 30 min', category: 'powerups' },
  { name: 'Teleport', price: 1200, icon: '📡', desc: 'Teleport to any location', category: 'powerups' },
  { name: 'Ghost Mode', price: 900, icon: '👻', desc: 'Walk through walls for 2m', category: 'powerups' },
  { name: 'Mega Strength', price: 600, icon: '💪', desc: 'Strength boost for 30 min', category: 'powerups' },
  { name: 'Wisdom Scroll', price: 700, icon: '📜', desc: 'Earn double AP for 1 hour', category: 'powerups' },
  { name: 'Rainbow Text', price: 400, icon: '🌈', desc: 'Multi-color rainbow chat text', category: 'chat' },
  { name: 'Glow Text', price: 300, icon: '💡', desc: 'Glowing neon chat text', category: 'chat' },
  { name: 'Big Text', price: 200, icon: '🔠', desc: 'Extra large chat messages', category: 'chat' },
  { name: 'Sparkle Effect', price: 500, icon: '✨', desc: 'Sparkling text animation', category: 'chat' },
  { name: 'Bold Gold', price: 350, icon: '🪙', desc: 'Gold-colored bold text', category: 'chat' },
  { name: 'Chat Frame', price: 600, icon: '🖼️', desc: 'Fancy border around chat', category: 'chat' },
  { name: 'Typing Emote', price: 250, icon: '⌨️', desc: 'Custom typing indicator', category: 'chat' },
  { name: 'Sound Alert', price: 300, icon: '🔔', desc: 'Custom message sound', category: 'chat' },
  { name: 'Sticker Pack', price: 500, icon: '📋', desc: 'Exclusive chat stickers', category: 'chat' },
  { name: 'GIF Access', price: 700, icon: '🎬', desc: 'Unlock GIF sharing in chat', category: 'chat' },
  { name: 'Mega Emoji', price: 400, icon: '😱', desc: 'Send giant emoji in chat', category: 'chat' },
  { name: 'Chat Bubble', price: 350, icon: '💭', desc: 'Custom chat bubble style', category: 'chat' },
  { name: 'Mention Highlight', price: 200, icon: '🔦', desc: 'Highlight your mentions', category: 'chat' },
  { name: 'Italic Style', price: 150, icon: '✒️', desc: 'Italic chat text style', category: 'chat' },
  { name: 'Marquee Text', price: 450, icon: '📢', desc: 'Scrolling announcement text', category: 'chat' },
  { name: 'Extra Color Ball', price: 300, icon: '🎨', desc: 'One extra color ball spawn', category: 'game' },
  { name: 'Silver Magnet', price: 400, icon: '🧲', desc: 'Attract silver coins', category: 'game' },
  { name: 'Gold Radar', price: 600, icon: '📡', desc: 'Detect golden coin spawns', category: 'game' },
  { name: 'Lotto Ticket', price: 200, icon: '🎟️', desc: 'Free lotto entry ticket', category: 'game' },
  { name: 'Castle Key', price: 500, icon: '🔑', desc: 'Open mystery castle door', category: 'game' },
  { name: 'Monster Bait', price: 350, icon: '🪤', desc: 'Attract rare monsters', category: 'game' },
  { name: 'Cricket Bat', price: 800, icon: '🏏', desc: 'Special cricket bat skin', category: 'game' },
  { name: 'Dice Bonus', price: 250, icon: '🎲', desc: 'Bonus dice roll in ludo', category: 'game' },
  { name: 'Farm Fertilizer', price: 200, icon: '🧪', desc: 'Grow crops faster', category: 'game' },
  { name: 'Lucky Charm', price: 400, icon: '🍀', desc: 'Boost luck in all games', category: 'game' },
  { name: 'Double Down', price: 700, icon: '2️⃣', desc: 'Double your game winnings', category: 'game' },
  { name: 'Free Spin', price: 500, icon: '🎰', desc: 'Free slot machine spin', category: 'game' },
  { name: 'Treasure Map', price: 600, icon: '🗺️', desc: 'Find hidden game rewards', category: 'game' },
  { name: 'Mystery Box', price: 1000, icon: '🎁', desc: 'Random rare game item', category: 'game' },
  { name: 'XP Potion', price: 450, icon: '🧪', desc: 'Instantly gain 100 XP', category: 'game' },
  { name: 'VIP Pass (1 Week)', price: 2000, icon: '💳', desc: 'VIP status for 7 days', category: 'special' },
  { name: 'Name Color Change', price: 800, icon: '🎨', desc: 'Custom username color', category: 'special' },
  { name: 'Profile Music', price: 1200, icon: '🎵', desc: 'Add music to your profile', category: 'special' },
  { name: 'Custom Title', price: 1000, icon: '🏷️', desc: 'Personal profile title', category: 'special' },
  { name: 'Animated Avatar', price: 1500, icon: '🔄', desc: 'Animated profile picture', category: 'special' },
  { name: 'Spotlight Week', price: 3000, icon: '🔦', desc: 'Featured profile for 1 week', category: 'special' },
  { name: 'Dedicated Emoji', price: 2500, icon: '😤', desc: 'Custom emoji on server', category: 'special' },
  { name: 'Priority Support', price: 1000, icon: '🎧', desc: 'Priority customer support', category: 'special' },
  { name: 'Early Access Pass', price: 1800, icon: '🚪', desc: 'Early access to new features', category: 'special' },
  { name: 'Beta Tester Badge', price: 1500, icon: '🧪', desc: 'Exclusive beta tester badge', category: 'special' },
  { name: 'Mega Bundle', price: 5000, icon: '💎', desc: 'All frames + 5 badges + 3 flairs', category: 'special' },
  { name: 'Rainbow Name', price: 1200, icon: '🌈', desc: 'Rainbow gradient username', category: 'special' },
  { name: 'Custom Badge', price: 4000, icon: '🏅', desc: 'Design your own badge', category: 'special' },
  { name: 'Lifetime Premium', price: 10000, icon: '👑', desc: 'Premium status forever', category: 'special' },
  { name: 'Founder Pack', price: 8000, icon: '🚀', desc: 'All exclusive founder items', category: 'special' },
];

const PLANS = [
  { pkg: 1, cost: 30, days: 2, label: 'Package 1', badge: 'Budget' },
  { pkg: 2, cost: 60, days: 5, label: 'Package 2', badge: 'Popular' },
];

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [isSubscribing, setIsSubscribing] = useState<number | null>(null);
  const [revealUntil, setRevealUntil] = useState(0);
  const [plusses, setPlusses] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const u = JSON.parse(saved);
      setActiveUser(u);
      setPlusses(u.plusses || 0);
      setRevealUntil(u.goldenRevealUntil || 0);
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const revealRemaining = Math.max(0, revealUntil - now);

  const refreshSession = () => {
    const saved = localStorage.getItem('user_session');
    if (saved) {
      const u = JSON.parse(saved);
      setActiveUser(u);
      setPlusses(u.plusses || 0);
      setRevealUntil(u.goldenRevealUntil || 0);
    }
  };

  const handleSubscribe = async (pkg: number) => {
    if (!activeUser?.id) {
      triggerToast({ id:'sub-no-auth-'+Date.now(), senderId:'system', senderName:'System', senderAvatar:'', type:'SYSTEM', message:'Please log in to subscribe.', timestamp:Date.now(), isRead:false } as any);
      return;
    }
    setIsSubscribing(pkg);
    try {
      const plan = PLANS.find(p => p.pkg === pkg)!;
      const res = await fetch(`${API_BASE}/users/${activeUser.id}/subscribe-reveal`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pkg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe');

      const session = JSON.parse(localStorage.getItem('user_session') || '{}');
      session.plusses = data.newPlusses;
      session.goldenRevealUntil = data.goldenRevealUntil;
      localStorage.setItem('user_session', JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
      refreshSession();

      triggerToast({ id:'sub-success-'+Date.now(), senderId:'shop', senderName:'Gift Shop', senderAvatar:'https://i.pravatar.cc/100?img=12', type:'REWARD', message:data.message, timestamp:Date.now(), isRead:false } as any);
    } catch (err: any) {
      triggerToast({ id:'sub-fail-'+Date.now(), senderId:'system', senderName:'System', senderAvatar:'', type:'SYSTEM', message:err.message || 'Subscription failed.', timestamp:Date.now(), isRead:false } as any);
    } finally { setIsSubscribing(null); }
  };

  const filtered = ALL_ITEMS.filter(item => {
    const matchCat = category === 'all' || item.category === category;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleBuy = async (item: ShopItem) => {
    if (!activeUser?.id) {
      triggerToast({ id:'shop-no-auth-'+Date.now(), senderId:'system', senderName:'System', senderAvatar:'', type:'SYSTEM', message:'Please log in to purchase items.', timestamp:Date.now(), isRead:false } as any);
      return;
    }
    const userPoints = activeUser.points || 0;
    if (userPoints < item.price) {
      triggerToast({ id:'shop-insufficient-'+Date.now(), senderId:'system', senderName:'Shop Manager', senderAvatar:'', type:'SYSTEM', message:`Insufficient points! You need ${item.price - userPoints} more points.`, timestamp:Date.now(), isRead:false } as any);
      return;
    }
    setIsBuying(item.name);
    try {
      const newPoints = userPoints - item.price;
      await mongoService.updateUser(activeUser.id, { points: newPoints });
      const { newBalance } = await apTransactionService.adjustUserAP(activeUser.id, 'USER_FUN_UTILIZED');
      const updatedUser = { ...activeUser, points: newPoints, balance_ap: newBalance };
      setActiveUser(updatedUser);
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      triggerToast({ id:'shop-success-'+Date.now(), senderId:'shop', senderName:'Gift Shop', senderAvatar:'https://i.pravatar.cc/100?img=12', type:'REWARD', message:`Purchased ${item.name}! -${item.price} pts & +2.0 AP!`, timestamp:Date.now(), isRead:false } as any);
      mongoService.addActivity({ id:'act_'+Date.now(), time:new Date().toLocaleTimeString([],{hour12:true,hour:'2-digit',minute:'2-digit'}), username:activeUser.username||activeUser.name, msg:`purchased ${item.name} from the shop`, timestamp:Date.now(), link:'/shop' });
    } catch (err) {
      console.error('Failed to buy item:', err);
      triggerToast({ id:'shop-fail-'+Date.now(), senderId:'system', senderName:'Shop Manager', senderAvatar:'', type:'SYSTEM', message:'Transaction failed. Please try again.', timestamp:Date.now(), isRead:false } as any);
    } finally { setIsBuying(null); }
  };

  const formatDuration = (ms: number) => {
    if (ms <= 0) return null;
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0f0f2a] to-[#0a0a1a] pb-24 overflow-x-hidden">
      <style>{`
        @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
        .shop-card { background:linear-gradient(135deg,rgba(28,28,46,0.8),rgba(17,10,42,0.8)); border:1px solid rgba(255,255,255,0.06); border-radius:20px; backdrop-filter:blur(12px); transition:all .3s; }
        .shop-card:hover { border-color:rgba(168,85,247,0.2); transform:translateY(-2px); }
        .cat-pill { padding:8px 16px; border-radius:12px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; white-space:nowrap; transition:all .3s; cursor:pointer; border:none; outline:none; }
        .cat-pill-active { background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; box-shadow:0 4px 15px rgba(124,58,237,0.3); }
        .cat-pill-inactive { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.5); }
        .cat-pill-inactive:hover { background:rgba(255,255,255,0.1); color:#fff; }
        .no-scrollbar::-webkit-scrollbar { display:none; }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-gradient-to-br from-[#0a0a1a]/90 to-[#0f0f2a]/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 active:scale-90 transition-all border border-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                🎁 Gift Shop
                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">{ALL_ITEMS.length} items</span>
              </h1>
              <p className="text-xs text-white/40 font-medium">Spend your points on exclusive items</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Balance</span>
            <span className="text-base font-black text-amber-400">{activeUser?.points?.toLocaleString() || 0} pts</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* GOLDEN COIN REVEAL SUBSCRIPTION */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-900/20 via-purple-900/20 to-indigo-900/20 border border-amber-500/20 p-5 sm:p-7">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 tracking-tight flex items-center gap-2">
                  🪙 Golden Coin Reveal Service
                </h2>
                <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                  See exactly when the next Golden Coin drops! A live countdown timer appears on the Golden Coin page so you never miss a grab.
                </p>
              </div>
              <div className="bg-white/5 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0">
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Plusses</span>
                <span className="text-base font-black text-amber-400">{plusses.toLocaleString()}</span>
              </div>
            </div>

            {revealRemaining > 0 && (
              <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-xl border border-emerald-500/30 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-black text-emerald-300">Active Subscription</p>
                    <p className="text-xs text-white/50">Real-time countdown visible on the Golden Coin page</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Expires In</p>
                  <p className="text-lg font-black text-emerald-300 tabular-nums tracking-widest">{formatDuration(revealRemaining)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLANS.map(plan => {
                const canAfford = plusses >= plan.cost;
                return (
                  <div key={plan.pkg} className={`relative rounded-2xl border p-5 transition-all ${canAfford ? 'bg-white/5 border-white/10 hover:border-amber-500/30' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                    {plan.badge === 'Popular' && (
                      <span className="absolute -top-2.5 right-4 text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full shadow-lg">Popular</span>
                    )}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-black text-sm text-white">{plan.label}</h3>
                        <p className="text-xs text-white/40 font-medium">{plan.days} Days Subscription</p>
                      </div>
                      <div className="text-2xl font-black text-amber-400">{plan.cost.toLocaleString()} <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Plusses</span></div>
                      <button onClick={() => handleSubscribe(plan.pkg)} disabled={isSubscribing !== null || !canAfford}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSubscribing === plan.pkg ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>🔔 Subscribe · {plan.cost} Plusses</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEARCH + CATEGORIES */}
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-purple-500/50 transition-all placeholder:text-white/30" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold">✕</button>}
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`cat-pill ${category === c.id ? 'cat-pill-active' : 'cat-pill-inactive'}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ITEMS GRID */}
        {filtered.length === 0 ? (
          <div className="shop-card p-12 text-center">
            <div className="text-5xl mb-4 opacity-30">🔍</div>
            <p className="text-sm font-black text-white/40 uppercase tracking-widest">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtered.map(item => (
              <div key={item.name} className="shop-card p-3.5 flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-3xl mb-3 group-hover:scale-110 group-hover:border-purple-500/30 transition-all">
                  {item.icon}
                </div>
                <span className="text-[10px] font-black text-purple-400/70 uppercase tracking-widest mb-1">{item.category}</span>
                <h4 className="font-black text-sm text-white leading-tight mb-0.5">{item.name}</h4>
                <p className="text-[10px] text-white/40 font-medium leading-tight mb-3 line-clamp-2">{item.desc}</p>
                <button onClick={() => handleBuy(item)} disabled={isBuying !== null}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-purple-900/10 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-auto">
                  {isBuying === item.name ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🪙 {item.price.toLocaleString()} pts</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
