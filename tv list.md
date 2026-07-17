<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live TV Zone - SocialBD</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <style>
            body {
                font-family: 'Poppins', 'Hind Siliguri', sans-serif;
                background-color: #f1f5f9;
            }

            .main-card {
                background: #ffffff;
                border-radius: 1.5rem;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
                overflow: hidden;
                margin-bottom: 2rem;
            }

            .channel-item {
                transition: all 0.2s;
                cursor: pointer;
            }

            .channel-item:hover {
                background-color: #f0f9ff;
                transform: translateY(-2px);
            }

            .active-channel {
                background-color: #e0f2fe;
                border-left: 4px solid #0ea5e9;
            }

            .category-scroll::-webkit-scrollbar {
                display: none;
            }

            .category-scroll {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            .fav-active {
                color: #ef4444 !important;
            }

            .fav-btn:active {
                transform: scale(1.2);
            }

            video::-webkit-media-controls-timeline {
                display: none !important;
            }

            video::-webkit-media-controls-picture-in-picture-button {
                display: none !important;
            }
        </style>
    </head>
    <body class="min-h-screen py-4 sm:py-8 px-2 text-slate-800" oncontextmenu="return false;">
        <div class="max-w-4xl mx-auto main-card">
            <div class="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <a href="home.php" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <div>
                        <h1 class="text-lg font-bold flex items-center gap-2">
                            <i class="fas fa-tv text-red-500"></i>
                            Live TV
                        </h1>
                        <p class="text-[10px] text-slate-400">Stable Server (No Buffer)</p>
                    </div>
                </div>
                <div class="bg-red-600 text-[10px] font-bold px-2 py-1 rounded animate-pulse">LIVE</div>
            </div>
            <div class="bg-black aspect-video w-full relative group">
                <video id="video" class="w-full h-full object-contain" controls playsinline webkit-playsinline controlsList="nodownload noplaybackrate" poster="https://via.placeholder.com/640x360/000000/ffffff?text=SocialBD+Live+TV"></video>
                <div id="player-overlay" class="absolute inset-0 flex items-center justify-center bg-black/80 z-10 pointer-events-none hidden">
                    <p class="text-white text-sm font-medium">
                        <i class="fas fa-spinner fa-spin mr-2"></i>
                        Connecting...
                    </p>
                </div>
                <div id="premium-msg" class="absolute inset-0 z-20 hidden flex flex-col items-center justify-center bg-black/95 text-center p-6">
                    <div class="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-lock text-3xl text-amber-500"></i>
                    </div>
                    <h2 class="text-white font-bold text-lg mb-1">Premium Channel</h2>
                    <p class="text-slate-400 text-xs mb-4">Subscribe to watch this channel.</p>
                    <form method="POST">
                        <button type="submit" name="buy_pack" onclick="return confirm('Confirm purchase for 25 Taka?')" class="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition">Buy Pack (25৳ / 30 Days)
                </button>
                    </form>
                </div>
                <div id="select-msg" class="absolute inset-0 flex items-center justify-center bg-slate-900 z-0">
                    <div class="text-center text-slate-500">
                        <i class="fas fa-play-circle text-4xl mb-2 opacity-50"></i>
                        <p class="text-xs">Select a channel from the list</p>
                    </div>
                </div>
            </div>
            <div class="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div class="truncate pr-2 w-1/2">
                    <h2 id="current-channel-name" class="font-bold text-slate-700 text-sm truncate">No Channel Selected</h2>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="togglePiP()" id="pip-btn" class="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold border border-slate-300 px-3 py-1.5 rounded-lg bg-white relative shadow-sm active:scale-95 transition" title="Picture in Picture">
                        <i class="fas fa-images"></i>
                        <span class="hidden sm:inline ml-1">PiP</span>
                        <span class="absolute -top-2 -right-2 text-amber-500 bg-white rounded-full shadow-md w-4 h-4 flex items-center justify-center border border-amber-100">
                            <i class="fas fa-lock text-[8px]"></i>
                        </span>
                    </button>
                    <button onclick="toggleFullScreen()" class="text-slate-500 hover:text-indigo-600 text-xl w-8 h-8 flex items-center justify-center" title="Fullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            </div>
            <div class="p-4">
                <div class="flex gap-2 mb-4 overflow-x-auto pb-2 category-scroll">
                    <a href="live_tv.php?cat=all" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-globe mr-1"></i>
                        All
            
                    </a>
                    <a href="live_tv.php?cat=favorites" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-rose-600 border-rose-200">
                        <i class="fas fa-heart mr-1"></i>
                        Favorites
            
                    </a>
                    <a href="live_tv.php?cat=paid" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-amber-600 border-amber-200">
                        <i class="fas fa-crown mr-1"></i>
                        Premium
            
                    </a>
                    <a href="live_tv.php?cat=bd" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-indigo-600 text-white">
                        <i class="fas fa-flag mr-1 text-green-600"></i>
                        BD
            
                    </a>
                    <a href="live_tv.php?cat=hindi" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-om mr-1 text-orange-500"></i>
                        Hindi
            
                    </a>
                    <a href="live_tv.php?cat=hindi_movie" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-film mr-1 text-red-500"></i>
                        Movies
            
                    </a>
                    <a href="live_tv.php?cat=sports" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-futbol mr-1 text-emerald-500"></i>
                        Sports
            
                    </a>
                    <a href="live_tv.php?cat=cartoon" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-child mr-1 text-yellow-500"></i>
                        Kids
            
                    </a>
                    <a href="live_tv.php?cat=animal" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-paw mr-1 text-amber-700"></i>
                        Nature
            
                    </a>
                    <a href="live_tv.php?cat=music" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-music mr-1 text-purple-500"></i>
                        Music
            
                    </a>
                    <a href="live_tv.php?cat=english" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-language mr-1 text-blue-500"></i>
                        English
            
                    </a>
                    <a href="live_tv.php?cat=news" class="px-4 py-2 rounded-full text-xs font-bold shadow transition flex-shrink-0 bg-white border text-slate-600">
                        <i class="fas fa-newspaper mr-1 text-gray-500"></i>
                        News
            
                    </a>
                </div>
                <div class="relative mb-4">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="searchBox" onkeyup="filterChannels()" placeholder="Search in loaded channels..." class="w-full pl-9 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition">
                </div>
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-xs font-black text-slate-400 uppercase">Available Channels</h3>
                    <span class="text-[10px] font-bold bg-slate-200 px-2 py-0.5 rounded text-slate-600">181</span>
                </div>
                <div id="channel-list" class="channel-list h-[400px] overflow-y-auto space-y-2 pr-1 pb-10">
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://live20.bozztv.com/giatvplayout7/giatv-209902/tracks-v1a1/mono.ts.m3u8', 'Doraemon', true, this.parentElement)">
                            <div class="absolute top-0 left-0 bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-br-lg font-bold shadow z-10">
                                <i class="fas fa-crown"></i>
                            </div>
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Doraemon</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla | 24/7</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(371, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-lock text-amber-500 text-sm"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://server.zillarbarta.com/ZBCINEMA/tracks-v1a1/mono.ts.m3u8', 'ZB Cinema', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ZB Cinema</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian-Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11486, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/globaltv.stream/playlist.m3u8', 'Ekhon TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Ekhon TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11481, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/channel9hd.stream/playlist.m3u8', 'Channel 9', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel 9</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11480, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cdn-1.pishow.tv/live/1456/1456_1.m3u8', 'Dhoom Music', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Dhoom Music</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Kolkata Bangla Music</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11467, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cdn-4.pishow.tv/live/969/master.m3u8', 'AAKASH AATH', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">AAKASH AATH</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Kolkata Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11465, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cdn-4.pishow.tv/live/1231/1231_1.m3u8', 'R Plus Gold', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">R Plus Gold</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Kolkata Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11462, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/globaltv.stream/tracks-v1a1/mono.m3u8', 'Ekhone TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Ekhone TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla News</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11460, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/jagonews24.stream/tracks-v1a1/mono.m3u8', 'Jago News 24', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Jago News 24</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Jagobd</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11459, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/channels.stream/tracks-v1a1/mono.m3u8', 'Channel S HD', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel S HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11458, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/gazibdz.stream/tracks-v1a1/mono.m3u8', 'Gazi TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Gazi TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11457, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app24.jagobd.com.bd/c3VydmVyX8RpbEU9Mi8xNy8yMFDDEHGcfRgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcEdsEfeDeKiNkVN3PTOmdFsaWRtaW51aiPhnPTI2/chsukoff.stream/tracks-v1a1/mono.m3u8', 'Channel S UK', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel S UK</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11456, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('http://istream.binarywaves.com:8081/hls/arabica/playlist.m3u8', 'Arabica TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Arabica TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11430, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/ZeeBanglaCinema/index.m3u8?e=1767961149&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=a5a4502b444fb1c69741542866354c09', 'Zee Bangla Cinema', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/7fc825467116fd9653dc0495c0532e01" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Zee Bangla Cinema</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11380, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/PNEb3v2q6GBk/index.m3u8?e=1767961148&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e142f58b0ae3ead501fc874f78636809', 'Zee Bangla International', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/0cb865748deefd42e69fd9a221cf38ee" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Zee Bangla International</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11379, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://live-bangla.akamaized.net/liveabr/playlist.m3u8', 'Enter 10 Bangla', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/2b00567c538d392c8050124f0064c4a1" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Enter 10 Bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11378, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://d3eyhgoylams0m.cloudfront.net/v1/manifest/93ce20f0f52760bf38be911ff4c91ed02aa2fd92/ed7bd2c7-8d10-4051-b397-2f6b90f99acb/2e9e32a4-c4f7-49c3-96d6-c4e3660c7e3f/2.m3u8', 'DD Bangla', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/e5117c508d18adf0a3f2475eb1fd5a9d" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">DD Bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11377, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen7.aynascope.net/timetv/index.m3u8?e=1767960994&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=53e6151222dcaacddae889e746cfe738', 'TIME TV USA', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/111bfd01fb43770e925ca9cf16663f56" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">TIME TV USA</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11182, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/satv/index.m3u8?e=1767960994&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=cf9ef67edd3fe2cedb7c1e4b690b145c', 'SA TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/f710d2ff532cb7e7b75566232c5b72d3" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">SA TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11181, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/RtvHD/index.m3u8?e=1767960993&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=36d5dcf75dcbac777b5409e2a4e34409', 'RTV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/094587a26f2c5e4f2962104728ec8c5d" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">RTV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11180, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen7.aynascope.net/PeaceTvBanglaHD/index.m3u8?e=1767960993&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=ef0ab5f8084bfb4539597a3952d3d17a', 'Peace TV Bangla HD', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/e33b23f7dc3d39008d672952c33069d4" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Peace TV Bangla HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11179, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/ntvbd/index.m3u8?e=1767960992&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e3a7b8c00f965dd6a59787f5c6901d11', 'NTV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/1a619c9b917eb35898020cd323e415a7" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">NTV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11178, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/nexustv/index.m3u8?e=1767960991&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=244ed21470e24c90aa97d96317c94f83', 'NEXUS TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/90635c3edf6e3c8dd92210b7248f1fa0" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">NEXUS TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11177, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/mytv/index.m3u8?e=1767960991&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b12e10dc794a0b30df91286a0627142d', 'My TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/c5b2c623863fbe4033d59d52ff7371ac" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">My TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11176, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/mohonatv/index.m3u8?e=1767960990&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=c9624eeebcd926aa3592e926b0f1e81e', 'Mohona TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/73082846fdc15d9f0e7268b104c55d92" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Mohona TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11175, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/maasrangatv/index.m3u8?e=1767960990&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=da3d04cbd6bf672840c40dd8b5faab4f', 'Maasranga TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/1b5cb8c7901739cd7d201a38d2ab4737" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Maasranga TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11174, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/globaltvhd/index.m3u8?e=1767960989&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=2167702d23ca52e10c412b28a7c10f52', 'Global TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/ffd7ba9b76ad555933f94bcb7ff26b44" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Global TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11173, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/Ravc7gPCZpxk/index.m3u8?e=1767960988&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=acafd5276772b07a085bdacef01cdcb3', 'Gazi TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/417a833f6d83021c99bfc3d4176610f4" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Gazi TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11172, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/etv/index.m3u8?e=1767960988&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=d61990e63d05f1aa720b7742fe80f7f1', 'ETV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/8a1af81802b0728c064c2adabcdc72c8" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ETV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11171, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/durontotv-live/index.m3u8?e=1767960987&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=0269ec0a62bf2f586c51dbbf9f55beb4', 'Duronto TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/51f1530c076c027e431bf18a49613f0b" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Duronto TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11170, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://vods2.aynascope.net/gseriesDrama/index.m3u8', 'Drama 24', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/08773290bf83a917aebc07810f12ed49" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Drama 24</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11169, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/deshtv/index.m3u8?e=1767960986&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=f9281989402726532babb1525a9e6d8f', 'Desh TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/d10390e5434e8cb44172257abd714beb" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Desh TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11168, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/DeeptoTVHD/index.m3u8?e=1767960985&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=d6d9a77149d2d89bb1441af8d13090b6', 'Deepto TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/76717b7a598a30815a1bdb16ecd3af6c" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Deepto TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11167, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/channeli/index.m3u8?e=1767960984&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b6b061862745930178d92661642b4783', 'Channel I', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/8e998f20a9cc52cb8eb1f52a5bf38204" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel I</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11166, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/channel9/index.m3u8?e=1767960984&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7e7a4b27d0464523d76d290e0c6cb687', 'Channel 9', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/a959f06b4fc9e1421f867b6c1601fe43" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel 9</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11165, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/boishakhitv/index.m3u8?e=1767960983&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7b5f0203f1f3eaccee71468aa7d269d1', 'Boishakhi TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/58658d4594ca1ff3c5031c9d8e3d9fc0" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Boishakhi TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11164, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/bijoytv/index.m3u8?e=1767960983&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=2af774b71adab03c51540c5bb28c0f87', 'Bijoy TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/f23d6f82c1a16458fe0e4c6f11b8fd87" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Bijoy TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11163, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/banglavision/index.m3u8?e=1767960982&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b96d2910ffc7a59d7270e87ccd30b646', 'Bangla Vision', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/788ab3e49b2aa6af247722762ed6e72a" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Bangla Vision</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11162, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/banglatv/index.m3u8?e=1767960982&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=b6658bf0f670d96b5af79e6f56e59d29', 'Bangla TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/e42ecfa90e3d6b15bdb7fea5ef673864" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Bangla TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11161, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/btv_world/index.m3u8?e=1767960981&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=838e266e92378897f2f9c4aa3690279d', 'BTV World', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/b30147b97d86754e4b97fc2989628391" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">BTV World</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11160, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/btvhd/index.m3u8?e=1767960980&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=e113dd28078fbaf09e189f3e261a9bf9', 'BTV NATIONAL HD', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/9b6f35f73a099b7a5885a970523c5f78" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">BTV NATIONAL HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11159, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/btvctg/index.m3u8?e=1767960980&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=bb61292e1c20a3f988592f24905ccebb', 'BTV CTG', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/00da8a07fb26b2fb79359ee535e4c7bc" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">BTV CTG</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11158, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/asiantv/index.m3u8?e=1767960979&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=7f794e0702cc664d6282906bde53ae7d', 'Asian TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/5282cec3a2e9349b750540d658cf1b6c" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Asian TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11157, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen6.aynascope.net/anandatv/index.m3u8?e=1767960979&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=24980bf8b090d2d3a7cdcf10abf32f35', 'Ananda TV', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/897698f593fc07974fc46881a440733d" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Ananda TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11156, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://tvsen5.aynascope.net/atnbangla/index.m3u8?e=1767960978&amp;u=78be6644-0a65-48ec-81a4-089ac65a2619&amp;token=8b09afedfeb09fd5d67984a135208115', 'ATN Bangla', false, this.parentElement)">
                            <img src="https://s3.aynaott.com/storage/eff41809fca04f7c1da5481e135d7913" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ATN Bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11155, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/anandatv/playlist.m3u8', '[BD] Ananda TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/wCM3l5sBEef-9-uVXFvD/posters/d80f7aee-5bd7-4edc-97eb-ead0e3ebbe09.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Ananda TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11112, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/bijoytv/playlist.m3u8', '[BD] Bijoy TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/bns4l5sBcqxnFHJBVZ32/posters/feaf9f3d-cc3b-4a3d-81a3-2cb703e561eb.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Bijoy TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11111, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/jamuna_tv/playlist.m3u8', '[BD] Jamuna TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PiL635oBEef-9-uV2uCe/posters/36f380e0-6c71-4b27-a73b-2afb3ce7e982.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Jamuna TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(11110, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://iptvbd.live/metv1080/1080.m3u8', 'Me-tv', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Me-tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(364, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://thelegitpro.in/pntv/rplusnews24x7/tracks-v1a1/mono.m3u8', 'R Plus', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">R Plus</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian-Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(359, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cdn-4.pishow.tv/live/1231/1231_2.m3u8', 'R Plus Gould', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">R Plus Gould</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian-Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(355, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://dbcanada.sonarbanglatv.com/jhankartv/jtv/index.m3u8', 'Jankhar tv', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Jankhar tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(346, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('http://208.86.19.13:81/514.stream/index.m3u8', 'Deshi tv', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Deshi tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(335, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cdn.ottlive.co.in/kolkatatv/index.m3u8', 'Kolkata TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Kolkata TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Indian Bangla News</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(305, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI/atnmusic.stream/playlist.m3u8', 'ATN Music', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ATN Music</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla Music</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(296, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/ntvuk00332211.stream/playlist.m3u8', 'NTV UK', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">NTV UK</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(295, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI2/greentv.stream/live-orgin/greentv.stream/chunks.m3u8', 'Green TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Green TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(294, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://app.ncare.live/c3VydmVyX8RpbEU9Mi8xNy8yMDE0GIDU6RgzQ6NTAgdEoaeFzbF92YWxIZTO0U0ezN1IzMyfvcGVMZEJCTEFWeVN3PTOmdFsaWRtaW51aiPhnPTI/chsukoff.stream/playlist.m3u8', 'Channel S UK HD', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel S UK HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(293, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('http://103.230.105.252:1935/live/btv/manifest.m3u8', 'BTV World', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">BTV World</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(291, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1711/output/1711-audio_113412_eng=113200-video=1692000.m3u8', 'Dipto TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Dipto TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(274, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1723/output/1723-audio_113532_eng=113200-video=1692000.m3u8', 'Channel I', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel I</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(263, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1716/output/1716-audio_113462_eng=113200-video=1692000.m3u8', 'NTV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">NTV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(262, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1704/output/1704-audio_113342_eng=113200-video=1692000.m3u8', 'Independent TV', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Independent TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(261, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1705/output/1705-audio_113352_eng=113200-video=1692000.m3u8', 'Ekattor HD 71 üáßüá©', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Ekattor HD 71 üáßüá©</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(258, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1703/output/1703-audio_113332_eng=113200-video=1692000.m3u8', 'Channel 24 üáßüá©', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Channel 24 üáßüá©</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(257, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1709/output/1709-audio_113392_eng=113200-video=1692000.m3u8', 'BTV üáßüá©', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">BTV üáßüá©</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(256, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1702/output/1702-audio_113322_eng=113200-video=1692000.m3u8', 'Somoy TV üáßüá©', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Somoy TV üáßüá©</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(255, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209593/master.m3u8', 'Bollywood Movies', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Bollywood Movies</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(254, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209902/master.m3u8', '4/7 Doraemon', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">4/7 Doraemon</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(252, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209612/master.m3u8', 'Bollywood Movies', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Bollywood Movies</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(251, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://owrcovcrpy.gpcdn.net/bpk-tv/1701/output/1701-audio_113312_eng=113200-video=1692000.m3u8', 'Jumuna TV üáßüá©', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Jumuna TV üáßüá©</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(248, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209627/master.m3u8', 'Kolkata Movies', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Kolkata Movies</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(247, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209611/master.m3u8', '24/7 Gopal Bhar', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">24/7 Gopal Bhar</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(246, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209901/master.m3u8', '24/7 Shinchan', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">24/7 Shinchan</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(245, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://cloudfrontnet.vercel.app/tplay/playout/209622/master.m3u8', '24/7 Motu Patlu', false, this.parentElement)">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">24/7 Motu Patlu</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangladeshi üáßüá©</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(243, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/ext/bijoy-tv/index.m3u8?token=29f2153aff82e894eed541024f753b5390e64523-fd137a76f8600b5bcd95548d9ecc6f54-1767124697-1767121097', 'bijoy-tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/bijoy-tv.jpg" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">bijoy-tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(225, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge2/ekhontv/index.m3u8?token=76f6cf282e3d51bf9a16c70543d85600aa8e5cbe-d946a57c7e08deff122fead7f16b8ad2-1767124697-1767121097', 'ekhon', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/ekhon-tv.jpg" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ekhon</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(224, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/88/index.m3u8?token=c333dfe453ef70288251bf41c38ec3f7ce9bdb08-ddcb4ba2f839fb964c068a11e423e3e2-1767124697-1767121097', 'sangsad tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/88.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">sangsad tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(223, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/15/index.m3u8?token=d14c03c4b72e020cc1998674f83245259bd858ca-16ed9267b765fcf2c273f61d6f03e853-1767124697-1767121097', 'sa tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/15.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">sa tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(222, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/14/index.m3u8?token=a97bc7d7de72039ad86694ed831e48988fd526e3-51b19ae614dd36a4f9e730d8932e323e-1767124697-1767121097', 'rtv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/14.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">rtv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(221, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/54/index.m3u8?token=59570e30cb03386c154ea07bfb31674682a69c34-af12d292a82384427f98244d7b956960-1767124697-1767121097', 'ntv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/54.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ntv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(220, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/18/index.m3u8?token=b82624c310d6394c2c3230a29d9bf531acca59be-bbedefa3d8a18714fd5bd8c6b3318d23-1767124697-1767121097', 'news24', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/18.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">news24</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(219, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/56/index.m3u8?token=646026414cffe613e7de924b3b94d68678cc0f7a-c6105f3aff9cde90d9a6b97d25c79142-1767124697-1767121097', 'my tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/56.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">my tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(218, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/86/index.m3u8?token=9a5069f726e022792c168588212114586eb2a7db-2010b7a3d97411ef9ad5cd00f0a989f8-1767124697-1767121097', 'movie bangla tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/86.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">movie bangla tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(217, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/50/index.m3u8?token=fa3cfa27afa7ab54d56fea6b9b82b6d23b756fe0-746a39cc21961173b3aacc5fa0097f61-1767124697-1767121097', 'mohona tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/50.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">mohona tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(216, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/51/index.m3u8?token=d9259128e6e9f238d7d8cd06dca8ce73edd01796-86b4feafd3fec42696a05f1486b48ca3-1767124697-1767121097', 'maasranga', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/51.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">maasranga</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(215, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/12/index.m3u8?token=0f74aa4e30ec31c2cf267ffb3966356e97eeca14-a6f37e4f90a05c7c4f31cf7fcdd9ad38-1767124697-1767121097', 'independent tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/12.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">independent tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(214, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/10/index.m3u8?token=616b50b6a12420f8583ba6357474ba6ad9229901-4ac247553b39a86bae27791e6ea5ff3b-1767124697-1767121097', 'duronto tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/10.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">duronto tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(213, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/9/index.m3u8?token=b77e7dacca5ca073bb66443a624d86d87bdf81a7-a87a942eca914448325664a7bd0d06cc-1767124697-1767121097', 'desh tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/9.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">desh tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(212, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/8/index.m3u8?token=b3df923810c51cc96003e9373be7c036f3f87752-6f29e558d3ed12842a8fcdbb64486f61-1767124697-1767121097', 'deepto tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/8.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">deepto tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(211, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/11/index.m3u8?token=3c4c4a13564b99af6f2a2ce3fd8c1c45de94cc05-15ade8993c2e603489ed27e310154b5a-1767124697-1767121097', 'ekattor tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/11.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ekattor tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(210, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/7/index.m3u8?token=7b760df0fcd702fb2ed45123edbc44453e957d4f-225197fc315028d23a4a8f5dfdee2287-1767124697-1767121097', 'dbc news', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/7.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">dbc news</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(209, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/6/index.m3u8?token=f8ca16e990d9aa39234021edf7041b1774702423-b241b93b0c633a6fdf5b6777a8283db6-1767124697-1767121097', 'channel i', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/6.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">channel i</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(208, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/4/index.m3u8?token=ce83d1cdc3c93dab402687fcaf41195eb3558441-066db3b8080566bb7cacf6680547600e-1767124697-1767121097', 'channel 9', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/4.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">channel 9</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(207, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/84/index.m3u8?token=250b7efd76679498a069b5a4c0a894ea1cf5f63c-95da25d0ea3c2641136c6126ed67baed-1767124697-1767121097', 'btv world', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/84.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">btv world</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(206, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/53/index.m3u8?token=b48170c0a840c67427d46c1e45ce4361dd2f6056-d3a626f7939e7717f0b05cb1440126eb-1767124697-1767121097', 'btv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/53.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">btv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(205, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/61/index.m3u8?token=c6b7fc26028f6a18e9859f06816a0a225086c591-7db8a6a2fc1b80e7d2e64349b15775aa-1767124697-1767121097', 'boishakhi tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/61.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">boishakhi tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(204, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/19/index.m3u8?token=6671a1e3143b0dfc854e2d9f2caeebdc8731bec8-c2dc0bf4fffbe40020c40e060325bec8-1767124697-1767121097', 'bangla tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/19.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">bangla tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(203, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/3/index.m3u8?token=c0b825af412df0372be7a1a29d525e79f8c83a20-8ce6a73c09d61a24519fc72a247b7431-1767124697-1767121097', 'banglavision tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/3.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">banglavision tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(202, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/49/index.m3u8?token=5620df8cc57c79411ee60a794d4d7373aaf18c71-268a046340ea20ec7a1624ef5183f862-1767124697-1767121097', 'atn news', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/49.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">atn news</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(201, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/2/index.m3u8?token=96241696377c2473bab88b92236da950a7e4b333-bd8d9be3e35638c97849f0fffc825b04-1767124697-1767121097', 'atn bangla', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/2.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">atn bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(200, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge/asian-tv/index.m3u8?token=e0deac473f534cfbfd109d58b868ac6604d54b29-8210ce371055f423ad954ff6c0525b55-1767124697-1767121097', 'asian tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/62.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">asian tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(199, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/65/index.m3u8?token=9368d7f7ed9dc28ee5949d90d0a374b7c10cddeb-c2273d0c2c5aafda33dc50c1629b1329-1767124697-1767121097', 'ekushy tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/65.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">ekushy tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(198, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge2/somoy/index.m3u8?token=56f64f3bcfbe32d2f79367fbed6df2977be7bced-660ca57e9fe25ec74ccf5e5c69a6bd2b-1767124697-1767121097', 'somoy tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/17.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">somoy tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(197, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge2/channel24/index.m3u8?token=4b5ba52eff270fb7631185fba35ee1d962ef1251-df8cde2e419865530996a88652982b89-1767124697-1767121097', 'channel 24', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/5.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">channel 24</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(196, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge2/nagorik/index.m3u8?token=fc480985eb1ed48b456ce20683e7c81561527ac6-25d8299e183cc2e544de020e087152ba-1767124697-1767121097', 'nagorik tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/59.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">nagorik tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(195, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/edge2/jamunatv/index.m3u8?token=5162997205ff952854b7a7f91911520c5cb9d430-b90424be9ab5bda1ddcf9f73dd325ef5-1767124697-1767121097', 'jamuna tv', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/13.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">jamuna tv</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(194, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/33/index.m3u8?token=042c21f792a62c883098b3b6f7264ba2603ce8c5-f9a6e0998af85dfea44ac70df5fcccaa-1767124697-1767121097', 'sony aath', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/33.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">sony aath</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(179, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/66/index.m3u8?token=86f603462054f169bd8b9540b2d4709162b8d543-321eabc8d1dc006ed9120cdcca9344c3-1767124697-1767121097', 'colors bangla', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/66.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">colors bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(178, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/29/index.m3u8?token=5425285a6483c61cd93b228b6d28a2958171678c-7b912e0c87157d9bdc0f1560ea553729-1767124697-1767121097', 'zee bangla cinema', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/29.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">zee bangla cinema</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(177, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/34/index.m3u8?token=be1784f5bfdaea9495e953a970004983a50acd79-314502730939a328044c5e768d3973c9-1767124697-1767121097', 'zee bangla', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/34.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">zee bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(176, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/31/index.m3u8?token=d3b2f51a99ea5714ceaf8050e11d488893ffa1f2-9e49001925f18ae7a47aa65cc80eb994-1767124697-1767121097', 'star jalsha movies', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/31.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">star jalsha movies</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(175, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://edge2.roarzone.info:8443/roarzone/bk/30/index.m3u8?token=797afe3f54d98d2fdc15a5198bb2aedc7e6e3a0e-7ab86367f95869241b8ef8ac73d46042-1767124697-1767121097', 'star jalsha', false, this.parentElement)">
                            <img src="http://tvassets.roarzone.info/images/30.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">star jalsha</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">inbangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(174, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/andpicture_hd/playlist.m3u8', '[BD] & Pictures HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/QMwWnZUBtpl-Sbt7S2sx/posters/8cad9a82-842a-47bf-a060-f17011f11c07.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] &amp;Pictures HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(84, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_turbo/playlist.m3u8', '[BD] Discovery Turbo', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ay6s-JQBv9knK3AHJTY1/posters/e8f65578-e82d-4e4a-a1ff-073becc5bd71.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Discovery Turbo</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(83, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_science/playlist.m3u8', '[BD] Discovery Science', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/AS6s-JQBv9knK3AHDTZb/posters/eab8fd0f-9351-464c-b45e-332f38b49f4b.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Discovery Science</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(82, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovary_investigation_hd/playlist.m3u8', '[BD] Investigation Discovery HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ay7uX5UBv9knK3AHs6TI/posters/deb3c186-b2e1-4a91-aafb-d86f9128b851.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Investigation Discovery HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(81, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/tlc_hd/playlist.m3u8', '[BD] TLC HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7S6j-JQBv9knK3AHbzXC/posters/0973097c-bc5c-4b28-aaca-f04d6f6cb5e2.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] TLC HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(80, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/tlc_sd/playlist.m3u8', '[BD] TLC', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7C6j-JQBv9knK3AHVzUA/posters/e8f84105-5efe-4e91-a0d4-18a0849cf2f2.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] TLC</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(79, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_masala/playlist.m3u8', '[BD] HUM Masala', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/T9O9X5UBm1RY_In7UXFv/posters/30e0f372-eb3e-4cf9-be1e-b196a40c2fc7.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] HUM Masala</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(78, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_hd/playlist.m3u8', '[BD] Discovery HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/KC6x-JQBv9knK3AHqjYc/posters/55e554f1-dbbb-47bd-97fe-fca878726c4c.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Discovery HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(77, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/euro_sports_hd/playlist.m3u8', '[BD] Eurosport HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Uy6Q-JQBv9knK3AHcDUQ/posters/01709bcd-6d53-4710-a64f-bc49cecf1d61.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Eurosport HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(76, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_sd/playlist.m3u8', '[BD] Discovery', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/KS6x-JQBv9knK3AHwDZy/posters/6594d216-aaca-4eee-b6f5-bbc6b80feb15.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Discovery</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(75, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/discovery_kids/playlist.m3u8', '[BD] Discovery Kids', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/1i6e-JQBv9knK3AHHTXR/posters/325887a7-84ea-4cf9-a6fd-6111ddc25671.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Discovery Kids</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(72, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_entertainment/playlist.m3u8', '[BD] Sony Entertainment Television', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/2S5t-JQBv9knK3AHJTTW/posters/ae74f943-77c9-4395-a16c-8ed84b439080.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Entertainment Television</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(71, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_max_hd/playlist.m3u8', '[BD] Sony MAX HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ai51-JQBv9knK3AH_jWs/posters/663e52a6-1a9f-4458-b4aa-7c03d84972f1.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony MAX HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(70, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/cartoon_network_hd/playlist.m3u8', '[BD] Cartoon Network HD +', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/1y6e-JQBv9knK3AHNDWb/posters/ee9ba01b-1bcf-436b-b273-7b857f0810fb.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Cartoon Network HD +</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(69, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/b4u_movies/playlist.m3u8', '[BD] B4U Movies APAC', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PC6F-JQBv9knK3AHlTUO/posters/fb0243ba-39a0-4101-a78c-c197be550c6c.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] B4U Movies APAC</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(68, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/cartoon_network_sd/playlist.m3u8', '[BD] Cartoon Network', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/mC6W-JQBv9knK3AHfDWA/posters/d2a02d82-fde4-4769-a6d9-95c0560e2120.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Cartoon Network</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(67, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/pogo_sd/playlist.m3u8', '[BD] POGO', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ny6W-JQBv9knK3AHujXC/posters/7e7c2afe-a663-4c09-983a-2d0fa0f1ca9a.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] POGO</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(66, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonypix_hd/playlist.m3u8', '[BD] Sony PIX HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ly6C-JQBv9knK3AHOjXt/posters/252e64ca-8d99-46e7-a951-e10c1703c11d.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony PIX HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(65, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/b4u_music/playlist.m3u8', '[BD] B4U Music', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PS6F-JQBv9knK3AHqjVz/posters/0f83ee72-be0f-4861-94df-30b158d3df8d.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] B4U Music</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(64, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-11/index.m3u8', '[BD] BFL | Live 1', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/HHnAgJkBcqxnFHJBabwO/posters/c5bce54b-66b1-4e4f-9a7f-45a551e16f49.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] BFL | Live 1</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(63, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/icc_wtc_final/playlist.m3u8', '[BD] ICC Test Championship Highlights', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PnZefJcBcqxnFHJBoxca/posters/955ae898-8336-4936-8d78-c6b8866e35f7.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] ICC Test Championship Highlights</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(62, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_sitaray/playlist.m3u8', '[BD] HUM Sitaray', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/WtPBX5UBm1RY_In7mXEU/posters/188d51f6-aeef-41ed-835b-e25ff911e209.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] HUM Sitaray</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(61, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/hum_tv/playlist.m3u8', '[BD] HUM', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/0C63X5UBv9knK3AHxaOs/posters/6dce1143-1045-4fec-ac4f-86d2bfb32447.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] HUM</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(60, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/cnn/playlist.m3u8', '[BD] CNN', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/VC6Q-JQBv9knK3AHhTXt/posters/63e79814-8fcf-4c3e-bb66-408b2a402613.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] CNN</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(59, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyentertainmnt_hd/playlist.m3u8', '[BD] Sony Entertainment Television HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/-y50-JQBv9knK3AHLzSn/posters/0ab48ac0-ec84-4ca2-9601-746ff3cb809e.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Entertainment Television HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(58, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-12/index.m3u8', '[BD] BFL | Live 2', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MXnGgJkBcqxnFHJBILyR/posters/fc0d65fb-78c4-481a-a2ce-775796e3b39e.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] BFL | Live 2</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(57, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-18/index.m3u8', '[BD] BFL | Live 4', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ey9jtJoBNnOkwJLWw06R/posters/4e83252b-223d-42a6-a56b-8598aa17e2e8.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] BFL | Live 4</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(56, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-13/index.m3u8', '[BD] BFL | Live 3', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/LnlKhJkBcqxnFHJBU8GM/posters/74e6a7bb-f850-4ec5-991f-7a882b04db37.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] BFL | Live 3</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(55, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-5/index.m3u8', '[BD] EPL Channel 5', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/6CHi_5gBEef-9-uV-Bx_/posters/95066512-a117-4532-8569-0d13ffc046ef.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] EPL Channel 5</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(54, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-4/index.m3u8', '[BD] EPL Channel 4', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/OyEz-ZgBEef-9-uVnhcx/posters/f2143475-cf44-441a-b55d-58b2b5569aa5.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] EPL Channel 4</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(53, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-3/index.m3u8', '[BD] EPL channel 3', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Pi1TqZgBNnOkwJLWVggf/posters/d0bb78b5-4690-4c12-9c7b-e785eb8d7336.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] EPL channel 3</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(52, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonysab_hd/playlist.m3u8', '[BD] Sony SAB HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ES55-JQBv9knK3AHNDWC/posters/13411be9-62b9-4a99-a062-b6e91dfb1099.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony SAB HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(51, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_action/playlist.m3u8', '[BD] Zee Action', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Pc3RD5YBtpl-Sbt7doxr/posters/33d667ae-bcc3-4f6b-b376-76c552136923.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Action</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(50, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_cinema_hd/playlist.m3u8', '[BD] Zee Cinema HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/5y7HX5UBv9knK3AHs6Nk/posters/7582fb79-c15f-4247-ba5b-1d2dd27f3d71.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Cinema HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(49, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bangla_cinema/playlist.m3u8', '[BD] Zee Bangla Cinema', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/-C7MX5UBv9knK3AHdKOi/posters/90d82846-70b9-44ee-9f7e-e440f00b3be8.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Bangla Cinema</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(48, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bangla/playlist.m3u8', '[BD] Zee Bangla', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/kK2aX5UBrjBfS2_RBcKf/posters/ba5dd8dc-4f87-414a-b57f-c9ecdeda5253.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Bangla</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(47, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/and_tv_hd/playlist.m3u8', '[BD] &TV HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/5cwRnZUBtpl-Sbt7wWrN/posters/5779ade3-e9ba-4107-b3da-bae6f891500a.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] &amp;TV HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(46, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_bollywood/playlist.m3u8', '[BD] Zee Bollywood', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/OnSlPJYBcqxnFHJB6lFX/posters/d9ccb2a6-227f-4a41-8714-efaddab5cf5e.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Bollywood</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(45, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_anmol/playlist.m3u8', '[BD] Zee Anmol', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/7x0Jd5YBEef-9-uVv_Gy/posters/f9c07bfc-9fde-40d0-91a1-e28c5840f400.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Anmol</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(44, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zing_sd/playlist.m3u8', '[BD] Zing', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/DK8dd5YBrjBfS2_Ru22e/posters/a4e57fd0-1853-4540-a9bc-0265ee43b5cb.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zing</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(43, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_cafe_hd/playlist.m3u8', '[BD] Zee Cafe', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/U3QEd5YBcqxnFHJBpYzc/posters/8bc7ae1b-1a46-4b76-bdb1-13c7dbd3a95c.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee Cafe</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(42, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/zee_tv_hd/playlist.m3u8', '[BD] Zee TV HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ltPQX5UBm1RY_In7b3F1/posters/d039d9df-9877-4969-a0b6-56888ebe2385.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Zee TV HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(41, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/toffee_drama/playlist.m3u8', '[BD] Toffee Dramas', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/DNMXs5UBm1RY_In7IJ72/posters/5638c4e8-36ba-4e8e-848e-233183b3ec17.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Toffee Dramas</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(40, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/toffee_movie/playlist.m3u8', '[BD] Toffee Movies', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/b60Ss5UBrjBfS2_RJPb8/posters/2e5b8ff3-9deb-4040-947e-4ce6a4674ef0.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Toffee Movies</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(39, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonybbc_earth_hd/playlist.m3u8', '[BD] Sony BBC Earth HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MC6C-JQBv9knK3AHUzUT/posters/a8c32fd3-2ba7-437c-85ac-de2f1b2fa6ca.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony BBC Earth HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(38, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonymax_2/playlist.m3u8', '[BD] Sony MAX 2', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ii5_-JQBv9knK3AHLDV3/posters/d961cc87-81b6-4b30-8414-8c0af2774818.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony MAX 2</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(37, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyyay/playlist.m3u8', '[BD] Sony YAY', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/IC5_-JQBv9knK3AHFDXh/posters/36df4012-80f2-4a98-9970-3b663f62093f.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony YAY</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(36, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_max/playlist.m3u8', '[BD] Sony MAX', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Ay52-JQBv9knK3AHFDWt/posters/00afb30b-3c19-4c4c-abd8-891db94e4767.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony MAX</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(35, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sonyaath/playlist.m3u8', '[BD] Sony Aath', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/xi6xX5UBv9knK3AH9aMk/posters/f4db1c12-b10f-46e8-a09b-e0efb8820970.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Aath</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(34, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/ten_cricket/playlist.m3u8', '[BD] Sony Ten Cricket', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ra2x_pQBrjBfS2_RWG9l/posters/795170c2-ec78-457e-9fa0-54a23d23361c.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Ten Cricket</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(33, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_5_hd/playlist.m3u8', '[BD] Sony Ten Sports 5 HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/vi5n-JQBv9knK3AHqzTC/posters/241705c1-06a9-4694-92c6-0013d1879e42.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Ten Sports 5 HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(32, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_1_hd/playlist.m3u8', '[BD] Sony Ten Sports 1 HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/py5j-JQBv9knK3AHxDTY/posters/ea3358b9-2bec-4615-a889-daa2e396c74c.webp" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Ten Sports 1 HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(31, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/sony_sports_2_hd/playlist.m3u8', '[BD] Sony Ten Sports 2 HD', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/sy5m-JQBv9knK3AHYTTk/posters/5e40bf0e-633f-4d37-a3b2-3d606f0ac19a.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Sony Ten Sports 2 HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(30, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-2/index.m3u8', '[BD] EPL channel 2', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Mi1QqZgBNnOkwJLWxggo/posters/3e9d4d0a-a346-4b39-92b5-13e9238ad240.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] EPL channel 2</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(29, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/bangla_tv/playlist.m3u8', '[BD] Bangla TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/JiK-_poBEef-9-uVZv6L/posters/757a328e-70d6-45de-b093-0a843c69ade7.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Bangla TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(28, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/asian_tv/playlist.m3u8', '[BD] Asian TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/MyK__poBEef-9-uVmf5l/posters/1eadef5b-28e7-4dc2-b42f-c67a3357c9a0.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Asian TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(27, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/ekhon_tv/playlist.m3u8', '[BD] Ekhon TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/o3v235oBcqxnFHJBkAdC/posters/159af631-796d-4342-a2a7-c272f32bcd32.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Ekhon TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(26, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/global_tv/playlist.m3u8', '[BD] Global TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/0y_tDJsBNnOkwJLWNrdE/posters/2ff058e1-630f-4657-8dc6-b677e65642c5.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Global TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(25, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/channel_s_tv/playlist.m3u8', '[BD] Channel S', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/WyPuDJsBEef-9-uVUA_z/posters/ea20055c-a824-443c-8083-ce8e2da8b922.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Channel S</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(24, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/ekattor_tv/playlist.m3u8', '[BD] Ekattor TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/PS_La5oBNnOkwJLWLRN_/posters/e8c444fd-ee3b-4bf3-bb0a-f969bc295f82.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Ekattor TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(23, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/channel_i/playlist.m3u8', '[BD] Channel i', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/qnv835oBcqxnFHJBuQcB/posters/348dfac3-c1e0-485d-a72b-3d282c9e2c73.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Channel i</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(22, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/somoy_tv/playlist.m3u8', '[BD] Somoy TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/Xi_Ga5oBNnOkwJLWkhKP/posters/ef2899d5-1ae0-4fee-aee5-45f9b0b3ba80.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Somoy TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(21, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://bldcmprod-cdn.toffeelive.com/cdn/live/independent_tv/playlist.m3u8', '[BD] Independent TV', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/ES_cZZsBNnOkwJLW1Oz1/posters/b872b8f5-cb6b-45a1-a1cd-7609df51d614.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] Independent TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(20, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mprod-cdn.toffeelive.com/live/match-1/index.m3u8', '[BD] EPL channel 1', false, this.parentElement)">
                            <img src="https://assets-prod.services.toffeelive.com/f_png,w_300,q_85/JS1AqZgBNnOkwJLWlwg-/posters/08617b27-2af1-4035-bcc3-d054ce42ca4b.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">[BD] EPL channel 1</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">[LIVE] BDIX ♛</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(19, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('http://mtv.sunplex.live/MAASRANGA-TV/index.m3u8', 'MAASRANGA HD', false, this.parentElement)">
                            <img src="https://static.wikia.nocookie.net/etv-gspn-bangla/images/a/a3/Maasranga_TV_HD_logo.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">MAASRANGA HD</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(8, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://mytvbangla.com/0.m3u8', 'MY TV', false, this.parentElement)">
                            <img src="https://raw.githubusercontent.com/subirkumarpaul/Logo/main/My%20TV.svg.png" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">MY TV</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(7, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('http://live.matribhumitv.com/music-bangla/index.m3u8', 'MUSIC BANGLA', false, this.parentElement)">
                            <img src="https://static.wikia.nocookie.net/logopedia/images/7/75/Music_Bangla_new.jpeg" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">MUSIC BANGLA</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">Bangla</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(6, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                    <div class="channel-item bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3 mb-2 relative overflow-hidden group">
                        <div class="flex-grow flex items-center gap-3 cursor-pointer" onclick="playChannel('https://dbcanada.sonarbanglatv.com/deshebideshe/dbtv/index.m3u8', 'Deshe Bideshe', false, this.parentElement)">
                            <img src="https://pbs.twimg.com/profile_images/739539785304281088/zMwNO936_400x400.jpg" class="w-8 h-8 rounded object-contain bg-slate-200" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                            <div class="w-8 h-8 rounded bg-indigo-100 text-indigo-500 flex items-center justify-center font-bold text-xs hidden">
                                <i class="fas fa-tv"></i>
                            </div>
                            <div class="overflow-hidden w-full">
                                <h4 class="text-xs font-bold text-slate-700 truncate channel-name">Deshe Bideshe</h4>
                                <p class="text-[9px] text-slate-400 bg-slate-100 inline-block px-1.5 rounded mt-1 truncate max-w-full">BANGLA</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 ml-auto z-10">
                            <button onclick="toggleFav(4, this)" class="fav-btn text-slate-300 hover:text-red-500 transition ">
                                <i class="far fa-heart"></i>
                            </button>
                            <i class="fas fa-play text-slate-300 text-xs"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            var video = document.getElementById('video');
            var hls = null;
            var premiumMsg = document.getElementById('premium-msg');
            var isPremiumUser = false;

            // মোবাইল সাপোর্টের জন্য PiP চেক
            document.addEventListener('DOMContentLoaded', () => {
                if (!document.pictureInPictureEnabled && !video.webkitSupportsPresentationMode) {// যদি ব্রাউজার মোটেও সাপোর্ট না করে, বাটনটি হাইড করতে পারেন অথবা রেখে দিতে পারেন
                // document.getElementById('pip-btn').style.display = 'none';
                }
            }
            );

            // Favorite Toggle
            function toggleFav(channelId, btn) {
                var icon = btn.querySelector('i');
                var formData = new FormData();
                formData.append('toggle_fav', '1');
                formData.append('channel_id', channelId);

                fetch('live_tv.php', {
                    method: 'POST',
                    body: formData
                }).then(response => response.text()).then(data => {
                    if (data.trim() === 'added') {
                        btn.classList.add('fav-active');
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    } else if (data.trim() === 'removed') {
                        btn.classList.remove('fav-active');
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                }
                );
            }

            function playChannel(url, name, isLocked, element) {
                document.getElementById('select-msg').classList.add('hidden');

                document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active-channel'));
                if (element)
                    element.classList.add('active-channel');

                document.getElementById('current-channel-name').innerText = name;

                if (isLocked) {
                    video.pause();
                    document.getElementById('player-overlay').classList.add('hidden');
                    premiumMsg.classList.remove('hidden');
                    premiumMsg.classList.add('flex');
                    return;
                }

                premiumMsg.classList.add('hidden');
                premiumMsg.classList.remove('flex');
                document.getElementById('player-overlay').classList.remove('hidden');

                if (Hls.isSupported()) {
                    if (hls) {
                        hls.destroy();
                    }
                    hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        document.getElementById('player-overlay').classList.add('hidden');
                        video.play().catch(e => console.log("Auto-play blocked"));
                    });
                    hls.on(Hls.Events.ERROR, function(event, data) {
                        if (data.fatal) {
                            document.getElementById('player-overlay').innerHTML = '<p class="text-red-500 text-xs font-bold">Offline / Error</p>';
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                    video.addEventListener('loadedmetadata', function() {
                        document.getElementById('player-overlay').classList.add('hidden');
                        video.play();
                    });
                }
            }

            function filterChannels() {
                var input = document.getElementById("searchBox");
                var filter = input.value.toUpperCase();
                var list = document.getElementById("channel-list");
                var items = list.getElementsByClassName("channel-item");

                for (var i = 0; i < items.length; i++) {
                    var h4 = items[i].getElementsByClassName("channel-name")[0];
                    var txtValue = h4.textContent || h4.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        items[i].style.display = "";
                    } else {
                        items[i].style.display = "none";
                    }
                }
            }

            function toggleFullScreen() {
                if (video.requestFullscreen) {
                    video.requestFullscreen();
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
            }

            async function togglePiP() {
                if (!isPremiumUser) {
                    if (confirm("PiP is a Premium feature. Buy Premium Pack?")) {
                        document.getElementById('premium-msg').classList.remove('hidden');
                        document.getElementById('premium-msg').classList.add('flex');
                    }
                    return;
                }

                try {
                    if (video !== document.pictureInPictureElement) {
                        await video.requestPictureInPicture();
                    } else {
                        await document.exitPictureInPicture();
                    }
                } catch (error) {
                    // Android Chrome এর জন্য ফলব্যাক বা এরর হ্যান্ডলিং
                    console.log("PiP Error: " + error);

                    // যদি Standard API ফেইল করে এবং Safari (iOS) হয়
                    if (video.webkitSetPresentationMode) {
                        video.webkitSetPresentationMode(video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture");
                    } else {
                        alert("PiP is not supported or failed to start in this browser.");
                    }
                }
            }

            // --- Activity Keeper (Heartbeat) ---
            setInterval( () => {
                fetch('live_tv.php?ping=1').catch(e => {}
                );
            }
            , 60000);
        </script>
    </body>
</html>
